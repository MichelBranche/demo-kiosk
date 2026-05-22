import React from 'react';

/** Icona "Al ristorante" — Big Mac dalla reference PNG. */
export default function DineInTrayIcon({ className = '' }) {
  return (
    <img
      src="/brand/dine-in-icon.png"
      alt=""
      className={className}
      draggable={false}
    />
  );
}
