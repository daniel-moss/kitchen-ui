import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { DeviceFrame, docsFrame, noop } from "../../stories/helpers";
import Button from "../Button/Button";
import DateField from "../Fields/DateField/DateField";
import IconButton from "../IconButton/IconButton";
import Input from "../Input/Input";
import { DrawerRootContext } from "../Popover/DrawerRootContext";
import Tooltip from "../Tooltip/Tooltip";
import DatePicker from "./DatePicker";
import { DatePickerSingleProps, DateRange } from "./DatePicker.types";

// Deterministic dates, REAL calendar (the code always renders real months —
// the Figma mock's January 2027 starts on a Sunday, the real one on a Friday).
const TODAY = new Date(2027, 0, 15); // Friday, January 15, 2027
const SELECTED = new Date(2027, 0, 20);
const RANGE: DateRange = { start: new Date(2027, 0, 1), end: new Date(2027, 1, 22) };

/**
 * DatePicker — the month-calendar picker, built on the Popover. Desktop: a
 * fixed-width card, positioned by the consumer. Mobile: a drawer with inner
 * DateField(s) and an Apply footer. `isRange` switches to range mode.
 */
const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker/DatePicker",
  component: DatePicker,
  // fullscreen — the docs stories' frame provides the (only) padding.
  parameters: { layout: "fullscreen" },
  args: { today: TODAY, breakpoint: "desktop", open: true },
  // DatePickerProps is a UNION (single | range) — react-docgen cannot read
  // JSDoc off it, so the whole table is declared by hand (the ListItem
  // gotcha). Keep it in step with DatePicker.types.ts.
  argTypes: {
    isRange: {
      description: "Range mode: two calendars on desktop, From/To fields on mobile.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      control: { type: "boolean" },
    },
    value: {
      description: "Selected date (controlled, single mode). null = none.",
      table: { type: { summary: "Date | null" } },
      control: false,
    },
    defaultValue: {
      description: "Uncontrolled initial selection (single mode).",
      table: { type: { summary: "Date | null" } },
      control: false,
    },
    onChange: {
      description: "A date was applied — desktop: a chip was clicked (the picker also calls onClose); mobile: Apply.",
      table: { type: { summary: "(date: Date) => void" } },
      control: false,
    },
    range: {
      description: "Selected range (controlled, range mode). Either end may be null while choosing.",
      table: { type: { summary: "{ start: Date | null; end: Date | null }" } },
      control: false,
    },
    defaultRange: {
      description: "Uncontrolled initial range.",
      table: { type: { summary: "DateRange" } },
      control: false,
    },
    onRangeChange: {
      description: "The range changed — desktop: on every click (incl. restarts); mobile: once, on Apply.",
      table: { type: { summary: "(range: DateRange) => void" } },
      control: false,
    },
    input: {
      description:
        "Desktop only: render the inner DateField(s) above the calendar — the Button-trigger case. The mobile drawer always has them.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
      control: { type: "boolean" },
    },
    label: {
      description: 'The inner DateField\'s label (single mode). Default "Date".',
      table: { type: { summary: "string" }, defaultValue: { summary: '"Date"' } },
      control: { type: "text" },
    },
    fromLabel: {
      description: 'The start field\'s label (range mode). Default "From".',
      table: { type: { summary: "string" }, defaultValue: { summary: '"From"' } },
      control: { type: "text" },
    },
    toLabel: {
      description: 'The end field\'s label (range mode). Default "To".',
      table: { type: { summary: "string" }, defaultValue: { summary: '"To"' } },
      control: { type: "text" },
    },
    defaultMonth: {
      description: "Initial visible month. Defaults to the selection's month (range: the start's), else today's.",
      table: { type: { summary: "Date" } },
      control: false,
    },
    minDate: {
      description: "Earliest selectable day (inclusive). Days before it are dimmed + inert; the back arrow stops.",
      table: { type: { summary: "Date" } },
      control: false,
    },
    maxDate: {
      description: "Latest selectable day (inclusive).",
      table: { type: { summary: "Date" } },
      control: false,
    },
    today: {
      description: 'Override "today" (deterministic stories). Defaults to the current date.',
      table: { type: { summary: "Date" } },
      control: false,
    },
    breakpoint: {
      description: "auto (default) tracks the viewport; desktop/mobile force one presentation.",
      options: ["auto", "desktop", "mobile"],
      table: { type: { summary: '"auto" | "desktop" | "mobile"' }, defaultValue: { summary: '"auto"' } },
      control: { type: "inline-radio" },
    },
    open: {
      description: "Mount + animation control: keep mounted and flip this (card fade / drawer slide).",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
      control: { type: "boolean" },
    },
    onClose: {
      description:
        "Desktop: Esc or a single date applying. Mobile: dismissal (discards) or Apply. Desktop outside-click is the consumer's wiring.",
      table: { type: { summary: "() => void" } },
      control: false,
    },
  },
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

