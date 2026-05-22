import React from 'react';
import { splitPrice } from '../utils/price';

export default function Price({ value, className = '', currency = '€', light = false, size = 'md' }) {
  const { whole, cents } = splitPrice(value);
  return (
    <div
      className={`product-price product-price--${size} ${className} ${light ? 'price-light' : ''}`}
    >
      <span className="price-value">{whole}</span>
      <span className="price-cents">.{cents}</span>
      <span className="price-currency"> {currency}</span>
    </div>
  );
}
