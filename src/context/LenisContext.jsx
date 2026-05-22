import React, { createContext, useContext } from 'react';

const LenisContext = createContext({ reducedMotion: false });

export function LenisProvider({ children }) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <LenisContext.Provider value={{ reducedMotion }}>{children}</LenisContext.Provider>
  );
}

export function useLenisContext() {
  return useContext(LenisContext);
}
