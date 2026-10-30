import { Skeleton } from "../Skeleton/Skeleton";

import type { InputGroupPosition } from "./InputGroup/InputGroup.types";

// FieldSkeleton — the loading look shared by the fields (Figma
// `_InputBackground` variant=loading, 2026-10-30): one field-high Skeleton
// block — no value, no placeholder, no icons, no border. Inside an InputGroup
// only the group's outer corners round, like the segments it stands in for.
const RADIUS: Record<InputGroupPosition, string> = {
  first: "var(--border-radius-2) 0 0 var(--border-radius-2)",
  middle: "0",
  last: "0 var(--border-radius-2) var(--border-radius-2) 0",
};

export function FieldSkeleton({ position }: { position?: InputGroupPosition }) {
  return (
    <Skeleton
      width="100%"
      height="var(--size-9)" // 36px — the field height
      borderRadius={position ? RADIUS[position] : "var(--border-radius-2)"}
    />
  );
}
