/** Varianti: default (1 cella), featured (2×2 celle, orizzontale), wide (banner orizzontale). */

export function getProductCardVariant(product, layout) {
  return layout?.variants?.[product.id] ?? 'default';
}

export function buildBentoLayout(products) {
  const pool = [...products];
  const order = [];
  const variants = {};

  const take = (predicate) => {
    const idx = pool.findIndex(predicate);
    if (idx === -1) return null;
    return pool.splice(idx, 1)[0];
  };

  const takeAny = () => pool.shift() ?? null;

  const place = (product, variant) => {
    if (!product) return;
    order.push(product);
    variants[product.id] = variant;
  };

  if (pool.length === 0) return { order, variants };

  const placeFeatured = () => {
    place(take((p) => p.isBestseller) ?? takeAny(), 'featured');
  };

  // Hero ~4 celle (2 colonne × 2 righe)
  placeFeatured();

  // Due piccole sotto il blocco hero
  if (pool.length) place(takeAny(), 'default');
  if (pool.length) place(takeAny(), 'default');

  // Altra grande ogni ~6 prodotti se restano abbastanza voci
  if (pool.length >= 4) {
    placeFeatured();
    if (pool.length) place(takeAny(), 'default');
    if (pool.length) place(takeAny(), 'default');
  }

  // Fascia compatta
  const compactSlots = Math.min(4, Math.max(0, pool.length - 1));
  for (let n = 0; n < compactSlots && pool.length > 1; n += 1) {
    place(takeAny(), 'default');
  }

  // Banner orizzontale (solo larghezza, una riga)
  if (pool.length) {
    place(
      take((p) => p.description) ?? take((p) => p.isBestseller) ?? takeAny(),
      'wide'
    );
  }

  while (pool.length) {
    place(takeAny(), 'default');
  }

  return { order, variants };
}

/** @deprecated */
export function getFeaturedIds(products) {
  const { variants } = buildBentoLayout(products);
  let wideId = null;
  let featuredId = null;
  for (const [id, v] of Object.entries(variants)) {
    if (v === 'wide' && !wideId) wideId = Number(id);
    if (v === 'featured' && !featuredId) featuredId = Number(id);
  }
  return { wideId, featuredId };
}

/** @deprecated */
export function sortProductsForBento(products) {
  const { order } = buildBentoLayout(products);
  return order.length ? order : products;
}
