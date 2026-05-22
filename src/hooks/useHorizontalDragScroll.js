import { useEffect } from 'react';

const DRAG_THRESHOLD = 6;

/**
 * Scroll orizzontale manuale: trascinamento touch/mouse + rotella.
 */
export function useHorizontalDragScroll(scrollRef, options = {}, enabled = true) {
  const { pauseOnHover = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const state = {
      active: false,
      startX: 0,
      startScroll: 0,
      moved: false,
      captured: false,
    };

    const maxScroll = () => Math.max(0, el.scrollWidth - el.clientWidth);

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      state.active = true;
      state.startX = e.clientX;
      state.startScroll = el.scrollLeft;
      state.moved = false;
      state.captured = false;
    };

    const onPointerMove = (e) => {
      if (!state.active) return;
      const dx = e.clientX - state.startX;
      if (!state.moved && Math.abs(dx) < DRAG_THRESHOLD) return;

      if (!state.moved) {
        state.moved = true;
        el.classList.add('is-dragging');
      }

      el.scrollLeft = Math.min(maxScroll(), Math.max(0, state.startScroll - dx));

      if (!state.captured) {
        el.setPointerCapture(e.pointerId);
        state.captured = true;
      }
      e.preventDefault();
    };

    const endPointer = (e) => {
      if (!state.active) return;
      const wasCaptured = state.captured;
      if (state.moved) {
        el.dataset.suppressClick = '1';
        requestAnimationFrame(() => {
          delete el.dataset.suppressClick;
        });
      }
      state.active = false;
      state.moved = false;
      state.captured = false;
      el.classList.remove('is-dragging');
      if (wasCaptured && e?.pointerId != null) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const onClickCapture = (e) => {
      if (el.dataset.suppressClick === '1') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onWheel = (e) => {
      if (!el.contains(e.target)) return;
      if (maxScroll() < 1) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      el.scrollLeft = Math.min(maxScroll(), Math.max(0, el.scrollLeft + delta));
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('lostpointercapture', endPointer);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endPointer);
      el.removeEventListener('pointercancel', endPointer);
      el.removeEventListener('lostpointercapture', endPointer);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('wheel', onWheel);
      el.classList.remove('is-dragging');
    };
  }, [scrollRef, enabled, pauseOnHover]);
}
