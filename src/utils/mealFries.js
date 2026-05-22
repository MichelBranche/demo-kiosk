import { products } from '../data';
import { roundPrice } from './price';

/** Patatine incluse per dimensione menu (allineate a Menu Medio / Grande). */
export const MEAL_INCLUDED_FRIES_BY_SIZE = {
  'meal-medium': 44,
  'meal-large': 14,
};

export function getIncludedFriesForMealSize(sizeOptionId) {
  const productId = MEAL_INCLUDED_FRIES_BY_SIZE[sizeOptionId];
  if (!productId) return null;
  return products.find((p) => p.id === productId) ?? null;
}

/** Supplemento se le patatine scelte costano più di quelle incluse nel menu. */
export function calcMealFriesSurcharge(sizeOption, selectedFries) {
  if (!sizeOption?.id || !selectedFries?.id) return 0;
  const included = getIncludedFriesForMealSize(sizeOption.id);
  if (!included || selectedFries.id === included.id) return 0;
  const selected = products.find((p) => p.id === selectedFries.id);
  if (!selected) return 0;
  return roundPrice(Math.max(0, selected.price - included.price));
}
