import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

import type { ScanFailure } from "./ScanCodeDialog";

// The REAL scanner behind the "Scan" form: a camera stream plus a barcode
// decoder, kept apart from the dialog so the dialog stays pure layout and the
// fake scanner can take the same shape.
//
// WHY A WASM DECODER. Browsers have a built-in `BarcodeDetector`, but Safari
// does not ship it and Roopairs is an iOS PWA — so the decoding is done by
// zxing-wasm (the zxing-cpp build). The module is loaded the first time the
// dialog opens, never at page load, and the .wasm travels with the bundle
// rather than being fetched from a CDN (the `?url` import above) so the
// scanner works on a published Storybook with no third-party request.
//
// WHY IT NEEDS HTTPS. `getUserMedia` only runs in a secure context: a real
// https site or localhost. Over a LAN IP it throws before the camera is ever
// touched, which is what `noSecureConnection` reports.

/** The formats production registers: the 2D codes plus the retail/industrial 1D ones. */
const FORMATS = [
  "QRCode",
  "MicroQRCode",
  "DataMatrix",
  "Aztec",
  "PDF417",
  "EAN-13",
  "EAN-8",
  "UPC-A",
  "UPC-E",
  "Code128",
  "Code39",
  "Code93",
  "ITF",
  "Codabar",
] as const;

/** How often a frame is read. Faster than this only heats the phone. */
const FRAME_MS = 250;

export interface CameraOption {
  id: string;
  label: string;
}

export interface CameraScanner {
  /** Attach to the <video> the preview draws. */
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  /** The scanner is still starting: the decoder, the permission, the first frame. */
  preparing: boolean;
  /** The cameras this device offers. Empty until permission is granted. */
  cameras: CameraOption[];
  /** The camera in use. */
  cameraId: string | null;
  selectCamera: (id: string) => void;
  /** The camera has a usable flashlight. */
  hasTorch: boolean;
  torchOn: boolean;
  toggleTorch: () => void;
  /** Set when the camera or the decoder could not run — the dialog's failure states. */
  failure: ScanFailure | undefined;
  /** Start again after a failure ("Try again"). */
  retry: () => void;
}

/**
 * What went wrong, in the dialog's own vocabulary. The DOMException names
 * getUserMedia throws map almost one to one onto the states the design draws.
 */
const failureOf = (error: unknown): ScanFailure => {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "noCameraAccess";
    case "NotFoundError":
    case "OverconstrainedError":
      return "noCameraFound";
    // The camera exists but another app, tab or track holds it.
    case "NotReadableError":
    case "AbortError":
      return "cameraIsBusy";
    case "TypeError":
      // getUserMedia is missing entirely — an insecure context (a LAN IP) or a
      // browser without the API.
      return window.isSecureContext ? "cannotScan" : "noSecureConnection";
    default:
      return "notWorking";
  }
};

// `torch` is not in the standard typings on either side — not as a capability
// a track reports, nor as a constraint it accepts — so both are declared here.
// Every browser that HAS a flashlight uses exactly these names.
type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraints = MediaTrackConstraints & { advanced?: { torch: boolean }[] };

