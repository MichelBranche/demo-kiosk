import React, { useState } from 'react';

const FALLBACK = '🍔';

export default function MenuProductImage({ src, alt, className = 'product-image' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className="product-image-fallback" aria-hidden>{FALLBACK}</span>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
