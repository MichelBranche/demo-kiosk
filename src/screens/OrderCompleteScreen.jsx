import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import './OrderCompleteScreen.css';

const OrderCompleteScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, lastOrderNumber, orderType, resetSession } = useKiosk();
  const orderNumber = location.state?.orderNumber || lastOrderNumber || '---';

  const handleNewOrder = () => {
    resetSession();
    navigate('/');
  };

  return (
    <motion.div
      className="order-complete-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="complete-icon-wrap">
        <Check size={40} color="#FFF" />
      </div>
      <h1>{t(language, 'orderComplete')}</h1>
      <p className="complete-sub">{t(language, 'pickUpAt')}</p>
      <div className="order-number-box">
        <span className="order-number-label">{t(language, 'orderNumber')}</span>
        <span className="order-number-value">{orderNumber}</span>
      </div>
      {orderType && (
        <p className="complete-order-type">
          {orderType === 'dine' ? t(language, 'orderTypeDine') : t(language, 'orderTypeTakeout')}
        </p>
      )}
      <button className="btn-primary complete-btn" onClick={handleNewOrder}>
        {t(language, 'newOrder')}
      </button>
    </motion.div>
  );
};

export default OrderCompleteScreen;
