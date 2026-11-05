import { useState } from "react";

import { COMPANY, LABOR_ITEMS } from "../../../../data/db";
import type { LaborItem } from "../../../../data/db";
import LaborRatePanel from "../../../LaborRatePanel/LaborRatePanel";
import LaborRateSelectList from "../../../LaborRateSelectList/LaborRateSelectList";
import { laborAmount } from "../lineDisplay";
import LaborLineForm from "../LineForms/LaborLineForm";
import { noop } from "../../shared";

import CardGroup, { canDragCards } from "./CardGroup";
import type { ChargesGroupProps } from "./Concept4";
import LaborCard from "./LaborCard";
import useCardLines from "./useCardLines";

export default function LaborRatesGroup({ job, lines, setLines, hasSubtypes, isPublic, mobile }: ChargesGroupProps) {
  const cards = useCardLines<LaborItem>(lines, setLines, "labor rate", mobile);
  const rate = cards.item;
  // "Click here" in the form's Cost help text — the rate's side panel, above the form.
  const [ratePanel, setRatePanel] = useState<LaborItem | null>(null);

  return (
    <>
      <CardGroup
        {...cards.group}
        title="Labor rates"
        addLabel="Add labor rate"
        empty="No labor rates"
        total={cards.lines.reduce((acc, charge) => acc + laborAmount(charge.labor!), 0)}
        isPublic={isPublic}
      >
        {cards.lines.map((charge) => {
          const item = LABOR_ITEMS.find((row) => row.id === charge.laborRateId);
          return (
            <LaborCard
              key={charge.id}
              title={charge.title}
              line={charge.labor!}
              hasSubtypes={hasSubtypes}
              isPublic={isPublic}
              draggable={canDragCards(cards.lines.length, isPublic)}
              onClick={() => item != null && cards.edit(item, charge)}
            />
          );
        })}
      </CardGroup>

      {/* A footer action ("Add labor rate") only closes the list, as in the other concepts. */}
      <LaborRateSelectList {...cards.list} rates={LABOR_ITEMS} onAddLaborRate={noop} useTaxes={COMPANY.useTaxes} />
      {rate != null && (
        <LaborLineForm
          {...cards.formProps}
          job={job}
          rate={rate}
          line={cards.editing?.labor}
          onSubmit={(labor) => cards.commit(rate.name, { labor, laborRateId: rate.id })}
          onOpenRate={() => setRatePanel(rate)}
          hasSubtypes={hasSubtypes}
        />
      )}
      {cards.deletePrompt}
      {ratePanel != null && (
        <LaborRatePanel
          open
          onClose={() => setRatePanel(null)}
          rate={ratePanel}
          requireSubtypes={COMPANY.requireSubtypes}
          useTaxes={COMPANY.useTaxes}
          breakpoint={cards.breakpoint}
        />
      )}
    </>
  );
}
