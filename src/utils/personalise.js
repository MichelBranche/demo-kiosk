import { getPersonalizationProduct } from '../data';
import { initExtrasForProduct } from './productExtras';

export function getPersonalisableUnits(mainProduct, pendingCrossSells, catalog) {
  const units = [];
  const mainTarget = getPersonalizationProduct(mainProduct, catalog);
  if (mainTarget) {
    units.push({
      id: 'main',
      product: mainTarget,
      name: mainTarget.name,
      image: mainTarget.image,
    });
  }
  (pendingCrossSells ?? []).forEach((line) => {
    const linked = catalog.find((p) => p.id === line.productId);
    const target = linked ? getPersonalizationProduct(linked, catalog) : null;
    if (target) {
      units.push({
        id: line.crossSellKey,
        product: target,
        name: line.name,
        image: line.image,
      });
    }
  });
  return units;
}

export function extrasMatchDefaults(extras, product, catalog) {
  const defaults = initExtrasForProduct(product, catalog);
  return defaults.every((def) => {
    const current = extras.find((ex) => ex.id === def.id);
    return (current?.count ?? 0) === (def.defaultCount ?? 0);
  });
}
