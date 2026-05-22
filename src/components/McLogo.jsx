import React from 'react';
import './McLogo.css';

const LOGO_ARCHES = '/brand/logo-arches.png';
const LOGO_BOX = '/brand/logo-box.png';

export default function McLogo({ compact = false, variant = 'default' }) {
  if (compact) {
    return (
      <div className="mcd-logo mcd-logo--compact" aria-label="McDonald's">
        <img src={LOGO_ARCHES} alt="" className="mcd-logo-img mcd-logo-img--arches" />
      </div>
    );
  }

  if (variant === 'arches') {
    return (
      <div className="mcd-logo mcd-logo--arches-only" aria-label="McDonald's">
        <img src={LOGO_ARCHES} alt="" className="mcd-logo-img mcd-logo-img--arches-large" />
      </div>
    );
  }

  if (variant === 'navbar' || variant === 'start') {
    return (
      <div
        className={`mcd-logo ${variant === 'navbar' ? 'mcd-logo--navbar' : 'mcd-logo--start'}`}
        aria-label="McDonald's"
      >
        <img src={LOGO_ARCHES} alt="" className="mcd-logo-img mcd-logo-img--arches" />
      </div>
    );
  }

  return (
    <div className="mcd-logo" aria-label="McDonald's">
      <img src={LOGO_BOX} alt="McDonald's" className="mcd-logo-img mcd-logo-img--box" />
    </div>
  );
}
