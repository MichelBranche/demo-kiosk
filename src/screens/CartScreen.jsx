import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import Price from '../components/Price';
import { calcLineTotal } from '../utils/price';
import './CartScreen.css';

const CartScreen = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    language,
    orderType,
    subtotal,
    discount,
    total,
    promoCode,
    promoMessage,
    updateCartItem,
    removeFromCart,
    applyPromo,
    clearPromo,
  } = useKiosk();
  const [promoInput, setPromoInput] = useState(promoCode);

  const handlePay = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  return (
    <motion.div
      className="cart-screen"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div className="cart-header">
        <button
          type="button"
          className="cart-back-btn"
          onClick={() => navigate('/menu')}
          aria-label={t(language, 'backToMenu')}
        >
          <span className="cart-back-btn-icon" aria-hidden>
            <ChevronLeft size={22} strokeWidth={2.5} />
          </span>
          <span className="cart-back-btn-label">{t(language, 'backToMenu')}</span>
        </button>
        <h1 className="cart-title">{t(language, 'yourOrder')}</h1>
        {orderType && (
          <span className="order-type-badge">
            {orderType === 'dine' ? t(language, 'orderTypeDine') : t(language, 'orderTypeTakeout')}
          </span>
        )}
      </div>

      <div className="cart-scroll no-scrollbar">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p>{t(language, 'emptyCart')}</p>
            <button className="btn-secondary" onClick={() => navigate('/menu')}>
              {t(language, 'browseMenu')}
            </button>
          </div>
        ) : (
          <ul className="cart-lines">
            {cartItems.map((item) => (
              <li key={item.lineId} className="cart-line">
                <div className="cart-line-img">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="cart-line-body">
                  <h3>{item.name}</h3>
                  {item.mealUpgrade && (
                    <p className="cart-line-meta">+ {item.mealUpgrade.name}</p>
                  )}
                  <div className="cart-line-actions">
                    <div className="qty-selector compact">
                      <button
                        className="qty-btn"
                        onClick={() =>
                          item.quantity > 1
                            ? updateCartItem(item.lineId, { quantity: item.quantity - 1 })
                            : removeFromCart(item.lineId)
                        }
                      >
                        {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          updateCartItem(item.lineId, { quantity: item.quantity + 1 })
                        }
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <Price value={calcLineTotal(item)} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cartItems.length > 0 && (
          <div className="promo-section">
            <label className="promo-label">{t(language, 'addPromo')}</label>
            <div className="promo-row">
              <input
                type="text"
                className="promo-input"
                placeholder={t(language, 'promoPlaceholder')}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button
                className="btn-secondary promo-apply"
                onClick={() => applyPromo(promoInput)}
              >
                {t(language, 'apply')}
              </button>
            </div>
            {promoMessage === 'applied' && (
              <p className="promo-msg success">{t(language, 'promoApplied')} (MCD10 / MAC5)</p>
            )}
            {promoMessage === 'invalid' && (
              <p className="promo-msg error">{t(language, 'promoInvalid')}</p>
            )}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="cart-totals">
            <div className="total-row">
              <span>{t(language, 'subtotal')}</span>
              <Price value={subtotal} />
            </div>
            {discount > 0 && (
              <div className="total-row discount">
                <span>{t(language, 'discount')}</span>
                <span className="discount-val">−{discount.toFixed(2)} €</span>
              </div>
            )}
            <div className="total-row grand">
              <span>{t(language, 'total')}</span>
              <Price value={total} />
            </div>
          </div>
        )}
        <div style={{ height: '140px' }} />
      </div>

      <div className="bottom-bar cart-bottom-bar">
        <button
          className="btn-primary pay-btn"
          disabled={cartItems.length === 0}
          onClick={handlePay}
        >
          {cartItems.length === 0
            ? t(language, 'payDisabled')
            : (
              <>
                {t(language, 'orderPay')}{' '}
                {Math.floor(total)}
                <span className="small-price">.{splitCents(total)}</span> €
              </>
            )}
        </button>
      </div>
    </motion.div>
  );
};

function splitCents(value) {
  return String(Math.round((value % 1) * 100)).padStart(2, '0');
}

export default CartScreen;
