import AvatarLocation from "../../../components/Avatar/AvatarLocation";
import DisplayModule from "../../../components/DisplayModule/DisplayModule";
import ItemGroup from "../../../components/ItemGroup/ItemGroup";
import ListItem from "../../../components/ListItem/ListItem";
import ListItemSlotIcon from "../../../components/ListItem/ListItemSlotIcon";

// The "Location" module (Figma 21958-15149). One row: the CLIENT on the title
// line and the location under it, opening the Location side panel. The module
// header carries no button of its own.

interface LocationModuleProps {
  /** Title line — the client that owns the site (the row's own annotation). */
  clientName: string;
  /** Caption — the location's name, or its street address when it has none. */
  locationCaption: string;
  onOpen: () => void;
  isLoading?: boolean;
}

export default function LocationModule({ clientName, locationCaption, onOpen, isLoading = false }: LocationModuleProps) {
  return (
    <DisplayModule
      title="Location"
      // The ItemGroup brings the body's 4px padding, so the module adds none.
      bodyPadded={false}
      content={
        <ItemGroup>
          <ListItem
            variant="titleCaption"
            title={clientName}
            caption={locationCaption}
            // "Wraps, if doesn't fit 1 line" (the caption's annotation) —
            // confirmed by Daniel 2026-09-28 over the node's own truncation.
            captionLines="wrap"
            avatar={<AvatarLocation size="xl" />}
            isClickable
            isLoading={isLoading}
            onClick={onOpen}
            slotRight={<ListItemSlotIcon icon="angle-right" />}
          />
        </ItemGroup>
      }
    />
  );
}
