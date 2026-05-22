import { getCategoryPillMeta } from '../data';

const defaultPillFilters = {
  Beef: (p) => p.tags?.includes('beef'),
  Chicken: (p) => p.tags?.includes('chicken'),
  McCrispy: (p) => p.tags?.includes('mccrispy') || p.type === 'wrap',
  McFlurry: (p) => p.tags?.includes('mcflurry'),
  'Plant Based': (p) => p.tags?.includes('plant'),
};

export function filterProducts(products, categoryId, activePill) {
  let result = products.filter((p) => p.category === categoryId);

  if (!activePill || activePill === 'All') return result;

  const meta = getCategoryPillMeta(categoryId);
  if (meta) {
    const entry = meta.find((c) => c.pill === activePill);
    if (entry?.tag) {
      return result.filter((p) => p.tags?.includes(entry.tag));
    }
    return result;
  }

  if (defaultPillFilters[activePill]) {
    return result.filter(defaultPillFilters[activePill]);
  }

  return result;
}

export function getPillLabel(pill, categoryId, language, t) {
  if (pill === 'All') return t(language, 'pillAll');
  const meta = getCategoryPillMeta(categoryId);
  const entry = meta?.find((c) => c.pill === pill);
  if (entry?.labelKey) return t(language, entry.labelKey);
  return pill;
}
