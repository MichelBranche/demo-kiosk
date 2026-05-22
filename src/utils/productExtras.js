import { getExtrasForProduct, getPersonalizationProduct, products } from '../data';

export function initExtrasForProduct(product, catalog = products) {
  const target = getPersonalizationProduct(product, catalog);
  if (!target) return [];
  return getExtrasForProduct(target).map((ex) => ({ ...ex, count: ex.defaultCount }));
}

/** Extra completi per unità di personalizzazione (stato carrello o default). */
export function resolveUnitExtras(unitId, { product, unit, extras, pendingLine, catalog = products }) {
  if (unitId === 'main') {
    if (extras?.length) return extras.map((ex) => ({ ...ex }));
    return initExtrasForProduct(product, catalog).map((ex) => ({ ...ex }));
  }

  const linked = unit?.product ?? catalog.find((p) => p.id === pendingLine?.productId);
  if (!linked) return [];

  if (pendingLine?.extras?.length) {
    const defaults = initExtrasForProduct(linked, catalog);
    return defaults.map((ex) => {
      const saved = pendingLine.extras.find((e) => e.id === ex.id);
      return saved ? { ...ex, count: saved.count } : ex;
    });
  }

  return initExtrasForProduct(linked, catalog).map((ex) => ({ ...ex }));
}

export function extraDisplayName(extra, language, t) {
  return extra.nameKey ? t(language, extra.nameKey) : extra.name;
}
