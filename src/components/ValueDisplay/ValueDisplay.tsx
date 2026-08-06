import { Children, MouseEvent, ReactNode, isValidElement, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import clsx from "clsx";

import { useCardGridWidth } from "../../hooks/useCardGridWidth";

import Avatar from "../Avatar/Avatar";
import AvatarGroup from "../Avatar/AvatarGroup";
import Card from "../Card/Card";
import CardFile from "../Card/CardFile";
import { Icon } from "../Icon/Icon";
import LinkButton from "../LinkButton/LinkButton";
import ListItem from "../ListItem/ListItem";
import { SkeletonTypography } from "../SkeletonTypography/SkeletonTypography";
import Tooltip from "../Tooltip/Tooltip";
import TruncatingText from "../Tooltip/TruncatingText";

import styles from "./ValueDisplay.module.scss";
import { ValueDisplayLimit, ValueDisplayProps } from "./ValueDisplay.types";

// The truncation defaults from the Figma doc: long text clamps at 4 lines, the
// avatar stack shows 3 avatars before the "+N" row.
const DEFAULT_LINE_LIMIT = 4;
const DEFAULT_AVATAR_LIMIT = 3;

// Truncation that is OFF unless asked for (long text): `true` means "use the
// standard limit", a number sets its own, anything else means no clamp.
const optIn = (limit: ValueDisplayLimit | undefined, fallback: number) =>
  limit === true ? fallback : typeof limit === "number" ? limit : undefined;

// Truncation that is ON by default (the avatar stack): `false` shows every
// item, a number sets its own limit, anything else uses the standard one.
const optOut = (limit: ValueDisplayLimit | undefined, fallback: number) =>
  limit === false ? undefined : typeof limit === "number" ? limit : fallback;

// A slot value counts as empty when nothing would render — including an array
// that only holds falsy entries (`files={items.map(…)}` on an empty list).
const isEmptySlot = (node: ReactNode): boolean =>
  node == null ||
  node === false ||
  node === "" ||
  (Array.isArray(node) && node.every((child) => isEmptySlot(child as ReactNode)));

// A badge / LinkButton value that may get squeezed by the available width.
// When its content actually truncates, hovering shows the full text in a
// tooltip — the trigger is the badge/button itself, the tooltip sits 4px
// above and follows the cursor's x (the TruncatingText behavior; the doc
// describes the same for badges and buttons).
function OverflowTip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [text, setText] = useState("");
  // Tooltips are a hover affordance — on touch they do not exist.
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const track = (clientX: number) => {
    const el = ref.current;
    if (el) setPos({ x: clientX, y: el.getBoundingClientRect().top });
  };
  const handleEnter = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    // Truncated = an element whose content overflows AND is clipped. The
    // clipping check matters: overflow-visible boxes over-report scrollWidth
    // without hiding anything (e.g. LinkButton's ::before hit-area extends
    // 8px past the button), which read as "truncated" on every hover.
    const truncated = [el, ...Array.from(el.querySelectorAll("*"))].some((n) => {
      if (n.scrollWidth <= n.clientWidth + 1) return false;
      const overflowX = getComputedStyle(n).overflowX;
      return overflowX === "hidden" || overflowX === "clip";
    });
    if (!truncated) return;
    setText(el.textContent ?? "");
    track(e.clientX);
    setOpen(true);
  };

  return (
    <span
      ref={ref}
      className={styles.overflowWrap}
      onMouseEnter={canHover ? handleEnter : undefined}
      onMouseMove={canHover && open ? (e) => track(e.clientX) : undefined}
      onMouseLeave={canHover ? () => setOpen(false) : undefined}
    >
      {children}
      {open &&
        createPortal(
          <span className={styles.tooltipOverlay} style={{ left: pos.x, top: pos.y }}>
            <Tooltip placement="top" textAlign="left" text={text} />
          </span>,
          document.body,
        )}
    </span>
  );
}

// Smoothly animates an element between its heights around a state change:
// measure, apply the change synchronously (flushSync), measure again, then
// transition between the two fixed heights and clean up back to auto.
const EXPAND_MS = 240;
const EXPAND_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"; // the DS drawer curve

