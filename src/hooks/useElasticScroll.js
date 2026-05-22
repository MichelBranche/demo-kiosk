import { useEffect, useRef } from 'react';

const MAX_PULL = 140;
const WHEEL_RESISTANCE = 0.72;
const DRAG_RESISTANCE = 0.82;
const WHEEL_RELEASE_MS = 200;
const PULLING_CLASS = 'elastic-pulling';

function wheelDelta(e, scrollEl) {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * scrollEl.clientHeight;
  return e.deltaY;
}

function clampPull(value) {
  return Math.max(-MAX_PULL, Math.min(MAX_PULL, value));
}

function resistedDelta(delta, current) {
  const ratio = 1 - Math.min(1, Math.abs(current) / MAX_PULL) * 0.45;
  return delta * WHEEL_RESISTANCE * ratio;
}

function defaultZoneHit(e, zone) {
  if (!zone) return false;
  const rect = zone.getBoundingClientRect();
  const { clientX: x, clientY: y } = e;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function applyPull(scrollEl, content, springClass, value, pullRef) {
  const pull = clampPull(value);
  pullRef.current = pull;
  const abs = Math.abs(pull);
  const ratio = Math.min(1, abs / MAX_PULL);

  if (abs < 0.5) {
    content.classList.remove(PULLING_CLASS, springClass);
    content.style.transform = '';
    content.style.transformOrigin = '';
    return;
  }

  content.classList.remove(springClass);
  content.classList.add(PULLING_CLASS);

  const scale = 1 - ratio * 0.06;
  const origin = pull > 0 ? '50% 0%' : '50% 100%';
  content.style.transformOrigin = origin;
  content.style.transform = `translate3d(0, ${pull}px, 0) scale(${scale})`;
}

/**
 * Scroll con overscroll elastico (rubber band) + rotella dedicata alla zona.
 */
export function useElasticScroll({
  zoneRef,
  scrollRef,
  contentRef,
  springClass = 'elastic-spring',
  isInZone = defaultZoneHit,
}) {
  const pullRef = useRef(0);
  const wheelTimerRef = useRef(null);
  const pointerRef = useRef({ active: false, lastY: 0, captured: false });

  useEffect(() => {
    const zone = zoneRef.current;
    const scrollEl = scrollRef.current;
    const content = contentRef.current;
    if (!zone || !scrollEl || !content) return;

    const setPull = (value) => applyPull(scrollEl, content, springClass, value, pullRef);

    const onSpringEnd = (ev) => {
      if (ev.propertyName !== 'transform') return;
      content.classList.remove(springClass, PULLING_CLASS);
    };

    const springBack = () => {
      if (pointerRef.current.active) return;
      if (Math.abs(pullRef.current) < 0.5) {
        pullRef.current = 0;
        content.classList.remove(springClass, PULLING_CLASS);
        content.style.transform = '';
        return;
      }
      content.classList.remove(PULLING_CLASS);
      content.classList.add(springClass);
      requestAnimationFrame(() => {
        content.style.transform = '';
        content.style.transformOrigin = '';
        pullRef.current = 0;
      });
    };

    const scheduleSpringBack = () => {
      clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(springBack, WHEEL_RELEASE_MS);
    };

    const maxScroll = () => Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
    const atTop = () => scrollEl.scrollTop <= 0;
    const atBottom = () => scrollEl.scrollTop >= maxScroll() - 2;

    const onWheel = (e) => {
      if (!isInZone(e, zone)) return;

      const max = maxScroll();
      const delta = wheelDelta(e, scrollEl);

      e.preventDefault();
      e.stopPropagation();

      if (max < 1) {
        setPull(pullRef.current + resistedDelta(-delta, pullRef.current));
        scheduleSpringBack();
        return;
      }

      const next = scrollEl.scrollTop + delta;

      if (next < 0) {
        scrollEl.scrollTop = 0;
        if (delta < 0) setPull(pullRef.current + resistedDelta(-delta, pullRef.current));
        scheduleSpringBack();
        return;
      }

      if (next > max) {
        scrollEl.scrollTop = max;
        if (delta > 0) setPull(pullRef.current - resistedDelta(delta, pullRef.current));
        scheduleSpringBack();
        return;
      }

      scrollEl.scrollTop = next;
      if (pullRef.current !== 0) setPull(0);

      if (atTop() && delta < 0) {
        setPull(pullRef.current + resistedDelta(-delta, pullRef.current));
        scheduleSpringBack();
      } else if (atBottom() && delta > 0) {
        setPull(pullRef.current - resistedDelta(delta, pullRef.current));
        scheduleSpringBack();
      }
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (!scrollEl.contains(e.target)) return;
      pointerRef.current = { active: true, lastY: e.clientY, captured: false };
      clearTimeout(wheelTimerRef.current);
      content.classList.remove(springClass);
    };

    const onPointerMove = (e) => {
      if (!pointerRef.current.active) return;
      const dy = e.clientY - pointerRef.current.lastY;
      pointerRef.current.lastY = e.clientY;

      const max = maxScroll();
      const pull = pullRef.current;
      const elastic =
        pull !== 0 ||
        (atTop() && dy > 0) ||
        (atBottom() && dy < 0);

      if (elastic) {
        if (pull > 0 || (atTop() && dy > 0)) {
          scrollEl.scrollTop = 0;
          setPull(pull + dy * DRAG_RESISTANCE);
        } else if (pull < 0 || (atBottom() && dy < 0)) {
          scrollEl.scrollTop = max;
          setPull(pull + dy * DRAG_RESISTANCE);
        } else {
          const next = pull + dy * DRAG_RESISTANCE;
          if ((pull > 0 && next <= 0) || (pull < 0 && next >= 0)) setPull(0);
          else setPull(next);
        }
        if (!pointerRef.current.captured) {
          scrollEl.setPointerCapture(e.pointerId);
          pointerRef.current.captured = true;
        }
        e.preventDefault();
        return;
      }

      if (pointerRef.current.captured) {
        scrollEl.releasePointerCapture(e.pointerId);
        pointerRef.current.captured = false;
      }
      scrollEl.scrollTop = Math.min(max, Math.max(0, scrollEl.scrollTop - dy));
    };

    const endPointer = () => {
      if (!pointerRef.current.active) return;
      pointerRef.current = { active: false, lastY: 0, captured: false };
      springBack();
    };

    content.addEventListener('transitionend', onSpringEnd);
    document.addEventListener('wheel', onWheel, { passive: false, capture: true });
    scrollEl.addEventListener('pointerdown', onPointerDown);
    scrollEl.addEventListener('pointermove', onPointerMove);
    scrollEl.addEventListener('pointerup', endPointer);
    scrollEl.addEventListener('pointercancel', endPointer);
    scrollEl.addEventListener('lostpointercapture', endPointer);

    return () => {
      content.removeEventListener('transitionend', onSpringEnd);
      document.removeEventListener('wheel', onWheel, { capture: true });
      scrollEl.removeEventListener('pointerdown', onPointerDown);
      scrollEl.removeEventListener('pointermove', onPointerMove);
      scrollEl.removeEventListener('pointerup', endPointer);
      scrollEl.removeEventListener('pointercancel', endPointer);
      scrollEl.removeEventListener('lostpointercapture', endPointer);
      clearTimeout(wheelTimerRef.current);
    };
  }, [zoneRef, scrollRef, contentRef, springClass, isInZone]);
}
