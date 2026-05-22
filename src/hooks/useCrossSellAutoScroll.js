import { useEffect } from 'react';

/**
 * Auto-scroll lento per il carosello cross-sell (loop infinito su lista duplicata).
 */
export function useCrossSellAutoScroll(scrollRef, options = {}) {
  const { speed = 0.18, enabled = false, itemCount = 0 } = options;

  useEffect(() => {
    if (!enabled || speed <= 0) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let disposed = false;
    let rafId = 0;
    let paused = false;
    let listenersBound = false;

    const getEl = () => scrollRef.current;

    const canScroll = (el) => el.scrollWidth - el.clientWidth > 8;

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };

    const bindListeners = (el) => {
      if (!el || listenersBound) return;
      listenersBound = true;
      el.addEventListener('pointerdown', pause);
      el.addEventListener('pointerup', resume);
      el.addEventListener('pointercancel', resume);
    };

    const unbindListeners = (el) => {
      if (!el || !listenersBound) return;
      listenersBound = false;
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('pointerup', resume);
      el.removeEventListener('pointercancel', resume);
    };

    const loop = () => {
      if (disposed) return;

      const el = getEl();
      if (!el) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      bindListeners(el);

      if (canScroll(el) && !paused && !el.classList.contains('is-dragging')) {
        const half = el.scrollWidth / 2;
        el.scrollLeft += speed;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      unbindListeners(getEl());
    };
  }, [scrollRef, enabled, speed, itemCount]);
}