// One running animation per element; starting a new one settles the old one
// first (jump to its end state), so rapid toggles stay consistent.
const activeHeightAnim = new WeakMap<HTMLElement, () => void>();

function animateHeight(
  el: HTMLElement | null,
  mutate: () => void,
  opts: { preAnimate?: () => void; onDone?: () => void } = {},
) {
  const { preAnimate, onDone } = opts;
  if (el == null) {
    mutate();
    onDone?.();
    return;
  }
  activeHeightAnim.get(el)?.();
  const start = el.offsetHeight;
  flushSync(mutate);
  const end = el.offsetHeight;
  if (start === end) {
    onDone?.();
    return;
  }
  // A state that must hold only WHILE the height moves (e.g. the text clamp
  // lifted so collapsing lines stay visible until the box has shrunk).
  if (preAnimate) flushSync(preAnimate);
  el.style.height = `${start}px`;
  el.style.overflow = "hidden";
  void el.offsetHeight; // commit the start height before transitioning
  el.style.transition = `height ${EXPAND_MS}ms ${EXPAND_EASE}`;
  el.style.height = `${end}px`;
  const finish = (e?: TransitionEvent) => {
    if (e != null && (e.target !== el || e.propertyName !== "height")) return;
    el.removeEventListener("transitionend", finish);
    activeHeightAnim.delete(el);
    // Restore the resting state BEFORE releasing the fixed height — the text
    // clamp must already be back on when the element returns to auto height,
    // or the full text paints for a frame (a visible flash on collapse).
    if (onDone) flushSync(onDone);
    el.style.height = "";
    el.style.overflow = "";
    el.style.transition = "";
  };
  activeHeightAnim.set(el, finish);
  el.addEventListener("transitionend", finish);
}

// The "Show more" / "Show less" control under a clamped vertical value.
function ShowMoreButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <LinkButton
      size="sm"
      colorScheme="gray"
      rightIcon={expanded ? "angle-up" : "angle-down"}
      noDebounce
      onClick={onToggle}
    >
      {expanded ? "Show less" : "Show more"}
    </LinkButton>
  );
}