export default function useCameraScanner({
  active,
  onRead,
}: {
  /** Run the camera. False releases it — a camera must never stay on unseen. */
  active: boolean;
  /** A code was read. Called at most once per frame, never while one is pending. */
  onRead: (code: string) => void;
}): CameraScanner {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const decodingRef = useRef(false);
  // The callback is held in a ref so changing it does not restart the camera.
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const [preparing, setPreparing] = useState(true);
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [failure, setFailure] = useState<ScanFailure | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setTorchOn(false);
  }, []);

  useEffect(() => {
    if (!active) {
      stop();
      return undefined;
    }

    let cancelled = false;
    setPreparing(true);
    setFailure(undefined);

    const run = async () => {
      // 1. The decoder. Loaded before the camera so the viewfinder never opens
      //    on a scanner that can not read yet.
      let readBarcodes: typeof import("zxing-wasm/reader").readBarcodes;
      try {
        const zxing = await import("zxing-wasm/reader");
        zxing.prepareZXingModule({ overrides: { locateFile: () => wasmUrl }, fireImmediately: false });
        readBarcodes = zxing.readBarcodes;
      } catch {
        if (!cancelled) {
          setFailure("scannerCouldNotLoad");
          setPreparing(false);
        }
        return;
      }

      // 2. The camera. The back camera is the default — a part is held away
      //    from the person, not towards them.
      let stream: MediaStream;
      try {
        if (navigator.mediaDevices?.getUserMedia == null) throw new TypeError("getUserMedia is unavailable");
        stream = await navigator.mediaDevices.getUserMedia({
          video: cameraId != null ? { deviceId: { exact: cameraId } } : { facingMode: { ideal: "environment" } },
        });
      } catch (error) {
        if (!cancelled) {
          setFailure(failureOf(error));
          setPreparing(false);
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      // 3. The list of cameras, and the torch. Labels are only filled in once
      //    permission has been granted, which is why this runs after the
      //    stream and not before it.
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          const videos = devices.filter((device) => device.kind === "videoinput");
          setCameras(videos.map((device, i) => ({ id: device.deviceId, label: device.label || `Camera ${i + 1}` })));
          const current = stream.getVideoTracks()[0]?.getSettings().deviceId;
          if (current != null) setCameraId(current);
        }
      } catch {
        // A device list is a convenience — a camera that works without one is
        // still a working camera.
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as TorchCapabilities | undefined;
      setHasTorch(capabilities?.torch === true);

      // 4. The preview.
      const video = videoRef.current;
      if (video == null) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      // iOS will not play an inline video that is not muted (and a scanner has
      // no business with sound anyway).
      video.muted = true;
      video.playsInline = true;
      try {
        await video.play();
      } catch (error) {
        if (!cancelled) {
          setFailure(failureOf(error));
          setPreparing(false);
        }
        return;
      }
      if (cancelled) return;
      setPreparing(false);

      // 5. The read loop. One frame every FRAME_MS, drawn to a canvas and
      //    handed to the decoder; a frame is skipped while the previous one is
      //    still being read, so a slow decode can not queue up.
      const canvas = (canvasRef.current ??= document.createElement("canvas"));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context == null) {
        setFailure("notWorking");
        return;
      }

      timerRef.current = window.setInterval(async () => {
        const el = videoRef.current;
        if (el == null || decodingRef.current || el.readyState < 2) return;
        // The track ending under us is a camera that stopped — another app
        // took it over, or the phone locked.
        if (streamRef.current?.getVideoTracks()[0]?.readyState === "ended") {
          stop();
          setFailure("stopped");
          return;
        }
        decodingRef.current = true;
        try {
          canvas.width = el.videoWidth;
          canvas.height = el.videoHeight;
          if (canvas.width === 0 || canvas.height === 0) return;
          context.drawImage(el, 0, 0, canvas.width, canvas.height);
          const results = await readBarcodes(context.getImageData(0, 0, canvas.width, canvas.height), {
            formats: [...FORMATS],
            tryHarder: true,
            maxNumberOfSymbols: 1,
          });
          const hit = results.find((result) => result.isValid && result.text !== "");
          if (hit != null && !cancelled) onReadRef.current(hit.text);
        } catch {
          // One unreadable frame is not a failure — the next one is 250ms away.
        } finally {
          decodingRef.current = false;
        }
      }, FRAME_MS);
    };

    void run();

    return () => {
      cancelled = true;
      stop();
    };
    // `cameraId` restarts the stream on purpose: picking another camera is a
    // new getUserMedia call. `attempt` is what "Try again" bumps.
  }, [active, cameraId, attempt, stop]);

  const selectCamera = useCallback((id: string) => {
    setCameraId(id);
    setTorchOn(false);
  }, []);

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track == null) return;
    const next = !torchOn;
    track
      .applyConstraints({ advanced: [{ torch: next }] } as TorchConstraints)
      .then(() => setTorchOn(next))
      .catch(() => setHasTorch(false));
  }, [torchOn]);

  const retry = useCallback(() => {
    stop();
    setAttempt((n) => n + 1);
  }, [stop]);

  return { videoRef, preparing, cameras, cameraId, selectCamera, hasTorch, torchOn, toggleTorch, failure, retry };
}
