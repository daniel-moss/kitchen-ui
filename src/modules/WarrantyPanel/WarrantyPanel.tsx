import SidePanel from "../../components/SidePanel/SidePanel";

import { useWarrantyPanelView } from "./useWarrantyPanelView";
import { WarrantyPanelProps } from "./WarrantyPanel.types";

// The "Warranty" side panel (Figma file RhlvzzPevWrSHCjZRPL19E, page
// "👍 Validated"). ONE module for every warranty object; the warranty record is
// a prop, so nothing here is specific to one warranty.
//
// Unlike the Equipment panel this one has NO navigation and NO footer (the
// node's SidePanel sets nav=false, footer=false) — the body is just the two
// display modules: General details · Notes.
//
// This file is only the SHELL. Everything inside lives in
// `useWarrantyPanelView`, because the Equipment panel shows the same view
// inside ITS panel (the SidePanel rule: a link never stacks a second panel).

export default function WarrantyPanel({
  open,
  onClose,
  warranty,
  onBack,
  onSaveDetails,
  onSaveNotes,
  onDelete,
  isLoading = false,
  state = "content",
  onRetry,
  breakpoint = "auto",
}: WarrantyPanelProps) {
  const view = useWarrantyPanelView({
    warranty,
    active: open,
    onSaveDetails,
    onSaveNotes,
    onDelete,
    isLoading,
    breakpoint,
  });

  return (
    <>
      <SidePanel
        open={open}
        onClose={onClose}
        onBack={onBack}
        title={view.title}
        avatar={view.avatar}
        headerActions={view.headerActions}
        state={state}
        onRetry={onRetry}
        breakpoint={breakpoint}
      >
        {view.body}
      </SidePanel>
      {view.overlays}
    </>
  );
}

// Re-exported so a consumer can type its handlers without reaching inside.
export type { WarrantyEdits, WarrantyPanelProps } from "./WarrantyPanel.types";