// ValueDisplay — a label–value pair. Horizontal (fixed 120px label column;
// text / badge / LinkButton values, optional IconButton on the right) or
// vertical (label above; short text, long text with an optional line limit, an
// xs avatar stack, a grid of file cards, or one object card). Empty values
// render a "No [Label]" placeholder; loading renders skeletons in the value
// only. See Figma "ValueDisplay".
export default function ValueDisplay(props: ValueDisplayProps) {
  const { label, emptyText, isLoading = false, className } = props;
  const orientation = props.orientation ?? "horizontal";
  // Each orientation has its own default kind (Figma's default variants).
  const kind = props.kind ?? (orientation === "horizontal" ? "text" : "longText");

  // "No" + the label with an uppercase first letter (the doc's pattern).
  const placeholder = emptyText ?? `No ${label.charAt(0).toUpperCase()}${label.slice(1)}`;

  // Vertical truncation state (text line limit / avatar limit).
  const [expanded, setExpanded] = useState(false);
  // The clamp is lifted while the collapse animation runs, so the hidden
  // lines stay visible until the box has shrunk over them.
  const [animating, setAnimating] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const avatarStackRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);

  // Does the clamped text actually overflow? Re-measured when the value or
  // limit changes and on resize — "Show more" appears only when needed.
  const lineLimit = optIn(
    props.orientation === "vertical" && (props.kind == null || props.kind === "longText") ? props.lineLimit : undefined,
    DEFAULT_LINE_LIMIT,
  );
  useLayoutEffect(() => {
    const el = textRef.current;
    if (el == null || lineLimit == null || animating) return undefined;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [lineLimit, props.value, expanded, animating]);

  const toggleText = () => {
    if (expanded) {
      // Collapse: the END state (clamped) is measured first, then the clamp is
      // lifted for the shrink and re-applied when the box has settled.
      animateHeight(textRef.current, () => setExpanded(false), {
        preAnimate: () => setAnimating(true),
        onDone: () => setAnimating(false),
      });
    } else {
      animateHeight(textRef.current, () => setExpanded(true));
    }
  };
  const toggleAvatars = () => {
    animateHeight(avatarStackRef.current, () => setExpanded((e) => !e));
  };

  // Files: the cards laid out with the shared file-card grid rule — one width
  // measured for every row, so a short last row keeps the first row's width.
  const filesRef = useRef<HTMLDivElement>(null);
  const fileCards = props.kind === "files" ? Children.toArray(props.files).filter(Boolean) : [];
  const fileLoadingCount = props.kind === "files" ? Math.max(1, props.loadingCount ?? 1) : 0;
  const fileCount = isLoading ? fileLoadingCount : fileCards.length;
  const fileCardWidth = useCardGridWidth(filesRef, fileCount, props.kind === "files" && fileCount > 0);
  // The measured width overrides the flex fallback in the stylesheet.
  const fileCellStyle =
    fileCardWidth != null ? { width: fileCardWidth, flex: "0 0 auto" } : undefined;

  // ---- horizontal ----------------------------------------------------------
  if (orientation === "horizontal") {
    let content: ReactNode;
    if (isLoading) {
      content =
        kind === "badge" ? (
          <div className={clsx(styles.content, styles.contentBadge)}>
            <span className={styles.badgeSkeleton}>
              <SkeletonTypography variant="bodyCompact" />
            </span>
          </div>
        ) : (
          <div className={clsx(styles.content, styles.contentOneLine)}>
            <SkeletonTypography variant="bodyCompact" />
          </div>
        );
    } else if (kind === "badge") {
      content = props.badge ? (
        <div className={clsx(styles.content, styles.contentBadge)}>
          <OverflowTip>{props.badge}</OverflowTip>
        </div>
      ) : (
        <div className={styles.content}>
          <span className={styles.placeholder}>{placeholder}</span>
        </div>
      );
    } else if (kind === "linkButton") {
      content = props.link ? (
        <div className={clsx(styles.content, styles.contentOneLine)}>
          <OverflowTip>{props.link}</OverflowTip>
        </div>
      ) : (
        <div className={styles.content}>
          <span className={styles.placeholder}>{placeholder}</span>
        </div>
      );
    } else if (props.value == null || props.value === "") {
      content = (
        <div className={styles.content}>
          <span className={styles.placeholder}>{placeholder}</span>
        </div>
      );
    } else {
      const { value, valueColor, slotLeft, isWarning = false } = props;
      const color = isWarning ? "var(--text-warning)" : valueColor;
      content = (
        <div className={clsx(styles.content, isWarning && styles.contentWarning)} style={color ? { color } : undefined}>
          {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
          {/* With a left slot the text truncates to ONE line (full text in a
              tooltip); plain text wraps instead — the doc's rule. */}
          {slotLeft != null ? (
            <TruncatingText text={value} className={styles.text} />
          ) : (
            <span className={styles.text}>{value}</span>
          )}
          {isWarning && (
            <span className={styles.warningIcon}>
              <Icon icon="triangle-exclamation" pack="solid" size={14} />
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={clsx(styles.horizontal, className)}>
        <span className={styles.labelHorizontal}>{label}</span>
        <div className={styles.valueArea}>
          {content}
          {props.slotRight != null && <span className={styles.slotRight}>{props.slotRight}</span>}
        </div>
      </div>
    );
  }

  // ---- vertical -------------------------------------------------------------
  // The compact "No [Label]" line shared by short text, files and object card.
  const compactPlaceholder = <p className={clsx(styles.textShort, styles.placeholderColor)}>{placeholder}</p>;

  let body: ReactNode;
  if (props.kind === "files") {
    if (isLoading) {
      body = (
        <div ref={filesRef} className={styles.filesGrid}>
          {Array.from({ length: fileLoadingCount }, (_, i) => (
            <div key={i} className={styles.fileCell} style={fileCellStyle}>
              <CardFile name="" loading />
            </div>
          ))}
        </div>
      );
    } else if (isEmptySlot(props.files)) {
      body = compactPlaceholder;
    } else {
      body = (
        <div ref={filesRef} className={styles.filesGrid}>
          {fileCards.map((card, i) => (
            <div key={(isValidElement(card) && card.key) || i} className={styles.fileCell} style={fileCellStyle}>
              {card}
            </div>
          ))}
        </div>
      );
    }
  } else if (props.kind === "objectCard") {
    if (isLoading) {
      // ListItem has no loading state of its own, so the skeletons go into its
      // text slots (both take a ReactNode) and the avatar carries Avatar's.
      body = (
        <Card padding="var(--size-1)" className={styles.objectCard}>
          <ListItem
            variant="titleCaption"
            avatar={<Avatar type="object" size="xl" isLoading />}
            title={<SkeletonTypography variant="bodyCompact" />}
            caption={<SkeletonTypography variant="captionMD" />}
          />
        </Card>
      );
    } else if (isEmptySlot(props.card)) {
      body = compactPlaceholder;
    } else {
      body = (
        <Card padding="var(--size-1)" className={styles.objectCard}>
          {props.card}
        </Card>
      );
    }
  } else if (props.kind === "shortText") {
    const { value, valueColor, slotLeft } = props;
    const color = valueColor ? { color: valueColor } : undefined;
    if (isLoading) {
      body = (
        <div className={styles.textLines}>
          <SkeletonTypography variant="bodyCompact" />
        </div>
      );
    } else if (value == null || value === "") {
      body = compactPlaceholder;
    } else {
      body = (
        <div className={styles.shortRow}>
          {slotLeft != null && <span className={styles.slotLeft}>{slotLeft}</span>}
          <p className={styles.textShort} style={color}>
            {value}
          </p>
        </div>
      );
    }
  } else if (kind === "avatarStack") {
    const items = (props.kind === "avatarStack" ? props.items : undefined) ?? [];
    const avatarLimit = optOut(props.kind === "avatarStack" ? props.avatarLimit : undefined, DEFAULT_AVATAR_LIMIT);
    const overflows = avatarLimit != null && items.length > avatarLimit;
    if (isLoading) {
      body = (
        <div className={clsx(styles.avatars, styles.avatarsLoading)}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.avatarLoadingRow}>
              <Avatar type="user" size="xs" isLoading />
              <SkeletonTypography variant="bodyCompact" />
            </span>
          ))}
        </div>
      );
    } else if (items.length === 0) {
      body = (
        <div className={styles.avatars}>
          <span className={styles.avatarEmptyRow}>
            <Avatar type="user" size="xs" content="placeholder" />
            <span className={styles.placeholderCompact}>{placeholder}</span>
          </span>
        </div>
      );
    } else {
      body = (
        <div className={styles.avatars}>
          {/* The stack is inline-flex (sizes to content) — pin it to the value
              width so long name lines truncate instead of overflowing. The
              wrapper is the height-animation target for Show more/less. */}
          <div ref={avatarStackRef} className={styles.stackWrap}>
            <AvatarGroup
              variation="stack"
              size="xs"
              items={items}
              max={!expanded && overflows ? avatarLimit : undefined}
              className={styles.stackFill}
            />
          </div>
          {overflows && <ShowMoreButton expanded={expanded} onToggle={toggleAvatars} />}
        </div>
      );
    }
  } else if (isLoading) {
    body = (
      <div className={styles.textLines}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonTypography key={i} variant="bodySpacious" />
        ))}
      </div>
    );
  } else if (props.value == null || props.value === "") {
    body = <p className={clsx(styles.textVertical, styles.placeholderColor)}>{placeholder}</p>;
  } else {
    const { value, valueColor } = props;
    const clampActive = lineLimit != null && !expanded && !animating;
    const clampStyle = clampActive
      ? ({ WebkitLineClamp: lineLimit, color: valueColor } as React.CSSProperties)
      : ({ color: valueColor } as React.CSSProperties);
    body = (
      <div className={styles.textBlock}>
        <p ref={textRef} className={clsx(styles.textVertical, clampActive && styles.textClamped)} style={clampStyle}>
          {value}
        </p>
        {lineLimit != null && (clamped || expanded || animating) && (
          <ShowMoreButton expanded={expanded} onToggle={toggleText} />
        )}
      </div>
    );
  }

  return (
    <div className={clsx(styles.vertical, className)}>
      <span className={styles.labelVertical}>{label}</span>
      {body}
    </div>
  );
}