// Hug + center: `data-hug` makes the DOCS preview container hug this content
// and center on the docs column, overflowing symmetrically when wider
// (storybook-docs.css); fit-content + auto margins do the same in the
// standalone story view.
const frame: CSSProperties = { ...docsFrame, maxWidth: "none", width: "fit-content" };
// `tinted` marks the docs preview surface for the gray-5 fill (the Figma doc
// pages tint the mobile/device previews).
const Hug = ({ style, tinted = false, children }: { style?: CSSProperties; tinted?: boolean; children: ReactNode }) => (
  <div data-hug data-tinted={tinted || undefined} style={{ ...frame, ...style }}>
    {children}
  </div>
);
// For previews with an absolutely-positioned pop-out (the trigger demos): a
// centered column instead of a hugging box.
const centeredFrame: CSSProperties = { ...docsFrame, display: "flex", flexDirection: "column", alignItems: "center" };

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(SELECTED);
    // The controls hand back the raw union — pin it to single mode.
    const single = { ...args, isRange: false } as DatePickerSingleProps;
    return (
      <Hug>
        <DatePicker {...single} value={value} onChange={setValue} onClose={noop} />
      </Hug>
    );
  },
};

// ---- docs-page stories (one per Figma Documentation example) ---------------

/** The desktop card — Popover chrome, fixed 368px. Today = Jan 15; Jan 20 picked. */
export const Desktop: Story = {
  render: () => (
    <Hug>
      <DatePicker breakpoint="desktop" today={TODAY} defaultValue={SELECTED} onClose={noop} />
    </Hug>
  ),
};

/** The range card — two calendars, nav on the right one only. Fixed 720px. */
export const DesktopRange: Story = {
  render: () => (
    <Hug>
      <DatePicker isRange breakpoint="desktop" today={TODAY} defaultRange={RANGE} onClose={noop} />
    </Hug>
  ),
};

/** Desktop with the inner DateField — the Button-trigger case. */
export const DesktopWithInput: Story = {
  render: () => (
    <Hug>
      <DatePicker breakpoint="desktop" input today={TODAY} defaultValue={new Date(2027, 0, 1)} onClose={noop} />
    </Hug>
  ),
};

/** The range card with From/To fields — each column pairs a field + calendar. */
export const DesktopRangeWithInput: Story = {
  render: () => (
    <Hug>
      <DatePicker isRange breakpoint="desktop" input today={TODAY} defaultRange={RANGE} onClose={noop} />
    </Hug>
  ),
};

/** No selection yet — the picker opens on the month with the "Today" date. */
export const NoSelection: Story = {
  render: () => (
    <Hug>
      <DatePicker breakpoint="desktop" today={TODAY} onClose={noop} />
    </Hug>
  ),
};

/** Always 6 rows — the container keeps the same size from month to month. */
export const SixRows: Story = {
  render: () => (
    <Hug style={{ display: "flex", gap: "var(--size-10)" }}>
      <DatePicker breakpoint="desktop" today={TODAY} onClose={noop} />
      <DatePicker breakpoint="desktop" today={TODAY} defaultMonth={new Date(2027, 1, 1)} onClose={noop} />
    </Hug>
  ),
};

/**
 * The "return" button appears when the shown month doesn't hold today, and its
 * icon points back toward it: December 2026 → arrow-turn-right, January 2027
 * (today's month) → no button, February 2027 → arrow-turn-left.
 */
export const ReturnButton: Story = {
  render: () => (
    <Hug style={{ display: "flex", gap: "var(--size-10)" }}>
      <DatePicker breakpoint="desktop" today={TODAY} defaultMonth={new Date(2026, 11, 1)} onClose={noop} />
      <DatePicker breakpoint="desktop" today={TODAY} onClose={noop} />
      <DatePicker breakpoint="desktop" today={TODAY} defaultMonth={new Date(2027, 1, 1)} onClose={noop} />
    </Hug>
  ),
};

// The static tooltip preview (Figma): the Tooltip body above the HOVERED
// return button, tongue down. The flex gap is 8 so the tongue TIP (which
// sticks ~4px out of the body box) sits 4px above the button.
const returnWithTooltip = (direction: "left" | "right") => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <Tooltip placement="top" text="Jump to today" />
    <IconButton
      aria-label="Jump to today"
      icon={direction === "right" ? "arrow-turn-right" : "arrow-turn-left"}
      variant="ghost"
      size="lg"
      _isHovered
      onClick={noop}
    />
  </div>
);

