import { getExtrasForProduct } from '../data';

export function initExtrasForProduct(product) {
  return getExtrasForProduct(product).map((ex) => ({ ...ex, count: ex.defaultCount }));
}

export function extraDisplayName(extra, language, t) {
  return extra.nameKey ? t(language, extra.nameKey) : extra.name;
}
