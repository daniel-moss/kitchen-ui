import { OTHER_ITEMS } from "../../../../data/db";
import type { ChargeItem } from "../../../../data/db";
import OtherChargeSelectList from "../../../OtherCharge/OtherChargeSelectList/OtherChargeSelectList";
import { otherAmount } from "../lineDisplay";
import OtherLineForm from "../LineForms/OtherLineForm";
import { noop } from "../../shared";

import CardGroup, { canDragCards } from "./CardGroup";
import type { ChargesGroupProps } from "./Concept4";
import OtherCard from "./OtherCard";
import useCardLines from "./useCardLines";

export default function OtherChargesGroup({ job, lines, setLines, hasSubtypes, isPublic, mobile }: ChargesGroupProps) {
  const cards = useCardLines<ChargeItem>(lines, setLines, "charge", mobile);
  const charge = cards.item;

  return (
    <>
      <CardGroup
        {...cards.group}
        title="Other charges"
        addLabel="Add other charge"
        empty="No charges"
        total={cards.lines.reduce((acc, line) => acc + otherAmount(line.other!), 0)}
        isPublic={isPublic}
      >
        {cards.lines.map((line) => {
          const item = OTHER_ITEMS.find((row) => row.id === line.otherChargeId);
          return (
            <OtherCard
              key={line.id}
              title={line.title}
              line={line.other!}
              hasSubtypes={hasSubtypes}
              isPublic={isPublic}
              draggable={canDragCards(cards.lines.length, isPublic)}
              onClick={() => item != null && cards.edit(item, line)}
            />
          );
        })}
      </CardGroup>

      {/* A footer action ("Add other charge") only closes the list, as in the other concepts. */}
      <OtherChargeSelectList {...cards.list} charges={OTHER_ITEMS} onAddCharge={noop} />
      {charge != null && (
        <OtherLineForm
          {...cards.formProps}
          job={job}
          charge={charge}
          line={cards.editing?.other}
          onSubmit={(line) => cards.commit(charge.name, { other: line, otherChargeId: charge.id })}
          hasSubtypes={hasSubtypes}
        />
      )}
      {cards.deletePrompt}
    </>
  );
}
