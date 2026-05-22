/** Il combo menu include patatine e bibita. */
export function itemIncludesMealCombo(item) {
  return (
    item?.productType === 'meal' ||
    item?.includesCombo === true ||
    Boolean(item?.mealUpgrade) ||
    /\bmenu\b/i.test(item?.name ?? '')
  );
}

/** Etichetta riga ordine per riepilogo (es. "Big Mac Menu x1"). */
export function formatOrderLineTitle(item) {
  const qty = item.quantity ?? 1;
  return `${item.name} x${qty}`;
}

/** Righe secondarie: upgrade menu, patatine, bibita, extra. */
export function getOrderLineMeta(item, t, language) {
  const lines = [];

  if (item.mealUpgrade?.name) {
    lines.push(item.productType === 'meal' ? item.mealUpgrade.name : `+ ${item.mealUpgrade.name}`);
  }

  if (itemIncludesMealCombo(item)) {
    if (item.menuCombo?.fries?.name) {
      const friesLabel = item.menuCombo.fries.name;
      const surcharge = item.menuCombo.friesSurcharge ?? 0;
      lines.push(
        surcharge > 0 ? `${friesLabel} (+${surcharge.toFixed(2)} €)` : friesLabel
      );
    } else {
      lines.push(t(language, 'mealIncludesFries'));
    }
    if (item.menuCombo?.drink?.name) {
      lines.push(item.menuCombo.drink.name);
    } else {
      lines.push(t(language, 'mealIncludesDrink'));
    }
  }

  if (item.extras?.length) {
    item.extras
      .filter((ex) => ex.count > 0)
      .forEach((ex) => {
        lines.push(ex.count > 1 ? `+ ${ex.name} x${ex.count}` : `+ ${ex.name}`);
      });
  }

  return lines;
}
