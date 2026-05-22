import React, { useRef } from 'react';
import { useLenisScroll } from '../hooks/useLenisScroll';

/**
 * Area scroll verticale con Lenis (wrapper + content interno).
 */
export default function LenisScrollArea({ className = '', children, enabled = true }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  useLenisScroll(wrapperRef, contentRef, { enabled });

  return (
    <div ref={wrapperRef} className={`lenis-scroll-view ${className}`.trim()}>
      <div ref={contentRef} className="lenis-scroll-content">
        {children}
      </div>
    </div>
  );
}
