// Cross-component lock for row drag-reorder. While a ItemGroup row drag
// is underway, other gesture owners must stand down: the Popover drawer's
// dismiss-drag (a long-press drag starts mid-gesture, AFTER pointerdown has
// already bubbled to and armed the sheet — stopPropagation can not help
// there) and ListItem's tap activation on release. A module-level flag is
// enough: drags are global and one-at-a-time by nature.
let rowDragActive = false;

export const setRowDragActive = (active: boolean) => {
  rowDragActive = active;
};

export const isRowDragActive = () => rowDragActive;