/** Hovering the "return" button — the "Jump to today" tooltip, both directions. */
export const ReturnTooltip: Story = {
  render: () => (
    <Hug style={{ display: "flex", gap: 40 }}>
      {returnWithTooltip("right")}
      {returnWithTooltip("left")}
    </Hug>
  ),
};

/**
 * The mobile drawer: drag handle, the inner DateField, the calendar, and the
 * Apply footer. Nothing is picked yet, so Apply is disabled. Tap a day — it
 * fills the field; swipe the calendar sideways to change month; swipe the
 * drawer down to discard.
 */
export const Mobile: Story = {
  render: () => (
    <Hug tinted>
      <DeviceFrame homeIndicator pageText="The DatePicker drawer.">
        <DatePicker breakpoint="mobile" open today={TODAY} onChange={noop} onClose={noop} />
      </DeviceFrame>
    </Hug>
  ),
};

/** Mobile with a picked date — the field is filled and Apply is enabled. */
export const MobileFilled: Story = {
  render: () => (
    <Hug tinted>
      <DeviceFrame homeIndicator pageText="The DatePicker drawer.">
        <DatePicker breakpoint="mobile" open today={TODAY} defaultValue={SELECTED} onChange={noop} onClose={noop} />
      </DeviceFrame>
    </Hug>
  ),
};

// ---- the keyboard-ON mock --------------------------------------------------

const KB_HEIGHT = 291;
const keyStyle: CSSProperties = {
  flex: 1,
  maxWidth: 34,
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 5,
  background: "var(--surface-level-third)",
  boxShadow: "0 1px 0 var(--gray-a6)",
  font: "var(--font-body-400-compact)",
  color: "var(--text-strong)",
};
const specialKeyStyle: CSSProperties = { ...keyStyle, maxWidth: 44, background: "var(--gray-a4)" };

