import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  menuCategories,
  getCategoryPills,
  products,
  mcCafeSubcategories,
  getMcCafeSubcategoryLabel,
  filterMcCafeBySubcategory,
  countMcCafeBySubcategory,
  getMcCafeSubcategoryCoverImage,
} from '../data';
import { filterProducts, getPillLabel } from '../utils/filters';
import { buildBentoLayout, getProductCardVariant } from '../utils/menuLayout';
import { useKiosk } from '../context/KioskContext';
import { categoryNames, t } from '../i18n';
import { formatPriceButton } from '../utils/price';
import Price from '../components/Price';
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import DockCartIcon from '../components/DockCartIcon';
import McLogo from '../components/McLogo';
import CategoryIcon from '../components/CategoryIcon';
import MenuProductImage from '../components/MenuProductImage';
import './MenuScreen.css';

const MenuScreen = () => {
  const navigate = useNavigate();
  const { language, itemCount, total, orderType } = useKiosk();
  const [activeCategory, setActiveCategory] = useState('meals');

  useEffect(() => {
    if (!orderType) navigate('/start', { replace: true });
  }, [orderType, navigate]);
  const [activePill, setActivePill] = useState('All');
  const [activeMcCafeSub, setActiveMcCafeSub] = useState(null);
  const categoryPills = useMemo(() => getCategoryPills(activeCategory), [activeCategory]);
  const isMcCafe = activeCategory === 'mcCafe';
  const showMcCafeSubgrid = isMcCafe && !activeMcCafeSub;

  useEffect(() => {
    setActivePill('All');
    setActiveMcCafeSub(null);
  }, [activeCategory]);

  const pillsRef = useRef(null);
  const sidebarCategoriesRef = useRef(null);

  useHorizontalDragScroll(pillsRef);

  const filteredProducts = useMemo(() => {
    if (isMcCafe && activeMcCafeSub) {
      return filterMcCafeBySubcategory(products, activeMcCafeSub);
    }
    if (showMcCafeSubgrid) return [];
    return filterProducts(products, activeCategory, activePill);
  }, [activeCategory, activePill, activeMcCafeSub, isMcCafe, showMcCafeSubgrid]);

  const bentoLayout = useMemo(() => buildBentoLayout(filteredProducts), [filteredProducts]);

  const gridProducts = bentoLayout.order;

  const scrollSidebarDown = useCallback(() => {
    const el = sidebarCategoriesRef.current;
    if (!el) return;
    el.scrollBy({ top: 88, behavior: 'smooth' });
  }, []);

  const categoryTitle = activeMcCafeSub
    ? getMcCafeSubcategoryLabel(activeMcCafeSub, language, t)
    : categoryNames[language]?.[activeCategory] ??
      menuCategories.find((c) => c.id === activeCategory)?.name;
  const payParts = formatPriceButton(total);

  return (
    <motion.div
      className="menu-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="menu-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <McLogo compact />
          </div>
          <nav
            className="sidebar-categories"
            ref={sidebarCategoriesRef}
            aria-label={t(language, 'menu')}
          >
            {menuCategories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <CategoryIcon
                  iconSrc={cat.iconSrc}
                  icon={cat.icon}
                  active={activeCategory === cat.id}
                />
                <span className="category-name">
                  {categoryNames[language]?.[cat.id] ?? cat.name}
                </span>
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="sidebar-scroll-btn"
            aria-label={t(language, 'browseMenu')}
            onClick={scrollSidebarDown}
          >
            <ChevronDown size={20} strokeWidth={2.5} />
          </button>
        </aside>

        <section className="menu-panel">
          <header className="top-header">
            {activeMcCafeSub ? (
              <button
                type="button"
                className="mc-cafe-back"
                onClick={() => setActiveMcCafeSub(null)}
              >
                <ChevronLeft size={20} strokeWidth={2.5} aria-hidden />
                {t(language, 'mcCafeBackSubcategories')}
              </button>
            ) : null}
            <h1 className="page-title">{categoryTitle}</h1>
            {!isMcCafe && (
              <div className="pills no-scrollbar" ref={pillsRef}>
                {categoryPills.map((pill) => (
                  <button
                    type="button"
                    key={pill}
                    className={`pill ${activePill === pill ? 'active' : ''}`}
                    onClick={() => setActivePill(pill)}
                  >
                    {getPillLabel(pill, activeCategory, language, t)}
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="products-grid">
            <div
              className={`products-grid-inner ${showMcCafeSubgrid ? 'products-grid-inner--mc-cafe-subs' : ''}`}
            >
              {showMcCafeSubgrid ? (
                mcCafeSubcategories.map((sub) => {
                  const count = countMcCafeBySubcategory(products, sub.id);
                  const coverImage = getMcCafeSubcategoryCoverImage(products, sub.id);
                  return (
                    <button
                      type="button"
                      key={sub.id}
                      className="mc-cafe-sub-card"
                      disabled={count === 0}
                      onClick={() => setActiveMcCafeSub(sub.id)}
                    >
                      <div className="mc-cafe-sub-image">
                        <MenuProductImage
                          src={coverImage}
                          alt=""
                          className="mc-cafe-sub-image-img"
                        />
                      </div>
                      <div className="mc-cafe-sub-body">
                        <span className="mc-cafe-sub-name">
                          {getMcCafeSubcategoryLabel(sub.id, language, t)}
                        </span>
                        {count > 0 && (
                          <span className="mc-cafe-sub-count">
                            {count}{' '}
                            {count === 1 ? t(language, 'mcCafeItem') : t(language, 'mcCafeItems')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : gridProducts.length === 0 ? (
                <p className="menu-empty">{t(language, 'browseMenu')}</p>
              ) : (
                gridProducts.map((product) => {
                  const variant = getProductCardVariant(product, bentoLayout);
                  return (
                    <article
                      key={product.id}
                      className={`product-card product-card--${variant}`}
                      onClick={() => navigate(`/product/${product.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/product/${product.id}`);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {product.isNew && (
                        <span className="badge-new">{t(language, 'badgeNew')}</span>
                      )}
                      {product.isBestseller && (
                        <span className="badge-bestseller">bestseller</span>
                      )}
                      <div className="product-image-container">
                        <MenuProductImage src={product.image} alt="" />
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        {(variant === 'wide' || variant === 'featured') && product.description && (
                          <p className="product-description">{product.description}</p>
                        )}
                        <Price
                          value={product.price}
                          size={variant === 'featured' ? 'lg' : 'md'}
                        />
                      </div>
                    </article>
                  );
                })
              )}
              <div className="products-grid-spacer" aria-hidden />
            </div>
          </div>
        </section>
      </div>

      <footer className="menu-dock">
        <div className="menu-dock-sheet">
          <div className="menu-dock-row">
            <button
              type="button"
              className="menu-dock-cart"
              onClick={() => navigate('/cart')}
              disabled={itemCount === 0}
              aria-label={t(language, 'showCart')}
            >
              <span className="menu-dock-cart-icon" aria-hidden>
                <DockCartIcon />
                {itemCount > 0 && (
                  <span className="menu-dock-cart-badge">{itemCount}</span>
                )}
              </span>
              <span className="menu-dock-cart-copy">
                <span className="menu-dock-cart-label">
                  {t(language, 'showCart')}
                  <ChevronUp size={14} strokeWidth={2.5} aria-hidden />
                </span>
                <span className="menu-dock-promo">{t(language, 'addPromo')}</span>
              </span>
            </button>

            <button
              type="button"
              className="menu-dock-cta"
              disabled={itemCount === 0}
              onClick={() => navigate(itemCount > 0 ? '/checkout' : '/cart')}
            >
              {itemCount === 0 ? (
                <span className="menu-dock-cta-text">{t(language, 'payDisabled')}</span>
              ) : (
                <span className="menu-dock-cta-text">
                  {t(language, 'orderPay')}{' '}
                  <span className="menu-dock-cta-price">
                    <span>{payParts.whole}</span>
                    <span className="menu-dock-cta-price-dec">.{payParts.cents}</span>
                    <span className="menu-dock-cta-price-cur"> €</span>
                  </span>
                </span>
              )}
            </button>
          </div>

          <button type="button" className="menu-dock-back" onClick={() => navigate('/')}>
            <ChevronLeft size={15} strokeWidth={2.5} aria-hidden />
            {t(language, 'goBackStart')}
          </button>
        </div>
      </footer>
    </motion.div>
  );
};

export default MenuScreen;
