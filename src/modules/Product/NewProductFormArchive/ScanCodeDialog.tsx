import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import Button from "../../../components/Button/Button";
import Chip from "../../../components/Chip/Chip";
import Dialog from "../../../components/Dialog/Dialog";
import { Icon } from "../../../components/Icon/Icon";
import { Divider } from "../../../components/Divider/Divider";
import EmptyState from "../../../components/EmptyState/EmptyState";
import SelectField from "../../../components/Fields/SelectField/SelectField";
import Input from "../../../components/Input/Input";
import PopoverFooter from "../../../components/Popover/PopoverFooter";
import SelectListItem from "../../../components/SelectList/SelectListItem";
import SelectListItemGroup from "../../../components/SelectList/SelectListItemGroup";
import useIsDesktop from "../../../hooks/useIsDesktop";
import { SelectPopoverList, useSelectPopover } from "../../shared/selectPopover";

import { MAX_BARCODE, stripControlCharacters } from "./productRules";
import { TEXT_SEPARATOR } from "../../../utils/textSeparator";
import useCameraScanner from "./useCameraScanner";

import scanFeed from "../../../assets/scan-preview.jpg";

import styles from "./ScanCodeDialog.module.scss";

// The "Scan code" dialog (Figma "Scan Code" Form, 4011-9592): the camera
// keeps running, the last code read waits under the viewfinder with its
// registration status, and "Use code" hands it to the Barcode field.
//
// Updated 2026-10-17: the title, "Use code" (was Register), "Type code" (was
// "Type it instead"), the too-long line now counts the characters, a camera
// FAILURE hides the footer, and the phone's footer is "Use code" alone, full
// width — the drawer is closed by its own drag handle.
//
// THE CAMERA IS REAL (2026-10-14) — see useCameraScanner.ts for the stream and
// the zxing-wasm decoder. It needs a secure context: an https page or
// localhost. Over a LAN IP `getUserMedia` does not exist and the dialog shows
// "No secure connection", which is the honest answer rather than a bug.
//
// `simulated` keeps the FAKE scanner the states were built against: tapping
// the viewfinder reads the next demo code over a still picture. Every result
// and every camera failure is reachable that way, which a real camera will not
// do on demand — so the state stories use it and the product does not.

/** Every failure the design draws, named as its frame is. */
export type ScanFailure =
  | "noCameraAccess"
  | "noCameraFound"
  | "cameraIsBusy"
  | "noSecureConnection"
  | "cannotScan"
  | "didNotStart"
  | "stopped"
  | "notWorking"
  | "scannerCouldNotLoad";

/** The copy of each failure, and what the user can do about it. */
const FAILURES: Record<
  ScanFailure,
  { title: string; caption: string | ((cameras: number) => string); action: "retry" | "type"; keepsCamera: boolean }
> = {
  noCameraAccess: {
    title: "Camera access is blocked",
    caption: "Allow the camera for this site in your browser settings, then try again",
    action: "retry",
    keepsCamera: false,
  },
  noCameraFound: {
    title: "No camera found",
    caption: "This device has no camera Roopairs can use. Type the code instead.",
    action: "type",
    keepsCamera: false,
  },
  cameraIsBusy: {
    title: "The camera is busy",
    caption: "Another app or tab is using the camera. Close it, then try again.",
    action: "retry",
    keepsCamera: false,
  },
  noSecureConnection: {
    title: "No secure connection",
    caption: "Open Roopairs over HTTPS to scan",
    action: "type",
    keepsCamera: false,
  },
  cannotScan: {
    title: "This browser can't scan",
    caption: "Update your browser, or type the code instead",
    action: "type",
    keepsCamera: false,
  },
  // The three recoverable ones keep the Camera input: a camera has already run,
  // so the list of cameras exists and another one can be picked.
  didNotStart: {
    title: "The camera didn't start",
    // The node's annotation: ", or pick another camera" is only shown if there
    // are more than one camera on the list.
    caption: (cameras) => (cameras > 1 ? "Try again, or pick another camera" : "Try again"),
    action: "retry",
    keepsCamera: true,
  },
  stopped: { title: "The camera stopped", caption: "Another app may have taken it over. Try again.", action: "retry", keepsCamera: true },
  notWorking: { title: "The camera isn't working", caption: "Try again", action: "retry", keepsCamera: true },
  scannerCouldNotLoad: {
    title: "The scanner couldn't load",
    caption: "Check your connection, then try again",
    action: "retry",
    keepsCamera: false,
  },
};

