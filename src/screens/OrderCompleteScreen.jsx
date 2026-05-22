import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageReveal } from '../utils/motion';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import OrderCompleteHero from '../components/OrderCompleteHero';
import { formatOrderLineTitle, getOrderLineMeta } from '../utils/orderLine';
import './OrderCompleteScreen.css';

const OrderCompleteScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, lastOrderNumber, lastOrderSnapshot, resetSession } = useKiosk();
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const snapshot =
    location.state?.snapshot ?? lastOrderSnapshot ?? null;
  const orderNumber = snapshot?.number || lastOrderNumber || '----';
  const snapshotItems = snapshot?.items ?? [];

  const handleBackToMenu = () => {
    resetSession();
    navigate('/');
  };

  return (
    <motion.div className="order-complete-screen" {...pageReveal}>
      <div className="order-complete-scroll no-scrollbar">
        <div className="order-complete-main">
          <OrderCompleteHero />

          <h1 className="order-complete-title">{t(language, 'orderComplete')}</h1>
          <p className="order-complete-sub">{t(language, 'orderCompleteSub')}</p>

          <div className="order-number-card">
            <span className="order-number-label">{t(language, 'orderNumber')}</span>
            <span className="order-number-value">{orderNumber}</span>
          </div>

          <div className="order-pickup-block">
            <span className="order-pickup-label">{t(language, 'estimatedPickup')}</span>
            <span className="order-pickup-time">{t(language, 'estimatedPickupTime')}</span>
          </div>

          <AnimatePresence>
            {showOrderDetails && snapshotItems.length > 0 && (
              <motion.ul
                className="order-complete-details"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                {snapshotItems.map((item) => {
                  const metaLines = getOrderLineMeta(item, t, language);
                  return (
                    <li key={item.lineId}>
                      <span className="order-complete-details-name">
                        {formatOrderLineTitle(item)}
                      </span>
                      {metaLines.map((line, index) => (
                        <span
                          key={`${item.lineId}-meta-${index}`}
                          className="order-complete-details-meta"
                        >
                          {line}
                        </span>
                      ))}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>

          <div className="order-complete-actions">
            <button type="button" className="order-complete-primary" onClick={handleBackToMenu}>
              {t(language, 'backToMenu')}
            </button>
            <button
              type="button"
              className="order-complete-link"
              onClick={() => setShowOrderDetails((v) => !v)}
              aria-expanded={showOrderDetails}
            >
              {t(language, 'viewOrder')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCompleteScreen;
