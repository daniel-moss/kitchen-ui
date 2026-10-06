import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { toast } from "../../components/Toast/Toaster";

// Helpers every module tier can use. Moved here from the Job Details
// prototype's local `shared.tsx` on 2026-09-28, when FilesModule became a
// shared module and the Equipment side panel needed the same copy behaviour.

export const noop = () => {};

/** MenuItem left icon (square 16px box). `pack` for kit custom icons. */
/**
 * A MenuItem / row icon. `color` paints it — the glyph inherits `currentColor`,
 * so an inline colour is all it takes. Used for the job-status actions, whose
 * solid icons carry their status colour so the actions are easier to pick out
 * (Daniel, 2026-10-05).
 */
export const slot = (icon: string, pack?: IconPack, color?: string) => (
  <Icon icon={icon} pack={pack} container="square" style={color == null ? undefined : { color }} />
);

// Real copy — the clipboard API needs a secure context; the textarea fallback
// covers plain-http LAN testing on the phone. Success/failure show the
// designed toasts ('"<label>" copied' / detailed error).
//
// `title` overrides the success copy: the ID toasts quote the label ('"Job ID"
// copied', node 21136-58182) but the CONTACT ones do not ("Email address
// copied", node 21758-23044) — two designed formats, so the caller picks.
// `errorTitle` does the same for the failure toast (Send-summary's reads
// "Could not copy summary link", node 24577-160713).
export const copyText = async (text: string, label: string, title?: string, errorTitle?: string) => {
  try {
    if (navigator.clipboard != null) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) throw new Error("execCommand failed");
    }
    toast({ type: "neutral", icon: "copy", title: title ?? `"${label}" copied` });
  } catch {
    toast({
      type: "error",
      variant: "detailed",
      title: errorTitle ?? `Could not copy "${label}"`,
      caption: "Something went wrong. Please try again.",
    });
  }
};