/** The cameras the FAKE scanner offers. One name = the input stays read-only. */
const FAKE_CAMERAS = ["Back Triple Camera", "Front Camera"];

/** What the scanner is doing. "result" holds the last code read. */
type Phase = "preparing" | "idle" | "scanning" | "result";

/** What came back about the last code read. */
type Result = "ok" | "tooLong" | "taken" | "unreachable";

export interface ScanCodeDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Use code" hands the code to the field and closes. */
  onRegister: (code: string) => void;
  /**
   * The products a code is already registered to, by code. A scan that hits
   * one shows "Already registered to …" and "Use code" stays disabled.
   */
  registered?: Record<string, string>;
  /**
   * Use the FAKE scanner: a still picture that reads the next demo code when
   * it is tapped. For stories and tests — a real camera can not be asked for a
   * code that is too long. Default false.
   */
  simulated?: boolean;
  /** FAKE only. What the camera reads, in order, each time the preview is tapped. */
  demoCodes?: string[];
  /**
   * FAKE only. Codes whose registration check can not finish — the "Couldn't
   * check" state. The code is still registerable: the warning says only that
   * Roopairs could not look it up.
   */
  unreachableCodes?: string[];
  /** FAKE only. Draw a camera failure instead of the viewfinder. */
  state?: ScanFailure;
  breakpoint?: "auto" | "desktop" | "mobile";
}

/**
 * The long demo code is BUILT, not typed, so its length can never drift away
 * from the rule it is meant to test.
 */
const TOO_LONG_CODE = `RP-TOO-LONG-${Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(4, "0")).join("-")}-END`;

/**
 * Free → too long → already registered → the check could not run. The third
 * one is the evaporator fan motor's code in the demo database; the first and
 * last belong to nothing, so they really are free.
 */
const DEFAULT_CODES = ["RP-PART-4410", TOO_LONG_CODE, "RP-PART-7741", "RP-PART-5520"];
const DEFAULT_UNREACHABLE = ["RP-PART-5520"];

/** How long the fake read takes, and how long a real code's lookup is shown. */
const SCAN_MS = 800;
const LOOKUP_MS = 400;
/** The mask holds its colour for a second — both result annotations say so. */
const FLASH_MS = 1000;

