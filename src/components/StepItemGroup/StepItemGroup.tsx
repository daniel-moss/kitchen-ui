import { Children, isValidElement, useEffect, useRef } from "react";
import clsx from "clsx";

import styles from "./StepItemGroup.module.scss";
import { StepItemGroupProps } from "./StepItemGroup.types";

// A row of StepItems laid out as a stepper: a hairline band with a centered
// stack. The stack fills the band up to its 528px cap; when the steps hit
// their 104px min-width and need more, the stack grows beyond the cap —
// centered, never clipped (Daniel 2026-07-27). Only when the whole band is
// narrower than the steps does the BAND scroll (hidden scrollbar), with the
// current step auto-centered. See Figma "StepItemGroup".
export default function StepItemGroup({ children, className, ...rest }: StepItemGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  // Index of the "current" step (to auto-center it while the band scrolls).
  const currentIndex = Children.toArray(children).findIndex(
    (child) => isValidElement(child) && (child.props as { progress?: string }).progress === "current",
  );

  useEffect(() => {
    const group = groupRef.current;
    const stack = stackRef.current;
    if (!group || !stack) return;

    const center = () => {
      if (currentIndex < 0) return;
      const step = stack.children[currentIndex] as HTMLElement | undefined;
      if (!step) return;
      // Only when the steps actually overflow the band.
      if (group.scrollWidth <= group.clientWidth) return;
      const stepLeft = step.getBoundingClientRect().left - group.getBoundingClientRect().left + group.scrollLeft;
      const target = stepLeft - (group.clientWidth - step.clientWidth) / 2;
      const max = group.scrollWidth - group.clientWidth;
      group.scrollLeft = Math.max(0, Math.min(target, max));
    };

    center();
    // Re-center when the band resizes (responsive width changes).
    const observer = new ResizeObserver(center);
    observer.observe(group);
    return () => observer.disconnect();
  }, [currentIndex]);

  return (
    <div className={clsx(styles.group, className)} ref={groupRef} {...rest}>
      <div className={styles.stack} ref={stackRef}>
        {children}
      </div>
    </div>
  );
}
