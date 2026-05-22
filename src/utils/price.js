export function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

export function splitPrice(value) {
  const rounded = roundPrice(value);
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  return { whole, cents: cents.toString().padStart(2, '0'), total: rounded };
}

export function formatPriceButton(value) {
  const { whole, cents } = splitPrice(value);
  return { whole, cents };
}

export function calcLineTotal(item) {
  const extrasTotal = (item.extras || []).reduce(
    (sum, ex) => sum + (ex.price || 0) * (ex.count || 0),
    0
  );
  const mealExtra = item.mealUpgrade?.price || 0;
  return roundPrice((item.unitPrice + extrasTotal + mealExtra) * item.quantity);
}

export function calcCartSubtotal(items) {
  return roundPrice(items.reduce((sum, item) => sum + calcLineTotal(item), 0));
}
