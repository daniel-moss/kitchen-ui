
import { Icon } from "../../components/Icon/Icon";
import { IconPack } from "../../components/Icon/Icon.types";
import { toast } from "../../components/Toast/Toaster";

// The anchored-menu helper moved to the forms tier (the form preview panel
// needs it too); re-exported so every prototype import keeps working.
export { useAnchoredMenu } from "../../forms/shared/anchoredMenu";
export type { AnchoredMenuPos } from "../../forms/shared/anchoredMenu";

// Shared helpers of the Job Details prototype (used by the shell AND the
// details panel — keep them out of JobDetails.tsx to avoid import cycles).

export const noop = () => {};

/** MenuItem left icon (square 16px box). `pack` for kit custom icons. */
export const slot = (icon: string, pack?: IconPack) => <Icon icon={icon} pack={pack} container="square" />;

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

