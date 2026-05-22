import React from 'react';

/** Icona categoria: PNG con sfondo trasparente oppure emoji di fallback. */
export default function CategoryIcon({ iconSrc, icon, active }) {
  if (iconSrc) {
    return (
      <span className={`category-icon-wrap ${active ? 'category-icon-wrap--active' : ''}`} aria-hidden>
        <img src={iconSrc} alt="" className="category-icon-img" draggable={false} />
      </span>
    );
  }

  return (
    <span className={`category-icon category-icon--emoji ${active ? 'category-icon--active' : ''}`} aria-hidden>
      {icon}
    </span>
  );
}
