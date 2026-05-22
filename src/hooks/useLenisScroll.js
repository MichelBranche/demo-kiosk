import { useEffect } from 'react';
import Lenis from 'lenis';
import { useLenisContext } from '../context/LenisContext';

const defaultOptions = {
  smoothWheel: true,
  lerp: 0.1,
  wheelMultiplier: 0.85,
  touchMultiplier: 1.4,
  syncTouch: true,
  allowNestedScroll: true,
  autoRaf: true,
};

/**
 * Lenis su contenitori scroll verticali (wrapper scrollabile + content interno).
 */
export function useLenisScroll(wrapperRef, contentRef, options = {}) {
  const ctx = useLenisContext();
  const { enabled = true, orientation = 'vertical' } = options;

  useEffect(() => {
    if (!enabled) return;

    let lenis = null;
    let cancelled = false;

    const mount = () => {
      if (cancelled) return;
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content) {
        requestAnimationFrame(mount);
        return;
      }

      const reduced = ctx?.reducedMotion ?? false;

      lenis = new Lenis({
        wrapper,
        content,
        orientation,
        ...defaultOptions,
        lerp: reduced ? 1 : defaultOptions.lerp,
        smoothWheel: !reduced,
      });

      requestAnimationFrame(() => {
        lenis?.resize();
        lenis?.start();
      });
    };

    mount();

    return () => {
      cancelled = true;
      lenis?.destroy();
      lenis = null;
    };
  }, [wrapperRef, contentRef, enabled, orientation, ctx?.reducedMotion]);
}
