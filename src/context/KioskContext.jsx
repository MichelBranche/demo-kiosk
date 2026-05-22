import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { calcCartSubtotal, roundPrice } from '../utils/price';

const KioskContext = createContext(null);

const PROMO_CODES = {
  MCD10: { type: 'percent', value: 10 },
  MAC5: { type: 'fixed', value: 5 },
};

export function KioskProvider({ children }) {
  const [orderType, setOrderType] = useState(null);
  const [language, setLanguage] = useState('it');
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState(null);
  const [lastOrderNumber, setLastOrderNumber] = useState(null);
  const [lastOrderSnapshot, setLastOrderSnapshot] = useState(null);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(() => calcCartSubtotal(cartItems), [cartItems]);

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percent') {
      return roundPrice(subtotal * (appliedPromo.value / 100));
    }
    return Math.min(appliedPromo.value, subtotal);
  }, [appliedPromo, subtotal]);

  const total = useMemo(() => roundPrice(Math.max(0, subtotal - discount)), [subtotal, discount]);

  const addToCart = useCallback((item) => {
    const line = {
      lineId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      ...item,
    };
    setCartItems((prev) => [...prev, line]);
    return line;
  }, []);

  const updateCartItem = useCallback((lineId, updates) => {
    setCartItems((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, ...updates } : item))
    );
  }, []);

  const removeFromCart = useCallback((lineId) => {
    setCartItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const applyPromo = useCallback((code) => {
    const normalized = code.trim().toUpperCase();
    setPromoCode(normalized);
    const promo = PROMO_CODES[normalized];
    if (promo) {
      setAppliedPromo(promo);
      setPromoMessage('applied');
      return true;
    }
    setAppliedPromo(null);
    setPromoMessage('invalid');
    return false;
  }, []);

  const clearPromo = useCallback(() => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoMessage(null);
  }, []);

  const resetSession = useCallback(() => {
    setCartItems([]);
    setOrderType(null);
    setPromoCode('');
    setAppliedPromo(null);
    setPromoMessage(null);
    setLastOrderNumber(null);
    setLastOrderSnapshot(null);
  }, []);

  const completeOrder = useCallback(() => {
    const number = String(Math.floor(1000 + Math.random() * 9000));
    const snapshot = {
      number,
      items: cartItems.map((item) => ({ ...item })),
      orderType,
      total,
    };
    setLastOrderNumber(number);
    setLastOrderSnapshot(snapshot);
    setCartItems([]);
    setPromoCode('');
    setAppliedPromo(null);
    setPromoMessage(null);
    return snapshot;
  }, [cartItems, orderType, total]);

  const value = useMemo(
    () => ({
      orderType,
      setOrderType,
      language,
      setLanguage,
      cartItems,
      itemCount,
      subtotal,
      discount,
      total,
      promoCode,
      appliedPromo,
      promoMessage,
      lastOrderNumber,
      lastOrderSnapshot,
      addToCart,
      updateCartItem,
      removeFromCart,
      applyPromo,
      clearPromo,
      resetSession,
      completeOrder,
    }),
    [
      orderType,
      language,
      cartItems,
      itemCount,
      subtotal,
      discount,
      total,
      promoCode,
      appliedPromo,
      promoMessage,
      lastOrderNumber,
      lastOrderSnapshot,
      addToCart,
      updateCartItem,
      removeFromCart,
      applyPromo,
      clearPromo,
      resetSession,
      completeOrder,
    ]
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) throw new Error('useKiosk must be used within KioskProvider');
  return ctx;
}
