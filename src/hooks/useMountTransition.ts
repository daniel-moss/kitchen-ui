import { useEffect, useState } from "react";

// Keep a component mounted across its exit transition. `visible` drives the
// open/closed styles; `mounted` says whether to render at all. When `open`
// flips false we play the exit, then unmount after `duration`. `setVisible` is
// exposed so gestures (e.g. the drawer swipe-dismiss) can start the exit
// immediately. Shared by Popover, Dialog, Prompt, and Menu.
export default function useMountTransition(open: boolean, duration: number) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  // Mount SYNCHRONOUSLY in the render that opens (not in an effect a frame
  // later): content then exists inside the task of the user's tap, which iOS
  // requires for things like focusing a search input (keyboard opening).
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let timer = 0;
    if (open) {
      setMounted(true);
      // Two frames: mount closed, then flip to open so the transition runs.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      timer = window.setTimeout(() => setMounted(false), duration);
    }
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [open, duration]);

  return { mounted, visible, setVisible };
}
