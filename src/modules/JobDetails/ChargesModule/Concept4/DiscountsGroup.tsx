import { DISCOUNT_ITEMS } from "../../../../data/db";
import type { ChargeItem } from "../../../../data/db";
import DiscountSelectList from "../../../Discount/DiscountSelectList/DiscountSelectList";
import { discountAmount } from "../lineDisplay";
import DiscountLineForm from "../LineForms/DiscountLineForm";
import { noop } from "../../shared";

import CardGroup, { canDragCards } from "./CardGroup";
import type { ChargesGroupProps } from "./Concept4";
import DiscountCard from "./DiscountCard";
import useCardLines from "./useCardLines";

export default function DiscountsGroup({ job, lines, setLines, hasSubtypes, isPublic, mobile }: ChargesGroupProps) {
  const cards = useCardLines<ChargeItem>(lines, setLines, "discount", mobile);
  const discount = cards.item;

  return (
    <>
      <CardGroup
        {...cards.group}
        title="Discounts"
        addLabel="Add discount"
        empty="No discounts"
        total={cards.lines.reduce((acc, charge) => acc + discountAmount(charge.discount!), 0)}
        isPublic={isPublic}
      >
        {cards.lines.map((charge) => {
          const item = DISCOUNT_ITEMS.find((row) => row.id === charge.discountId);
          return (
            <DiscountCard
              key={charge.id}
              title={charge.title}
              line={charge.discount!}
              hasSubtypes={hasSubtypes}
              isPublic={isPublic}
              draggable={canDragCards(cards.lines.length, isPublic)}
              onClick={() => item != null && cards.edit(item, charge)}
            />
          );
        })}
      </CardGroup>

      {/* A footer action ("Add discount") only closes the list, as in the other concepts. */}
      <DiscountSelectList {...cards.list} discounts={DISCOUNT_ITEMS} onAddDiscount={noop} />
      {discount != null && (
        <DiscountLineForm
          {...cards.formProps}
          job={job}
          discount={discount}
          line={cards.editing?.discount}
          onSubmit={(line) => cards.commit(discount.name, { discount: line, discountId: discount.id })}
          hasSubtypes={hasSubtypes}
        />
      )}
      {cards.deletePrompt}
    </>
  );
}
