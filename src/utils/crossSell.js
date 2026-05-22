/**
 * Ordine voci cross-sell in scheda prodotto.
 *
 * Oggi: `random` — mescola a ogni apertura prodotto.
 * Futuro: collegare app gestionale e usare `popular` con ranking da API
 * (es. GET /kiosk/cross-sell?storeId=… → [{ productId, score }]).
 */

export const CROSS_SELL_SORT_MODES = {
  RANDOM: 'random',
  /** Prodotti più acquistati (da implementare con backend gestionale). */
  POPULAR: 'popular',
  /** Ordine fisso definito in data.js (fallback admin). */
  MANUAL: 'manual',
};

function shuffleArray(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * @param {Array} items — catalogo cross-sell (data.js)
 * @param {object} options
 * @param {string} options.mode — CROSS_SELL_SORT_MODES
 * @param {Array<{ productId: number, score?: number }>} [options.popularRanking] — da API gestionale
 */
export function orderCrossSellItems(items, options = {}) {
  const { mode = CROSS_SELL_SORT_MODES.RANDOM, popularRanking = null } = options;

  if (mode === CROSS_SELL_SORT_MODES.MANUAL || !items?.length) {
    return [...items];
  }

  if (mode === CROSS_SELL_SORT_MODES.POPULAR && popularRanking?.length) {
    const scoreByProductId = new Map(
      popularRanking.map((row, index) => [
        row.productId,
        row.score ?? popularRanking.length - index,
      ])
    );
    return [...items].sort((a, b) => {
      const scoreA = scoreByProductId.get(a.productId) ?? 0;
      const scoreB = scoreByProductId.get(b.productId) ?? 0;
      return scoreB - scoreA;
    });
  }

  return shuffleArray(items);
}

/** Doppia lista per carosello a loop continuo. */
export function buildCrossSellLoop(items, sortOptions = {}) {
  const ordered = orderCrossSellItems(items, sortOptions);
  return [...ordered, ...ordered].map((item, index) => ({
    ...item,
    loopKey: `${item.id}-${index}`,
  }));
}

function productToCrossSellItem(product) {
  return {
    id: `meal-extra-${product.id}`,
    name: product.name,
    price: product.price,
    image: product.image,
    isBestseller: product.isBestseller,
    productId: product.id,
  };
}

/** Mix alternato Salvaeuro + Sfiziosità per lo step extra del menu. */
export function buildMealExtraCrossSellItems(catalog, { maxItems = 12 } = {}) {
  const coupons = shuffleArray(
    catalog.filter((p) => p.category === 'coupons' && p.image)
  );
  const sides = shuffleArray(
    catalog.filter(
      (p) => p.category === 'sides' && p.image && !p.tags?.includes('fries')
    )
  );

  const mixed = [];
  const limit = Math.max(coupons.length, sides.length);
  for (let i = 0; i < limit && mixed.length < maxItems; i += 1) {
    if (coupons[i] && mixed.length < maxItems) mixed.push(productToCrossSellItem(coupons[i]));
    if (sides[i] && mixed.length < maxItems) mixed.push(productToCrossSellItem(sides[i]));
  }

  return mixed;
}
