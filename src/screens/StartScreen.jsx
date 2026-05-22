import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { languages, t } from '../i18n';
import McLogo from '../components/McLogo';
import DineInTrayIcon from '../components/icons/DineInTrayIcon';
import TakeoutBagIcon from '../components/icons/TakeoutBagIcon';
import './StartScreen.css';

const StartScreen = () => {
  const navigate = useNavigate();
  const { language, setLanguage, setOrderType } = useKiosk();

  const startOrder = (type) => {
    setOrderType(type);
    navigate('/menu');
  };

  return (
    <motion.div
      className="start-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="logo-container">
        <McLogo variant="start" />
      </div>

      <div className="start-content">
        <h2 className="start-title">{t(language, 'whereEat')}</h2>

        <div className="dine-options">
          <button type="button" className="dine-btn" onClick={() => startOrder('dine')}>
            <span className="dine-icon-slot" aria-hidden>
              <DineInTrayIcon className="dine-icon-svg" />
            </span>
            <span className="dine-text">{t(language, 'dineIn')}</span>
          </button>

          <button type="button" className="dine-btn" onClick={() => startOrder('takeout')}>
            <span className="dine-icon-slot" aria-hidden>
              <TakeoutBagIcon className="dine-icon-svg" />
            </span>
            <span className="dine-text">{t(language, 'takeOut')}</span>
          </button>
        </div>

        <div className="languages">
          {languages.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`lang-item ${language === lang.id ? 'active' : ''}`}
              onClick={() => setLanguage(lang.id)}
            >
              <span className="lang-flag">
                <img src={lang.flagSrc} alt="" className="lang-flag-img" draggable={false} />
              </span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="start-footer">
        <a href="#">{t(language, 'terms')}</a>
        <a href="#">{t(language, 'allergens')}</a>
      </div>
    </motion.div>
  );
};

export default StartScreen;
