import { useCallback } from 'react';
import { useElasticScroll } from './useElasticScroll';

/** Rotella / trascinamento sulla griglia prodotti (sotto l’header). */
export function useProductsGridScroll(mainContentRef, scrollRef, contentRef) {
  const isInZone = useCallback((e, mainContent) => {
    if (!mainContent) return false;
    const rect = mainContent.getBoundingClientRect();
    const header = mainContent.querySelector('.top-header');
    const top = header ? header.getBoundingClientRect().bottom : rect.top;
    const { clientX: x, clientY: y } = e;
    return x >= rect.left && x <= rect.right && y >= top && y <= rect.bottom;
  }, []);

  useElasticScroll({
    zoneRef: mainContentRef,
    scrollRef,
    contentRef,
    springClass: 'products-grid-inner--spring',
    isInZone,
  });
}
