import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

import Button from "../../components/Button/Button";
import InputHelpText from "../../components/InputHelpText/InputHelpText";

import styles from "./SignaturePad.module.scss";

// The Complete-job Signature pad (Figma "Signature" module 24489-49416): a
// 200px dashed box the customer signs in with a finger or the mouse. Empty it
// is blank — no placeholder text or icon in the design. Once anything is drawn,
// a ghost "Clear" button appears in its top-right corner (Daniel, 2026-08-07).
//
// The strokes are kept as point lists (CSS pixels) and repainted, so a resize
// or a device-pixel-ratio change does not wipe the signature.

interface SignaturePadProps {
  /** Fires with true as soon as anything is drawn, false when cleared. */
  onInkChange?: (hasInk: boolean) => void;
  /** false → the error border + the message below (the DS field pattern). */
  isValid?: boolean;
  errorMessage?: string;
  /**
   * Hands the caller a function that returns the drawn ink as a PNG data URL
   * (null when nothing is drawn). That is what the Signature module shows after
   * the job is completed — without it the module could only draw a placeholder.
   * The stroke is painted in the theme's text color AT CAPTURE TIME, so an ink
   * captured in light theme stays dark if the theme is switched afterwards.
   */
  registerCapture?: (capture: () => string | null) => void;
}

type Point = { x: number; y: number };

export default function SignaturePad({ onInkChange, isValid = true, errorMessage, registerCapture }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // Repaint every stroke at the canvas' current size.
  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas == null || ctx == null) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    // Only resize when it actually changed — writing width/height clears it.
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      // A single tap still leaves a dot.
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
      else for (const p of stroke.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    repaint();
    const canvas = canvasRef.current;
    if (canvas == null || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => repaint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [repaint]);

  // The capture function is handed over once and stays valid: it reads the
  // canvas through the ref at CALL time, so it never goes stale.
  useEffect(() => {
    registerCapture?.(() =>
      strokes.current.length === 0 ? null : (canvasRef.current?.toDataURL("image/png") ?? null),
    );
  }, [registerCapture]);

  const pointOf = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    strokes.current = [...strokes.current, [pointOf(event)]];
    repaint();
    if (!hasInk) {
      setHasInk(true);
      onInkChange?.(true);
    }
  };

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    strokes.current[strokes.current.length - 1].push(pointOf(event));
    repaint();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    strokes.current = [];
    repaint();
    setHasInk(false);
    onInkChange?.(false);
  };

  return (
    <div className={styles.root}>
      <div className={clsx(styles.pad, !isValid && styles.invalid)}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {hasInk && (
          <div className={styles.clear}>
            <Button variant="ghost" size="lg" onClick={clear}>
              Clear
            </Button>
          </div>
        )}
      </div>
      {!isValid && errorMessage != null && (
        <InputHelpText status="error" slotLeft>
          {errorMessage}
        </InputHelpText>
      )}
    </div>
  );
}
