/** Shared framer-motion presets — subtle, fast, kiosk-friendly */

export const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

export const pageSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
};

export const pageReveal = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
};

export const qtyPop = {
  initial: { opacity: 0.55, y: -3 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.12, ease: 'easeOut' },
};

export const badgePop = {
  initial: { scale: 0.88 },
  animate: { scale: 1 },
  transition: { duration: 0.14, ease: [0.2, 0, 0, 1] },
};