// A static iOS-keyboard stand-in for the keyboard-ON preview — a doc
// illustration only, not a DS component.
const KeyboardMock = () => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: KB_HEIGHT,
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      boxSizing: "border-box",
      padding: "10px 4px 4px",
      background: "var(--gray-5)",
    }}
  >
    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
      {"QWERTYUIOP".split("").map((k) => (
        <div key={k} style={keyStyle}>
          {k}
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 5, justifyContent: "center", padding: "0 16px" }}>
      {"ASDFGHJKL".split("").map((k) => (
        <div key={k} style={keyStyle}>
          {k}
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
      <div style={specialKeyStyle}>⇧</div>
      {"ZXCVBNM".split("").map((k) => (
        <div key={k} style={keyStyle}>
          {k}
        </div>
      ))}
      <div style={specialKeyStyle}>⌫</div>
    </div>
    <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
      <div style={{ ...specialKeyStyle, maxWidth: 90 }}>123</div>
      <div style={{ ...keyStyle, maxWidth: "none" }}>space</div>
      <div style={{ ...specialKeyStyle, maxWidth: 90 }}>return</div>
    </div>
  </div>
);

// Keyboard ON: the drawer's root is clipped to end at the keyboard top, so
// the sheet shrinks to the remaining height and the Apply footer sits right
// on the keyboard (on device the Popover's own visualViewport handling does
// this). The home-indicator inset collapses to 0 — the keyboard covers that
// zone (on device the drawer's :has(input:focus) rule does it). The inner
// DateField shows its active state.
const MobileKeyboardDemo = () => {
  const [rootEl, setRootEl] = useState<Element | null>(null);
  return (
    <DeviceFrame pageText="Typing in the inner DateField.">
      <DrawerRootContext.Provider value={rootEl}>
        <div
          ref={setRootEl}
          data-drawer-root
          className="pseudo-focus-within-all"
          style={
            {
              position: "absolute",
              inset: 0,
              bottom: KB_HEIGHT,
              "--popover-drawer-bottom-inset": "0px",
            } as CSSProperties
          }
        >
          <DatePicker
            breakpoint="mobile"
            open
            today={TODAY}
            defaultValue={new Date(2027, 0, 1)}
            onChange={noop}
            onClose={noop}
          />
        </div>
      </DrawerRootContext.Provider>
      <KeyboardMock />
    </DeviceFrame>
  );
};

/** The keyboard is up — the drawer shrinks and the footer rides on top of it. */
export const MobileKeyboard: Story = {
  render: () => (
    <Hug tinted>
      <MobileKeyboardDemo />
    </Hug>
  ),
};

/** Swiping the calendar swipes the month: left → next, right → previous. */
export const MobileSwipe: Story = {
  render: () => (
    <Hug tinted style={{ display: "flex", gap: 40 }}>
      <DeviceFrame homeIndicator pageText="Swipe the calendar to the left…">
        <DatePicker breakpoint="mobile" open today={TODAY} onChange={noop} onClose={noop} />
      </DeviceFrame>
      <DeviceFrame homeIndicator pageText="…and the next month slides in.">
        <DatePicker
          breakpoint="mobile"
          open
          today={TODAY}
          defaultMonth={new Date(2027, 1, 1)}
          onChange={noop}
          onClose={noop}
        />
      </DeviceFrame>
    </Hug>
  ),
};

/**
 * The mobile range drawer: From/To fields side by side (compact format), one
 * month at a time. Apply stays disabled until both fields have a value.
 */
export const MobileRange: Story = {
  render: () => (
    <Hug tinted>
      <DeviceFrame homeIndicator pageText="The DatePicker drawer.">
        <DatePicker
          isRange
          breakpoint="mobile"
          open
          today={TODAY}
          defaultRange={RANGE}
          onRangeChange={noop}
          onClose={noop}
        />
      </DeviceFrame>
    </Hug>
  ),
};

/**
 * Triggered by a DateField — no inner field is needed; the card opens 4px
 * below, left-aligned. Live: click the field to open the picker, or type into
 * the field itself.
 */
export const DateFieldTrigger: Story = {
  render: () => (
    <div style={{ ...centeredFrame, paddingBottom: 420 }}>
      <div style={{ width: 336 }}>
        <Input label="Date received" helpText="Click the field to open the picker, or type into it">
          <DateField breakpoint="desktop" today={TODAY} defaultValue={SELECTED} />
        </Input>
      </div>
    </div>
  ),
};

/** DateField trigger on mobile — the inner field takes the trigger's label. */
export const DateFieldTriggerMobile: Story = {
  render: () => (
    <Hug tinted>
      <DeviceFrame homeIndicator pageText="Opened from a DateField labelled “Date received”.">
        <DatePicker breakpoint="mobile" open today={TODAY} label="Date received" onChange={noop} onClose={noop} />
      </DeviceFrame>
    </Hug>
  ),
};

const BUTTON_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

// Triggered by a Button: the consumer owns the trigger + positioning (like
// Menu). The picker needs the inner DateField (`input`); typing in it selects
// the matching chip in real time, Enter/blur commits without closing, Esc or
// an outside click closes.
const ButtonTriggerDemo = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Date | null>(new Date(2027, 0, 1));
  const anchorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => {
      if (anchorRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  return (
    <div style={{ ...centeredFrame, paddingBottom: 480 }}>
      <div ref={anchorRef} style={{ position: "relative", width: "fit-content" }}>
        <Button size="lg" variant="subtle" leftIcon="calendar" isPressed={open} onClick={() => setOpen((o) => !o)}>
          {value != null ? BUTTON_FORMAT.format(value) : "Pick a date"}
        </Button>
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100 }}>
          <DatePicker
            breakpoint="desktop"
            input
            open={open}
            today={TODAY}
            value={value}
            onChange={setValue}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};

/** Triggered by a Button — live. The picker carries its own DateField. */
export const ButtonTrigger: Story = { render: () => <ButtonTriggerDemo /> };

/** Button trigger on mobile — the inner field takes the default "Date" label. */
export const ButtonTriggerMobile: Story = {
  render: () => (
    <Hug tinted>
      <DeviceFrame homeIndicator pageText="Opened from a Button.">
        <DatePicker
          breakpoint="mobile"
          open
          today={TODAY}
          defaultValue={new Date(2027, 0, 1)}
          onChange={noop}
          onClose={noop}
        />
      </DeviceFrame>
    </Hug>
  ),
};

/**
 * Live: click a date to set the start, hover the days after it to preview the
 * band, click again to set the end. A click on an earlier date (or a third
 * click) restarts; clicking the start itself does nothing (a one-day range is
 * not valid).
 */
export const RangeDesktop: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange>({ start: null, end: null });
    return (
      <Hug>
        <DatePicker isRange breakpoint="desktop" today={TODAY} range={range} onRangeChange={setRange} onClose={noop} />
      </Hug>
    );
  },
};

/**
 * The range "return" button: today (Jan 15) is in neither shown month, so the
 * right calendar header shows it — pointing left, back toward today.
 */
export const RangeReturn: Story = {
  render: () => (
    <Hug>
      <DatePicker isRange breakpoint="desktop" today={TODAY} defaultMonth={new Date(2027, 1, 1)} onClose={noop} />
    </Hug>
  ),
};
