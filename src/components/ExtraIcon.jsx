import React from 'react';

export function isExtraImagePath(image) {
  return typeof image === 'string' && (image.startsWith('/') || image.startsWith('http'));
}

export default function ExtraIcon({ image, alt = '' }) {
  if (isExtraImagePath(image)) {
    return (
      <span className="extra-icon extra-icon--img">
        <img src={image} alt={alt} loading="lazy" decoding="async" />
      </span>
    );
  }
  return (
    <span className="extra-icon" aria-hidden={!alt}>
      {image}
    </span>
  );
}
