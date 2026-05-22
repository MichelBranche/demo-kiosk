import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageSlide } from '../utils/motion';
import { ChevronLeft, CircleCheck, Clock, Stamp, Loader2 } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import { formatPriceButton } from '../utils/price';
import { formatOrderLineTitle, getOrderLineMeta } from '../utils/orderLine';
import './CheckoutScreen.css';

const PAY_DURATION_MS = 2400;

const CheckoutScreen = () => {
  const navigate = useNavigate();
  const { language, orderType, cartItems, subtotal, discount, total, completeOrder } = useKiosk();
  const [paying, setPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const payParts = formatPriceButton(total);
  const subParts = formatPriceButton(subtotal);

  useEffect(() => {
    if (!paying) return undefined;
    const timers = [
      setTimeout(() => setPaymentStep(1), 400),
      setTimeout(() => setPaymentStep(2), 900),
      setTimeout(() => setPaymentStep(3), 1500),
    ];
    const done = setTimeout(() => {
      const snapshot = completeOrder();
      navigate('/order-complete', { state: { snapshot }, replace: true });
    }, PAY_DURATION_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [paying, completeOrder, navigate]);

  if (cartItems.length === 0 && !paying) {
    navigate('/menu', { replace: true });
    return null;
  }

  const handlePay = () => {
    if (paying) return;
    setPaying(true);
    setPaymentStep(0);
  };

  const progressPercent = paying
    ? Math.min(100, 25 + paymentStep * 25)
    : 25;

  const statusLabel = paying
    ? paymentStep >= 3
      ? t(language, 'paymentStatusComplete')
      : t(language, 'paymentStatusProcessing')
    : t(language, 'paymentStatusPending');

  return (
    <motion.div className="checkout-screen" {...pageSlide}>
      <div className="checkout-header">
        <button
          type="button"
          className="checkout-back-btn"
          onClick={() => navigate('/cart')}
          disabled={paying}
          aria-label={t(language, 'yourOrder')}
        >
          <span className="checkout-back-btn-icon" aria-hidden>
            <ChevronLeft size={22} strokeWidth={2.5} />
          </span>
          <span className="checkout-back-btn-label">{t(language, 'yourOrder')}</span>
        </button>
        <h1 className="checkout-title">{t(language, 'checkout')}</h1>
      </div>

      <div className="checkout-body no-scrollbar">
        <section className="checkout-invoice-wrap">
          <div className="checkout-invoice-slot" aria-hidden>
            <div className="checkout-slot-hole" />
          </div>

          <div className={`checkout-invoice${paying ? ' is-paying' : ''}`}>
            <h2 className="checkout-invoice-title">{t(language, 'checkoutInvoiceTitle')}</h2>

            <p className="checkout-invoice-row">
              {orderType === 'takeout'
                ? t(language, 'orderTypeTakeout')
                : t(language, 'orderTypeDine')}
              <span className="checkout-invoice-value">
                {cartItems.length} {t(language, 'items')}
              </span>
            </p>

            {discount > 0 && (
              <p className="checkout-invoice-row">
                {t(language, 'subtotal')}
                <span className="checkout-invoice-value">
                  {subParts.whole}.{subParts.cents} €
                </span>
              </p>
            )}
            {discount > 0 && (
              <p className="checkout-invoice-row">
                {t(language, 'discount')}
                <span className="checkout-invoice-value checkout-invoice-discount">
                  −{formatPriceButton(discount).whole}.{formatPriceButton(discount).cents} €
                </span>
              </p>
            )}

            <p className="checkout-invoice-row checkout-invoice-total">
              {t(language, 'total')}
              <span className="checkout-invoice-value">
                {payParts.whole}.{payParts.cents} €
              </span>
            </p>

            <hr className="checkout-invoice-divider" />

            <ul className="checkout-order-list">
              {cartItems.map((item) => (
                <li key={item.lineId}>
                  <div className="checkout-order-thumb">
                    <img src={item.image} alt="" />
                  </div>
                  <p>
                    <span className="checkout-order-name">
                      {formatOrderLineTitle(item)}
                      {getOrderLineMeta(item, t, language).map((line, index) => (
                        <span key={`${item.lineId}-meta-${index}`} className="checkout-order-meta">
                          {' '}
                          {line}
                        </span>
                      ))}
                    </span>
                    <span
                      className={`checkout-pay-tag${paying && paymentStep >= 2 ? ' is-paid' : ''}`}
                    >
                      {paying && paymentStep >= 2 ? (
                        <>
                          <CircleCheck size={12} strokeWidth={2.5} />
                          {t(language, 'itemPaid')}
                        </>
                      ) : (
                        <>
                          <Clock size={12} strokeWidth={2.5} />
                          {t(language, 'itemPending')}
                        </>
                      )}
                    </span>
                  </p>
                </li>
              ))}
            </ul>

            <div className="checkout-payment-status">
              <p className="checkout-status-heading">
                {t(language, 'paymentStatus')}
                <span>{statusLabel}</span>
              </p>
              <div
                className="checkout-status-progress"
                style={{
                  backgroundImage: `linear-gradient(90deg, var(--mcd-black) ${progressPercent}%, var(--gray-medium) ${progressPercent}%)`,
                }}
              >
                {[0, 1, 2, 3, 4].map((index) => {
                  const done =
                    (!paying && index === 0) ||
                    (paying && (index <= paymentStep || (paymentStep >= 3 && index === 4)));
                  const active = paying && index === paymentStep + 1 && paymentStep < 3;
                  const isStamp = index === 4;
                  return (
                    <div
                      key={index}
                      className={`checkout-checkpoint${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                    >
                      {isStamp ? (
                        <Stamp size={14} strokeWidth={2} />
                      ) : done ? (
                        <CircleCheck size={14} strokeWidth={2.5} />
                      ) : active ? (
                        <Loader2 size={14} className="checkout-checkpoint-spinner" />
                      ) : (
                        <span className="checkout-checkpoint-dot" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <hr className="checkout-section-divider" />

        <div className="checkout-payment-info">
          <p>{t(language, 'paymentMethod')}</p>
          <div className="checkout-card-info">
            <p>{t(language, 'cardEnding')}</p>
            <span className="checkout-card-icon" aria-hidden />
          </div>
        </div>

        <button
          type="button"
          className="checkout-pay-now-btn"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? (
            <>
              <Loader2 size={22} className="checkout-pay-spinner" />
              {t(language, 'processing')}
            </>
          ) : (
            `${t(language, 'payNow')} ${payParts.whole}.${payParts.cents} €`
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default CheckoutScreen;
