import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageSlide, qtyPop } from '../utils/motion';
import {
  products,
  crossSellItems,
  crossSellSortMode,
  defaultMealDrinkImage,
  defaultMealFriesImage,
  getMealSizeAddon,
} from '../data';
import MealComposeWizard from '../components/MealComposeWizard';
import {
  initExtrasForProduct,
  extraDisplayName,
  resolveUnitExtras,
} from '../utils/productExtras';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';
import { useCrossSellAutoScroll } from '../hooks/useCrossSellAutoScroll';
import { buildCrossSellLoop, CROSS_SELL_SORT_MODES } from '../utils/crossSell';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import { calcLineTotal, formatPriceButton } from '../utils/price';
import { calcMealFriesSurcharge } from '../utils/mealFries';
import { getPersonalisableUnits, extrasMatchDefaults } from '../utils/personalise';
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

function extrasFromPending(product, pendingExtras) {
  const base = initExtrasForProduct(product);
  if (!pendingExtras?.length) return base;
  return base.map((ex) => {
    const saved = pendingExtras.find((e) => e.id === ex.id);
    return saved ? { ...ex, count: saved.count } : ex;
  });
}

function buildCartLine(product, { quantity, extras, mealUpgrade, menuCombo, language, crossSellKey }) {
  const includesCombo = product.type === 'meal' || Boolean(mealUpgrade) || Boolean(menuCombo);
  return {
    productId: product.id,
    name: product.name,
    image: product.image,
    unitPrice: product.price,
    quantity,
    productType: product.type,
    includesCombo,
    extras: extras
      .filter((ex) => ex.count > 0)
      .map((ex) => ({
        id: ex.id,
        name: extraDisplayName(ex, language, t),
        price: ex.price,
        count: ex.count,
      })),
    mealUpgrade,
    menuCombo: menuCombo ?? null,
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
  const [mealCompose, setMealCompose] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeVariant, setComposeVariant] = useState('meal');
  const [personalizeUnitId, setPersonalizeUnitId] = useState(null);
  const [draftExtras, setDraftExtras] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const crossSellRef = useRef(null);
  const crossSellSectionRef = useRef(null);
  const [crossSellMounted, setCrossSellMounted] = useState(false);
  const setCrossSellRef = useCallback((node) => {
    crossSellRef.current = node;
    setCrossSellMounted(!!node);
  }, []);

  const showCrossSellSection =
    !composeOpen && (!product || product.type !== 'meal' || Boolean(mealCompose));

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
    enabled: crossSellMounted && Boolean(product) && !crossSellModal && !personalizeUnitId,
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
      setMealCompose(null);
      setPersonalizeUnitId(null);
      setDraftExtras([]);
      if (found.type === 'meal') {
        setComposeVariant('meal');
        setComposeOpen(true);
      } else {
        setComposeOpen(false);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const needsSandwichExtras =
      product.type === 'meal' ? Boolean(mealCompose) : getPersonalisableUnits(product, [], products).length > 0;
    if (!needsSandwichExtras || extras.length > 0) return;
    const initial = initExtrasForProduct(product);
    if (initial.length) setExtras(initial);
  }, [product, mealCompose, extras.length]);

  const personalisableUnits = useMemo(
    () => (product ? getPersonalisableUnits(product, pendingCrossSells, products) : []),
    [product, pendingCrossSells, mealCompose]
  );

  if (!product) return null;

  const activePersonalizeUnit = personalisableUnits.find((u) => u.id === personalizeUnitId);

  const isUnitModified = (unit) => {
    const profileProduct = unit.id === 'main' ? product : unit.product;
    const line = pendingCrossSells.find((l) => l.crossSellKey === unit.id);
    const current = resolveUnitExtras(unit.id, {
      product,
      unit,
      extras,
      pendingLine: line,
    });
    return !extrasMatchDefaults(current, profileProduct, products);
  };

  const openPersonalize = (unitId) => {
    const unit = personalisableUnits.find((u) => u.id === unitId);
    if (!unit) return;
    const line = pendingCrossSells.find((l) => l.crossSellKey === unitId);
    const resolved = resolveUnitExtras(unitId, {
      product,
      unit,
      extras,
      pendingLine: line,
    });
    setDraftExtras(resolved);
    if (unitId === 'main' && extras.length === 0 && resolved.length) {
      setExtras(resolved.map((ex) => ({ ...ex })));
    }
    setPersonalizeUnitId(unitId);
  };

  const closePersonalize = () => {
    setPersonalizeUnitId(null);
    setDraftExtras([]);
  };

  const savePersonalization = () => {
    if (!personalizeUnitId) return;
    if (personalizeUnitId === 'main') {
      setExtras(draftExtras.map((ex) => ({ ...ex })));
    } else {
      const line = pendingCrossSells.find((l) => l.crossSellKey === personalizeUnitId);
      const linked = products.find((p) => p.id === line?.productId);
      if (line && linked) {
        const updated = buildCartLine(linked, {
          quantity: line.quantity,
          extras: draftExtras,
          mealUpgrade: line.mealUpgrade ?? null,
          language,
          crossSellKey: line.crossSellKey,
        });
        setPendingCrossSells((prev) =>
          prev.map((p) => (p.crossSellKey === personalizeUnitId ? updated : p))
        );
      }
    }
    closePersonalize();
  };

  const handleDraftExtraChange = (extraId, change) => {
    setDraftExtras((prev) =>
      prev.map((ex) => {
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

  const getMealUpgradeFromCompose = () => {
    if (!mealCompose?.sizeOption) return null;
    return {
      name: mealCompose.sizeOption.name,
      price: getMealSizeAddon(product, mealCompose.sizeOption),
    };
  };

  const buildMainCartItem = (mealUpgrade = null) => {
    const upgrade = mealUpgrade ?? getMealUpgradeFromCompose();
    const friesSurcharge =
      mealCompose?.fries && mealCompose?.sizeOption
        ? calcMealFriesSurcharge(mealCompose.sizeOption, mealCompose.fries)
        : 0;
    const combo =
      mealCompose?.drink != null
        ? {
            sizeId: mealCompose.sizeOption?.id,
            drink: mealCompose.drink,
            fries: mealCompose.fries,
            friesSurcharge,
          }
        : null;
    return buildCartLine(product, {
      quantity,
      extras,
      mealUpgrade: upgrade,
      menuCombo: combo,
      language,
    });
  };

  const commitAddToCart = (mealUpgrade = null) => {
    addToCart(buildMainCartItem(mealUpgrade));
    pendingCrossSells.forEach((line) => {
      const { crossSellKey: _key, ...cartItem } = line;
      addToCart(cartItem);
    });
    setPendingCrossSells([]);
    setCrossSellModal(null);
    setComposeOpen(false);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate('/menu');
    }, 2000);
  };

  const handleComposeComplete = (selection) => {
    setMealCompose(selection);
    setComposeOpen(false);
    setExtras(initExtrasForProduct(product));

    const extraLines = (selection.selectedExtras ?? [])
      .map((item) => {
        const catalogProduct = products.find((p) => p.id === item.productId);
        if (!catalogProduct) return null;
        return buildCartLine(catalogProduct, {
          quantity: 1,
          extras: initExtrasForProduct(catalogProduct),
          mealUpgrade: null,
          language,
          crossSellKey: `compose-extra-${catalogProduct.id}`,
        });
      })
      .filter(Boolean);

    setPendingCrossSells(extraLines);
  };

  const handleComposeSolo = () => {
    setMealCompose(null);
    setComposeOpen(false);
    commitAddToCart(null);
  };

  const handleComposeCancel = () => {
    setMealCompose(null);
    setPendingCrossSells([]);
    setComposeOpen(false);
    navigate('/menu');
  };

  const handleAddToCart = () => {
    if (product.type === 'meal' || product.type === 'burger' || product.type === 'wrap') {
      if (!mealCompose) {
        setComposeVariant(product.type === 'meal' ? 'meal' : 'burger');
        setComposeOpen(true);
        return;
      }
    }
    commitAddToCart(null);
  };

  const showProductBody = product.type !== 'meal' || Boolean(mealCompose);

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
    mealUpgrade: getMealUpgradeFromCompose(),
    menuCombo: mealCompose?.fries
      ? {
          friesSurcharge: calcMealFriesSurcharge(
            mealCompose.sizeOption,
            mealCompose.fries
          ),
        }
      : null,
  });

  const pendingTotal = pendingCrossSells.reduce((sum, line) => sum + calcLineTotal(line), 0);

  const linePreview = mainLinePreview + pendingTotal;
  const cartPriceParts = formatPriceButton(linePreview);
  const isPersonalizeOpen = Boolean(personalizeUnitId);

  const editorExtras =
    isPersonalizeOpen && activePersonalizeUnit
      ? draftExtras.length > 0
        ? draftExtras
        : resolveUnitExtras(personalizeUnitId, {
            product,
            unit: activePersonalizeUnit,
            extras,
            pendingLine: pendingCrossSells.find((l) => l.crossSellKey === personalizeUnitId),
          })
      : [];

  const crossSellModalPreview = crossSellModal
    ? calcLineTotal({
        unitPrice: crossSellModal.product.price,
        quantity: crossSellModal.quantity,
        extras: crossSellModal.extras,
        mealUpgrade: crossSellModal.mealUpgrade,
      })
    : 0;
  const crossSellPriceParts = formatPriceButton(crossSellModalPreview);

  const isEditingPendingCrossSell =
    crossSellModal &&
    pendingCrossSells.some((line) => line.crossSellKey === crossSellModal.crossSellKey);

  return (
    <motion.div className="product-screen" {...pageSlide}>
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

      {mealCompose && (
        <div className="meal-compose-summary" role="status">
          <span className="meal-compose-summary-size">{mealCompose.sizeOption?.name}</span>
          <span className="meal-compose-summary-fries">{mealCompose.fries?.name}</span>
          <span className="meal-compose-summary-drink">{mealCompose.drink?.name}</span>
          {mealCompose.selectedExtras?.length > 0 && (
            <span className="meal-compose-summary-extras">
              +{mealCompose.selectedExtras.length} {t(language, 'mealComposeExtrasCount')}
            </span>
          )}
        </div>
      )}

      {showProductBody && !isPersonalizeOpen && (
      <div className="product-scroll-content no-scrollbar">
        {personalisableUnits.length > 0 && (
          <div className="section">
            <h3 className="section-title">{t(language, 'personalise')}</h3>
            <div className="personalise-units no-scrollbar">
              {personalisableUnits.map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  className="personalise-unit-card"
                  onClick={() => openPersonalize(unit.id)}
                >
                  <div className="personalise-unit-img-wrap">
                    <img src={unit.image} alt="" className="personalise-unit-img" />
                  </div>
                  <span className="personalise-unit-name">{unit.name}</span>
                  <span className="personalise-unit-hint">{t(language, 'personaliseTapHint')}</span>
                  {isUnitModified(unit) && (
                    <span className="personalise-unit-badge">{t(language, 'personaliseModified')}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {showCrossSellSection && (
        <div className="section cross-sell-section" ref={crossSellSectionRef}>
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
        )}

        <div className="product-scroll-spacer" aria-hidden />
      </div>
      )}

      {showProductBody && isPersonalizeOpen && activePersonalizeUnit && (
      <div className="product-scroll-content no-scrollbar product-personalize-editor">
        <button
          type="button"
          className="personalise-editor-back"
          onClick={closePersonalize}
        >
          <ChevronLeft size={18} strokeWidth={2.5} aria-hidden />
          {t(language, 'mealComposeBack')}
        </button>

        <div className="personalise-editor-header">
          <img
            src={activePersonalizeUnit.image}
            alt=""
            className="personalise-editor-img"
          />
          <h3 className="personalise-editor-title">{activePersonalizeUnit.name}</h3>
        </div>

        <div className="section personalise-editor-section">
          <h3 className="section-title">{t(language, 'personaliseIngredients')}</h3>
          <div className="extras-list">
            {editorExtras.map((extra) => (
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
                      onClick={() => handleDraftExtraChange(extra.id, -1)}
                      disabled={extra.count === 0}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="count-val">{extra.count}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => handleDraftExtraChange(extra.id, 1)}
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

        <div className="product-scroll-spacer" aria-hidden />
      </div>
      )}

      {showProductBody && !isPersonalizeOpen && (
      <div className="bottom-bar product-bottom-bar">
        <button type="button" className="product-back-btn" onClick={() => navigate('/menu')}>
          <span className="product-back-btn-icon" aria-hidden>
            <ChevronLeft size={22} strokeWidth={2.5} />
          </span>
          <span className="product-back-btn-label">{t(language, 'menu')}</span>
        </button>

        <div className="product-bottom-cta">
          <div className="qty-selector product-qty">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label={t(language, 'crossSellQty')}
            >
              <Minus size={20} />
            </button>
            <motion.span key={quantity} className="qty-val" {...qtyPop}>
              {quantity}
            </motion.span>
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQuantity(quantity + 1)}
              aria-label={t(language, 'crossSellQty')}
            >
              <Plus size={20} />
            </button>
          </div>
          <button type="button" className="btn-primary add-cart-btn" onClick={handleAddToCart}>
            <span className="add-cart-btn-text">
              {t(language, 'addToCart')}{' '}
              <span className="add-cart-btn-price" aria-label={`${linePreview.toFixed(2)} €`}>
                {cartPriceParts.whole}
                <span className="add-cart-btn-dec">.{cartPriceParts.cents}</span>
                <span className="add-cart-btn-cur"> €</span>
              </span>
            </span>
          </button>
        </div>
      </div>
      )}

      {showProductBody && isPersonalizeOpen && (
      <div className="bottom-bar product-bottom-bar product-bottom-bar--save">
        <button type="button" className="btn-primary full-width personalise-save-btn" onClick={savePersonalization}>
          {t(language, 'personaliseSave')}
        </button>
      </div>
      )}

      <MealComposeWizard
        open={composeOpen}
        product={product}
        variant={composeVariant}
        language={language}
        onComplete={handleComposeComplete}
        onSolo={handleComposeSolo}
        onCancel={handleComposeCancel}
      />

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
                  {t(language, 'crossSellConfirm')}{' '}
                  <span className="add-cart-btn-price">
                    <span className="add-cart-btn-whole">{crossSellPriceParts.whole}</span>
                    <span className="add-cart-btn-dec">.{crossSellPriceParts.cents}</span>
                    <span className="add-cart-btn-cur"> €</span>
                  </span>
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
