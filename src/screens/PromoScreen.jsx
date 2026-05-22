import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import { promoVideos } from '../data/promos';
import McLogo from '../components/McLogo';
import PromoCardIcon from '../components/PromoCardIcon';
import './PromoScreen.css';

const PromoScreen = () => {
  const navigate = useNavigate();
  const { language } = useKiosk();
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef(null);

  const activeVideo = promoVideos[activeIndex];

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % promoVideos.length);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }, [activeIndex, activeVideo.src]);

  const handleStartOrder = () => {
    navigate('/start');
  };

  return (
    <motion.div
      className="promo-screen-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="button"
      tabIndex={0}
      onClick={handleStartOrder}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartOrder();
        }
      }}
    >
      <header className="promo-navbar">
        <McLogo variant="navbar" />
        <div className="promo-dots" aria-hidden>
          {promoVideos.map((video, index) => (
            <span
              key={video.id}
              className={`promo-dot ${index === activeIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </header>

      <div className="promo-stage">
        <video
          ref={videoRef}
          key={activeVideo.id}
          className="promo-video"
          src={activeVideo.src}
          autoPlay
          muted
          playsInline
          loop={false}
          preload="auto"
          onEnded={goToNext}
        />
      </div>

      <footer className="promo-brand-footer" aria-hidden />

      <div className="promo-cta-panel">
        <motion.h2
          className="promo-order-here"
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 1, y: 0, scale: [1, 1.04, 1] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.5, ease: 'easeOut' },
                  y: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  scale: {
                    delay: 0.55,
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
          }
        >
          {t(language, 'orderHere')}
        </motion.h2>
        <p className="promo-tap-hint">{t(language, 'tapToOrder')}</p>
        <div className="promo-payment-block">
          <p className="promo-payment-info">{t(language, 'cardOnly')}</p>
          <PromoCardIcon />
        </div>
      </div>
    </motion.div>
  );
};

export default PromoScreen;