export default function ScanCodeDialog({
  open,
  onClose,
  onRegister,
  registered = {},
  simulated = false,
  demoCodes = DEFAULT_CODES,
  unreachableCodes = DEFAULT_UNREACHABLE,
  state,
  breakpoint = "auto",
}: ScanCodeDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const cameraPop = useSelectPopover(mobile);

  const [phase, setPhase] = useState<Phase>("preparing");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>("ok");
  const [owner, setOwner] = useState<string | undefined>(undefined);
  const [fakeCamera, setFakeCamera] = useState(FAKE_CAMERAS[0]);
  const [fakeLight, setFakeLight] = useState(false);
  const [flash, setFlash] = useState<"none" | "good" | "bad">("none");
  const nextCode = useRef(0);
  const timers = useRef<number[]>([]);
  // The code the result row is showing, read synchronously by the camera loop
  // so the same label is not re-read 4 times a second.
  const shownCode = useRef("");

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Everything a read produces, from either scanner.
  const land = (raw: string) => {
    // "Invisible characters are removed from the scanned code before the
    // duplicate check."
    const value = stripControlCharacters(raw);
    const taken = registered[value];
    const next: Result =
      value.length > MAX_BARCODE ? "tooLong" : taken != null ? "taken" : unreachableCodes.includes(value) && simulated ? "unreachable" : "ok";
    shownCode.current = value;
    setCode(value);
    setOwner(taken);
    setResult(next);
    setPhase("result");
    const bad = next === "tooLong" || next === "taken";
    // Green for a code that can be registered, red for one that can not. A
    // check that did not finish leaves the mask NEUTRAL — the node's "Couldn't
    // Check" frame draws the resting black, and it is a warning, not a
    // failure: it buzzes once and "Use code" stays on.
    setFlash(bad ? "bad" : next === "unreachable" ? "none" : "good");
    navigator.vibrate?.(bad ? [60, 60, 60] : 60);
    later(() => setFlash("none"), FLASH_MS);
  };

  // ---- the real camera ----
  // A read goes through "Scanning…" first: the decode has happened, but
  // whether the code is already registered is a question for the server, and
  // that beat is the state the design draws.
  const scanner = useCameraScanner({
    active: open && !simulated,
    onRead: (value) => {
      if (value === shownCode.current || phase === "scanning") return;
      shownCode.current = value;
      setPhase("scanning");
      later(() => land(value), LOOKUP_MS);
    },
  });

  useEffect(() => {
    if (!open) return undefined;
    setPhase("preparing");
    setCode("");
    shownCode.current = "";
    setFakeLight(false);
    setFlash("none");
    nextCode.current = 0;
    // The fake scanner's own warm-up. The real one reports its own readiness.
    if (simulated) later(() => setPhase("idle"), 900);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [open, simulated]);

  // The real scanner drives the preparing state: the decoder and the camera
  // take a beat, and the design draws that beat as a black preview.
  useEffect(() => {
    if (simulated || !open) return;
    if (!scanner.preparing && phase === "preparing") setPhase("idle");
    if (scanner.preparing && phase !== "preparing") setPhase("preparing");
    // `phase` is deliberately not a dependency: this only reacts to the
    // scanner's own readiness changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanner.preparing, simulated, open]);

  // A read on the FAKE scanner: tap the viewfinder.
  const readCode = () => {
    if (!simulated || phase === "preparing" || phase === "scanning" || state) return;
    setPhase("scanning");
    setFlash("none");
    later(() => {
      const value = demoCodes[nextCode.current % demoCodes.length] ?? "";
      nextCode.current += 1;
      land(value);
    }, SCAN_MS);
  };

  // A forced failure (stories) wins; otherwise the camera reports its own.
  const failureKey = state ?? (simulated ? undefined : scanner.failure);
  const failure = failureKey ? FAILURES[failureKey] : undefined;
  const showCamera = !failure || failure.keepsCamera;
  const canRegister = phase === "result" && (result === "ok" || result === "unreachable");

  // The cameras, the torch and the retry come from whichever scanner is running.
  const cameraNames = simulated ? FAKE_CAMERAS : scanner.cameras.map((camera) => camera.label);
  const cameraValue = simulated ? fakeCamera : (scanner.cameras.find((camera) => camera.id === scanner.cameraId)?.label ?? "");
  const showTorch = simulated ? mobile : scanner.hasTorch;
  const torchOn = simulated ? fakeLight : scanner.torchOn;

  // The line under the viewfinder: a hint while nothing has been read, the code
  // itself once something has.
  const hint =
    phase === "preparing"
      ? "Preparing the scanner…"
      : phase === "scanning"
        ? "Scanning…"
        : phase === "idle"
          ? "Point the camera at a QR code or barcode"
          : undefined;

  // The second line — why the code can not be registered, or that the check
  // did not finish.
  const reason =
    result === "tooLong"
      ? `Too long${TEXT_SEPARATOR}${code.length} / ${MAX_BARCODE} characters`
      : result === "taken"
        ? `Already registered to ${owner}`
        : result === "unreachable"
          ? "Couldn't check whether this code is already registered"
          : undefined;

  const cameraField = (
    <div className={styles.cameraRow}>
      <Input label="Camera" labelCondition={cameraNames.length < 2 ? "readOnly" : undefined}>
        <SelectField
          value={cameraValue}
          readOnly={cameraNames.length < 2}
          open={cameraPop.open}
          onClick={(event) => cameraPop.toggle(event.currentTarget)}
        />
      </Input>
      {/* "Only shown if the flashlight is detected" — which on a real device
          means a back camera on a phone, and on the fake one the mobile
          layout. */}
      {showTorch && (
        <Chip
          size="lg"
          isSelected={torchOn}
          slotLeft={<Icon icon="flashlight" rotate={270} />}
          onClick={() => (simulated ? setFakeLight((on) => !on) : scanner.toggleTorch())}
        >
          Light
        </Chip>
      )}
    </div>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Scan code"
        breakpoint={breakpoint}
        bodyPadded={false}
        // The node (4117-31776) draws the mobile surface as a FULL-HEIGHT
        // drawer — the DS one, not a surface of its own (Daniel, 2026-10-14:
        // "I don't like how 'custom' drawer looks like. I think it's more
        // consistent to use what DS specifies"). `fillHeight` is what makes
        // the sheet take the whole screen so the viewfinder gets the room;
        // desktop ignores it and stays the 608 card.
        fillHeight
        // The phone's header is the grab handle over the title — no close
        // button (the node's DrawerHeader, dragHandle + body).
        drawerHeader="default"
        footer={
          // "On camera errors the footer is hidden."
          failure ? undefined : mobile ? (
            <PopoverFooter stretch>
              <Button size="lg" variant="solid" isDisabled={!canRegister} onClick={() => onRegister(code)}>
                Use code
              </Button>
            </PopoverFooter>
          ) : (
            <PopoverFooter
              slotLeft={
                <Button size="lg" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              }
            >
              <Button size="lg" variant="solid" isDisabled={!canRegister} onClick={() => onRegister(code)}>
                Use code
              </Button>
            </PopoverFooter>
          )
        }
      >
        <div className={clsx(styles.sheet, mobile && styles.sheetFill)}>
          {failure ? (
            <div className={clsx(styles.failure, mobile && styles.failureFill)}>
              <EmptyState
                error
                icon={failureKey === "scannerCouldNotLoad" ? "qrcode-read" : "camera-slash"}
                title={failure.title}
                caption={typeof failure.caption === "function" ? failure.caption(cameraNames.length) : failure.caption}
                primaryAction={
                  failure.action === "retry"
                    ? { label: "Try again", leftIcon: "refresh", variant: "subtle", onClick: () => (simulated ? undefined : scanner.retry()) }
                    : { label: "Type code", variant: "subtle", onClick: onClose }
                }
              />
            </div>
          ) : (
            <button
              type="button"
              className={clsx(styles.preview, mobile && styles.previewFill, phase === "preparing" && styles.preparing)}
              onClick={readCode}
              aria-label={simulated ? "Simulate a scan" : "Camera preview"}
            >
              {/* The camera picture. The real one is a live <video> that must
                  stay mounted for its ref to exist while the stream starts;
                  black until it plays, which is the "Preparing" frame. */}
              {simulated ? (
                phase !== "preparing" && <img className={styles.feed} src={scanFeed} alt="" />
              ) : (
                <video ref={scanner.videoRef} className={styles.feed} muted playsInline autoPlay />
              )}
              {/* Nothing to aim with until the scanner is ready — the node
                  draws no window and no spinner in that state. */}
              {phase !== "preparing" && (
                <>
                  <span className={clsx(styles.window, mobile && styles.windowMobile)} data-flash={flash} />
                  {phase === "scanning" && <Icon className={styles.spinner} icon="spinner-third" pack="solid" size={24} spin />}
                </>
              )}
            </button>
          )}

          {!failure && (
            <>
              <Divider contrast="medium" />
              <div className={styles.codeRow}>
                {hint != null ? <span className={styles.hint}>{hint}</span> : <span className={styles.code}>{code}</span>}
                {reason && phase === "result" && (
                  <span className={clsx(styles.reason, result === "unreachable" && styles.reasonWarning)}>{reason}</span>
                )}
              </div>
            </>
          )}

          {showCamera && (
            <>
              <Divider contrast="medium" />
              {cameraField}
            </>
          )}
        </div>
      </Dialog>

      <SelectPopoverList pop={cameraPop} mobile={mobile} title="Camera">
        <SelectListItemGroup>
          {(simulated ? FAKE_CAMERAS.map((name) => ({ id: name, label: name })) : scanner.cameras).map((camera) => (
            <SelectListItem
              key={camera.id}
              label={camera.label}
              selected={simulated ? camera.label === fakeCamera : camera.id === scanner.cameraId}
              onClick={() => {
                if (simulated) {
                  setFakeCamera(camera.label);
                  setFakeLight(false);
                } else {
                  scanner.selectCamera(camera.id);
                }
                cameraPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
