import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  products,
  crossSellItems,
  crossSellSortMode,
  mealUpgradeOptions,
  defaultMealDrinkImage,
  defaultMealFriesImage,
} from '../data';
import { initExtrasForProduct, extraDisplayName } from '../utils/productExtras';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';
import { useCrossSellAutoScroll } from '../hooks/useCrossSellAutoScroll';
import { buildCrossSellLoop, CROSS_SELL_SORT_MODES } from '../utils/crossSell';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import { calcLineTotal } from '../utils/price';
import Price from '../components/Price';
import ExtraIcon from '../components/ExtraIcon';
import { ChevronLeft, Plus, Minus, Check, X } from 'lucide-react';
import './ProductScreen.css';

function resolveCrossSellProduct(item) {
  if (item.productId) {
    const linked = products.find((p) => p.id === item.productId);
    if (linked) return linked;
  }
  return {
    id: item.productId ?? item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    type: 'side',
  };
}

function productHasPersonalisation(p) {
  return (
    p.type === 'burger' ||
    p.type === 'meal' ||
    p.type === 'salad' ||
    p.type === 'happyMeal' ||
    (p.type === 'side' && p.extrasKey)
  );
}

function extrasFromPending(product, pendingExtras) {
  const base = initExtrasForProduct(product);
  if (!pendingExtras?.length) return base;
  return base.map((ex) => {
    const saved = pendingExtras.find((e) => e.id === ex.id);
    return saved ? { ...ex, count: saved.count } : ex;
  });
}

function buildCartLine(product, { quantity, extras, mealUpgrade, language, crossSellKey }) {
  return {
    productId: product.id,
    name: product.name,
    image: product.image,
    unitPrice: product.price,
    quantity,
    extras: extras.map((ex) => ({
      id: ex.id,
      name: extraDisplayName(ex, language, t),
      price: ex.price,
      count: ex.count,
    })),
    mealUpgrade,
    crossSellKey: crossSellKey ?? null,
  };
}

const ProductScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, addToCart, total, itemCount } = useKiosk();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [extras, setExtras] = useState([]);
  const [pendingCrossSells, setPendingCrossSells] = useState([]);
  const [crossSellModal, setCrossSellModal] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const crossSellRef = useRef(null);
  const [crossSellMounted, setCrossSellMounted] = useState(false);
  const setCrossSellRef = useCallback((node) => {
    crossSellRef.current = node;
    setCrossSellMounted(!!node);
  }, []);

  const crossSellLoop = useMemo(
    () =>
      buildCrossSellLoop(crossSellItems, {
        mode: crossSellSortMode ?? CROSS_SELL_SORT_MODES.RANDOM,
      }),
    [id]
  );

  useHorizontalDragScroll(crossSellRef, { pauseOnHover: false }, crossSellMounted && Boolean(product));
  useCrossSellAutoScroll(crossSellRef, {
    speed: 0.18,
    enabled: crossSellMounted && Boolean(product) && !crossSellModal,
    itemCount: crossSellLoop.length,
  });

  useEffect(() => {
    const found = products.find((p) => p.id === parseInt(id, 10));
    if (found) {
      setProduct(found);
      setExtras(initExtrasForProduct(found));
      setQuantity(1);
      setPendingCrossSells([]);
      setCrossSellModal(null);
    }
  }, [id]);

  if (!product) return null;

  const handleExtraChange = (extraId, change) => {
    setExtras(
      extras.map((ex) => {
        if (ex.id === extraId) {
          const newCount = ex.count + change;
          if (newCount >= 0 && newCount <= ex.maxCount) {
            return { ...ex, count: newCount };
          }
        }
        return ex;
      })
    );
  };

  const buildMainCartItem = (mealUpgrade = null) =>
    buildCartLine(product, { quantity, extras, mealUpgrade, language });

  const commitAddToCart = (mealUpgrade = null) => {
    addToCart(buildMainCartItem(mealUpgrade));
    pendingCrossSells.forEach((line) => {
      const { crossSellKey: _key, ...cartItem } = line;
      addToCart(cartItem);
    });
    setPendingCrossSells([]);
    setCrossSellModal(null);
    setShowMealModal(false);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate('/menu');
    }, 2000);
  };

  const handleAddToCart = () => {
    if (product.type === 'burger' || product.type === 'meal' || product.type === 'wrap') {
      setShowMealModal(true);
    } else {
      commitAddToCart(null);
    }
  };

  const handleSelectMealOption = (option) => {
    commitAddToCart({
      name: option.name,
      price: option.price,
    });
  };

  const getCrossSellKey = (item) => item.loopKey ?? String(item.id);

  const isCrossSellPending = (item) =>
    pendingCrossSells.some((line) => line.crossSellKey === getCrossSellKey(item));

  const openCrossSellModal = (item) => {
    const key = getCrossSellKey(item);
    const resolved = resolveCrossSellProduct(item);
    const existing = pendingCrossSells.find((line) => line.crossSellKey === key);
    setCrossSellModal({
      crossSellKey: key,
      product: resolved,
      extras: extrasFromPending(resolved, existing?.extras),
      quantity: existing?.quantity ?? 1,
      mealUpgrade: existing?.mealUpgrade ?? null,
    });
  };

  const closeCrossSellModal = () => setCrossSellModal(null);

  const handleCrossSellExtraChange = (extraId, change) => {
    if (!crossSellModal) return;
    setCrossSellModal({
      ...crossSellModal,
      extras: crossSellModal.extras.map((ex) => {
        if (ex.id === extraId) {
          const newCount = ex.count + change;
          if (newCount >= 0 && newCount <= ex.maxCount) {
            return { ...ex, count: newCount };
          }
        }
        return ex;
      }),
    });
  };

  const confirmCrossSellModal = () => {
    if (!crossSellModal) return;
    const line = buildCartLine(crossSellModal.product, {
      quantity: crossSellModal.quantity,
      extras: crossSellModal.extras,
      mealUpgrade: crossSellModal.mealUpgrade,
      language,
      crossSellKey: crossSellModal.crossSellKey,
    });
    setPendingCrossSells((prev) => {
      const idx = prev.findIndex((p) => p.crossSellKey === line.crossSellKey);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = line;
        return next;
      }
      return [...prev, line];
    });
    closeCrossSellModal();
  };

  const removePendingCrossSell = () => {
    if (!crossSellModal) return;
    setPendingCrossSells((prev) =>
      prev.filter((line) => line.crossSellKey !== crossSellModal.crossSellKey)
    );
    closeCrossSellModal();
  };

  const mainLinePreview = calcLineTotal({
    unitPrice: product.price,
    quantity,
    extras,
  });

  const pendingTotal = pendingCrossSells.reduce((sum, line) => sum + calcLineTotal(line), 0);

  const linePreview = mainLinePreview + pendingTotal;

  const crossSellModalPreview = crossSellModal
    ? calcLineTotal({
        unitPrice: crossSellModal.product.price,
        quantity: crossSellModal.quantity,
        extras: crossSellModal.extras,
        mealUpgrade: crossSellModal.mealUpgrade,
      })
    : 0;

  const isEditingPendingCrossSell =
    crossSellModal &&
    pendingCrossSells.some((line) => line.crossSellKey === crossSellModal.crossSellKey);

  return (
    <motion.div
      className="product-screen"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="product-header">
        <div className="product-header-img-wrapper">
          <img src={product.image} alt={product.name} className="product-header-img" />
        </div>
        <div className="product-header-info">
          <h2 className="product-title">{product.name}</h2>
          <Price value={product.price} light />
        </div>
        {product.description && <p className="product-desc">{product.description}</p>}
      </div>

      <div className="product-scroll-content no-scrollbar">
        {productHasPersonalisation(product) && (
          <div className="section">
            <h3 className="section-title">{t(language, 'personalise')}</h3>
            <div className="extras-list">
              {extras.map((extra) => (
                <div key={extra.id} className="extra-item">
                  <div className="extra-left">
                    <ExtraIcon
                      image={extra.image}
                      alt={extraDisplayName(extra, language, t)}
                    />
                    <span className="extra-name">{extraDisplayName(extra, language, t)}</span>
                  </div>
                  <div className="extra-right">
                    <div className="counter">
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => handleExtraChange(extra.id, -1)}
                        disabled={extra.count === 0}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="count-val">{extra.count}</span>
                      <button
                        type="button"
                        className="counter-btn"
                        onClick={() => handleExtraChange(extra.id, 1)}
                        disabled={extra.count === extra.maxCount}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {extra.price > 0 && (
                      <span className="extra-price">+{extra.price.toFixed(2)} €</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="show-more-btn">
              {t(language, 'showMore')}
            </button>
          </div>
        )}

        <div className="section cross-sell-section">
          <h3 className="section-title">{t(language, 'somethingExtra')}</h3>
          <div className="cross-sell-carousel no-scrollbar" ref={setCrossSellRef} data-lenis-prevent>
            {crossSellLoop.map((item) => {
              const pending = isCrossSellPending(item);
              return (
                <button
                  type="button"
                  key={item.loopKey}
                  className={`cross-sell-card${pending ? ' is-selected' : ''}`}
                  onClick={() => openCrossSellModal(item)}
                >
                  {item.isBestseller && <div className="badge-bestseller">bestseller</div>}
                  {pending && (
                    <div className="cross-sell-selected-badge" aria-hidden>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                  <div className="cross-sell-img-wrapper">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cross-sell-info">
                    <span className="cs-name">{item.name}</span>
                    <Price value={item.price} className="cs-price" />
                  </div>
                  {pending && (
                    <span className="cross-sell-added-label">{t(language, 'crossSellSelected')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: '100px' }} />
      </div>

      <div className="bottom-bar product-bottom-bar">
        <button type="button" className="product-back-btn" onClick={() => navigate('/menu')}>
          <span className="product-back-btn-icon" aria-hidden>
            <ChevronLeft size={22} strokeWidth={2.5} />
          </span>
          <span className="product-back-btn-label">{t(language, 'menu')}</span>
        </button>

        <div className="main-actions">
          <div className="qty-selector">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={20} />
            </button>
            <span className="qty-val">{quantity}</span>
            <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
              <Plus size={20} />
            </button>
          </div>
          <button type="button" className="btn-primary add-cart-btn" onClick={handleAddToCart}>
            {t(language, 'addToCart')} {Math.floor(linePreview)}
            <span className="small-price">
              .{String(Math.round((linePreview % 1) * 100)).padStart(2, '0')}
            </span>{' '}
            €
          </button>
        </div>
      </div>

      <AnimatePresence>
        {crossSellModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCrossSellModal}
          >
            <motion.div
              className="modal-content cross-sell-modal"
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="cross-sell-modal-close"
                onClick={closeCrossSellModal}
                aria-label={t(language, 'crossSellCancel')}
              >
                <X size={22} />
              </button>

              <div className="cross-sell-modal-header">
                <img
                  src={crossSellModal.product.image}
                  alt=""
                  className="cross-sell-modal-img"
                />
                <div>
                  <h2 className="cross-sell-modal-title">{crossSellModal.product.name}</h2>
                  <Price value={crossSellModal.product.price} />
                </div>
              </div>

              {productHasPersonalisation(crossSellModal.product) && (
                <div className="cross-sell-modal-section">
                  <h3 className="section-title">{t(language, 'personalise')}</h3>
                  <div className="extras-list">
                    {crossSellModal.extras.map((extra) => (
                      <div key={extra.id} className="extra-item">
                        <div className="extra-left">
                          <ExtraIcon
                            image={extra.image}
                            alt={extraDisplayName(extra, language, t)}
                          />
                          <span className="extra-name">
                            {extraDisplayName(extra, language, t)}
                          </span>
                        </div>
                        <div className="extra-right">
                          <div className="counter">
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => handleCrossSellExtraChange(extra.id, -1)}
                              disabled={extra.count === 0}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="count-val">{extra.count}</span>
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => handleCrossSellExtraChange(extra.id, 1)}
                              disabled={extra.count === extra.maxCount}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {extra.price > 0 && (
                            <span className="extra-price">+{extra.price.toFixed(2)} €</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="cross-sell-modal-qty">
                <span className="cross-sell-modal-qty-label">{t(language, 'crossSellQty')}</span>
                <div className="qty-selector">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      setCrossSellModal({
                        ...crossSellModal,
                        quantity: Math.max(1, crossSellModal.quantity - 1),
                      })
                    }
                  >
                    <Minus size={20} />
                  </button>
                  <span className="qty-val">{crossSellModal.quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() =>
                      setCrossSellModal({
                        ...crossSellModal,
                        quantity: crossSellModal.quantity + 1,
                      })
                    }
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="cross-sell-modal-actions">
                {isEditingPendingCrossSell && (
                  <button
                    type="button"
                    className="btn-secondary cross-sell-remove-btn"
                    onClick={removePendingCrossSell}
                  >
                    {t(language, 'crossSellRemove')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary full-width cross-sell-confirm-btn"
                  onClick={confirmCrossSellModal}
                >
                  {t(language, 'crossSellConfirm')} {Math.floor(crossSellModalPreview)}
                  <span className="small-price">
                    .{String(Math.round((crossSellModalPreview % 1) * 100)).padStart(2, '0')}
                  </span>{' '}
                  €
                </button>
                <button
                  type="button"
                  className="btn-secondary full-width"
                  onClick={closeCrossSellModal}
                >
                  {t(language, 'crossSellCancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showMealModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content meal-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="modal-title">{t(language, 'mealModalTitle')}</h2>

              <div className="meal-options">
                {mealUpgradeOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className="meal-card"
                    onClick={() => handleSelectMealOption(option)}
                  >
                    {option.isBestseller && <div className="badge-bestseller">bestseller</div>}
                    <div className="meal-img-container">
                      <div className="calories-badge">{option.calories}</div>
                      <img src={product.image} alt={option.name} className="meal-base" />
                      {option.showCombo && (
                        <>
                          <img
                            src={defaultMealFriesImage}
                            alt=""
                            className="meal-extra fries-extra"
                          />
                          <img
                            src={defaultMealDrinkImage}
                            alt=""
                            className="meal-extra soda-extra"
                          />
                        </>
                      )}
                    </div>
                    <div className="meal-info">
                      <span className="meal-name">{option.name}</span>
                      <div className="product-price">
                        <span className="price-value">+{option.price}</span>
                        <span className="price-currency">€</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button type="button" className="btn-secondary full-width" onClick={() => commitAddToCart()}>
                {t(language, 'notToday')}
              </button>
            </motion.div>
          </motion.div>
        )}

        {showSuccessModal && (
          <motion.div
            className="modal-overlay success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content success-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="success-images">
                <img src={product.image} alt="" className="succ-product" />
                <img src={defaultMealFriesImage} alt="" className="succ-fries" />
                <img src={defaultMealDrinkImage} alt="" className="succ-soda" />
              </div>
              <div className="success-icon-wrapper">
                <Check size={32} color="#FFF" />
              </div>
              <h2 className="success-title">{t(language, 'productAdded')}</h2>
              <p className="success-price">
                {t(language, 'currentOrderPrice')}
                <br />
                <span className="price-val">
                  {Math.floor(total)}
                  <span className="cents">
                    {String(Math.round((total % 1) * 100)).padStart(2, '0')}
                  </span>{' '}
                  €
                </span>
                {itemCount > 0 && (
                  <span className="success-items">
                    {' '}
                    ({itemCount} {t(language, 'items')})
                  </span>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductScreen;
