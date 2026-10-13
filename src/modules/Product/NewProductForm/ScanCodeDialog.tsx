import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import Button from "../../../components/Button/Button";
import Chip from "../../../components/Chip/Chip";
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

import { MAX_BARCODE } from "./productRules";
import ScanSurface from "./ScanSurface";

import scanFeed from "../../../assets/scan-preview.jpg";

import styles from "./ScanCodeDialog.module.scss";

// The "Product code registration" dialog (Figma "Scan" Form, 4011-9592): the
// camera keeps running, the last code read waits under the viewfinder with its
// registration status, and Register hands it to the Barcode field.
//
// THE CAMERA IS FAKED (Daniel, 2026-10-13: "let's try fake camera first"). A
// real scanner needs getUserMedia plus a WebAssembly decoder, and it only runs
// over HTTPS — which the Storybook link over a LAN IP is not. So the preview is
// a tappable surface that "reads" the next code from `demoCodes` over a still
// picture, and every state the design draws is reachable: the three results
// from the codes themselves, each camera failure from the `state` prop.
//
// What a real build keeps from here: the states, the copy, the layout, and the
// rule that the camera never stops while a result waits below.

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
    caption: "Type the code instead, or open Roopairs in a new version of the browser",
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

/** The cameras the fake scanner offers. One name = the input stays read-only. */
const CAMERAS = ["Back Triple Camera", "Front Camera"];

/** What the scanner is doing. "result" holds the last code read. */
type Phase = "preparing" | "idle" | "scanning" | "result";

/** What came back about the last code read. */
type Result = "ok" | "tooLong" | "taken" | "unreachable";

export interface ScanCodeDialogProps {
  open: boolean;
  onClose: () => void;
  /** Register hands the code to the field and closes. */
  onRegister: (code: string) => void;
  /**
   * The products a code is already registered to, by code. A scan that hits
   * one shows "Already registered to …" and Register stays disabled.
   */
  registered?: Record<string, string>;
  /**
   * What the fake camera reads, in order, each time the preview is tapped. The
   * default walks a free code, a too-long one, one that is already registered,
   * and one whose check can not reach the server.
   */
  demoCodes?: string[];
  /**
   * Codes whose registration check can not finish — the "Couldn't check" state.
   * The code is still registerable: the warning says only that Roopairs could
   * not look it up.
   */
  unreachableCodes?: string[];
  /** Draw a camera failure instead of the viewfinder. */
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

/** How long the fake read takes before a result lands. */
const SCAN_MS = 800;
/** The mask holds its colour for a second — both result annotations say so. */
const FLASH_MS = 1000;

export default function ScanCodeDialog({
  open,
  onClose,
  onRegister,
  registered = {},
  demoCodes = DEFAULT_CODES,
  unreachableCodes = DEFAULT_UNREACHABLE,
  state,
  breakpoint = "auto",
}: ScanCodeDialogProps) {
  const mobile = !useIsDesktop(breakpoint);
  const cameraPop = useSelectPopover(mobile);

  // "preparing" is the first moment of every session: the decoder and the
  // camera take a beat, and the design draws that beat as a black preview.
  const [phase, setPhase] = useState<Phase>("preparing");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>("ok");
  const [owner, setOwner] = useState<string | undefined>(undefined);
  const [camera, setCamera] = useState(CAMERAS[0]);
  const [light, setLight] = useState(false);
  const [flash, setFlash] = useState<"none" | "good" | "bad" | "warn">("none");
  const nextCode = useRef(0);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    if (!open) return undefined;
    setPhase("preparing");
    setCode("");
    setLight(false);
    setFlash("none");
    nextCode.current = 0;
    later(() => setPhase("idle"), 900);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [open]);

  // A read: the scanner works for a moment, then the mask flashes, the phone
  // buzzes and the result lands. A failure flashes red and buzzes twice (the
  // two result annotations).
  const readCode = () => {
    if (phase === "preparing" || phase === "scanning" || state) return;
    setPhase("scanning");
    setFlash("none");
    later(() => {
      const value = demoCodes[nextCode.current % demoCodes.length] ?? "";
      nextCode.current += 1;
      const taken = registered[value];
      const next: Result = value.length > MAX_BARCODE ? "tooLong" : taken != null ? "taken" : unreachableCodes.includes(value) ? "unreachable" : "ok";
      setCode(value);
      setOwner(taken);
      setResult(next);
      setPhase("result");
      const bad = next === "tooLong" || next === "taken";
      // Green for a code that can be registered, red for one that can not,
      // amber when the check did not finish — that last one is a warning, not
      // a failure, so it buzzes ONCE like a good read and Register stays on.
      setFlash(bad ? "bad" : next === "unreachable" ? "warn" : "good");
      navigator.vibrate?.(bad ? [60, 60, 60] : 60);
      later(() => setFlash("none"), FLASH_MS);
    }, SCAN_MS);
  };

  const failure = state ? FAILURES[state] : undefined;
  const showCamera = !failure || failure.keepsCamera;
  const canRegister = phase === "result" && (result === "ok" || result === "unreachable");

  // The line under the viewfinder: a hint while nothing has been read, the code
  // itself once something has.
  const hint =
    phase === "preparing" ? "Preparing the scanner…" : phase === "scanning" ? "Scanning…" : phase === "idle" ? "Point the camera at a QR code or barcode" : undefined;

  // The second line — why the code can not be registered, or that the check
  // did not finish.
  const reason =
    result === "tooLong"
      ? `Too long to register (${MAX_BARCODE} characters max)`
      : result === "taken"
        ? `Already registered to ${owner}`
        : result === "unreachable"
          ? "Couldn't check whether this code is already registered"
          : undefined;

  const cameraField = (
    <div className={styles.cameraRow}>
      <Input label="Camera" labelCondition={CAMERAS.length < 2 ? "readOnly" : undefined}>
        <SelectField
          value={camera}
          readOnly={CAMERAS.length < 2}
          open={cameraPop.open}
          onClick={(event) => cameraPop.toggle(event.currentTarget)}
        />
      </Input>
      {/* "Only shown if the flashlight is detected" — a phone thing, so the
          chip rides the mobile layout only. */}
      {mobile && (
        <Chip
          size="lg"
          isSelected={light}
          slotLeft={<Icon icon="flashlight" rotate={270} />}
          onClick={() => setLight((on) => !on)}
        >
          Light
        </Chip>
      )}
    </div>
  );

  return (
    <>
      <ScanSurface
        open={open}
        onClose={onClose}
        title="Product code registration"
        breakpoint={breakpoint}
        footer={
          <PopoverFooter
            slotLeft={
              <Button size="lg" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            }
          >
            <Button size="lg" variant="solid" isDisabled={!canRegister} onClick={() => onRegister(code)}>
              Register
            </Button>
          </PopoverFooter>
        }
      >
        <div className={clsx(styles.sheet, mobile && styles.sheetFill)}>
          {failure ? (
            <div className={clsx(styles.failure, mobile && styles.failureFill)}>
              <EmptyState
                error
                icon={state === "scannerCouldNotLoad" ? "qrcode-read" : "camera-slash"}
                title={failure.title}
                caption={typeof failure.caption === "function" ? failure.caption(CAMERAS.length) : failure.caption}
                primaryAction={
                  failure.action === "retry"
                    ? { label: "Try again", leftIcon: "refresh", variant: "subtle", onClick: () => undefined }
                    : { label: "Type it instead", variant: "subtle", onClick: onClose }
                }
              />
            </div>
          ) : (
            <button
              type="button"
              className={clsx(styles.preview, mobile && styles.previewFill, phase === "preparing" && styles.preparing)}
              onClick={readCode}
              aria-label="Simulate a scan"
            >
              {/* Nothing but black while the scanner starts — the node draws no
                  picture, no window and no spinner in that state. */}
              {phase !== "preparing" && (
                <>
                  <img className={styles.feed} src={scanFeed} alt="" />
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
      </ScanSurface>

      <SelectPopoverList pop={cameraPop} mobile={mobile} title="Camera">
        <SelectListItemGroup>
          {CAMERAS.map((name) => (
            <SelectListItem
              key={name}
              label={name}
              selected={name === camera}
              onClick={() => {
                setCamera(name);
                setLight(false);
                cameraPop.close();
              }}
            />
          ))}
        </SelectListItemGroup>
      </SelectPopoverList>
    </>
  );
}
