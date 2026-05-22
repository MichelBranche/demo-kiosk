import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { t } from '../i18n';
import './IdleTimeoutGuard.css';

const IDLE_WARNING_MS = 2 * 60 * 1000;
const IDLE_AUTO_CANCEL_MS = 60 * 1000;
const PROMO_PATH = '/';

export default function IdleTimeoutGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, resetSession } = useKiosk();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const warningTimerRef = useRef(null);
  const cancelTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(cancelTimerRef.current);
    clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    cancelTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const endSession = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    resetSession();
    navigate(PROMO_PATH, { replace: true });
  }, [clearTimers, navigate, resetSession]);

  const openWarning = useCallback(() => {
    clearTimers();
    setShowWarning(true);
    setSecondsLeft(Math.ceil(IDLE_AUTO_CANCEL_MS / 1000));

    cancelTimerRef.current = setTimeout(endSession, IDLE_AUTO_CANCEL_MS);

    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
  }, [clearTimers, endSession]);

  const armIdleTimer = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(openWarning, IDLE_WARNING_MS);
  }, [clearTimers, openWarning]);

  const handleProceed = useCallback(() => {
    setShowWarning(false);
    clearTimers();
    armIdleTimer();
  }, [armIdleTimer, clearTimers]);

  const isPromoScreen = location.pathname === PROMO_PATH;

  useEffect(() => {
    if (isPromoScreen) {
      setShowWarning(false);
      clearTimers();
      return undefined;
    }

    armIdleTimer();
    return clearTimers;
  }, [isPromoScreen, location.pathname, armIdleTimer, clearTimers]);

  useEffect(() => {
    if (isPromoScreen || showWarning) return undefined;

    const onActivity = () => armIdleTimer();

    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', onActivity, opts);
    window.addEventListener('keydown', onActivity, opts);
    window.addEventListener('wheel', onActivity, opts);

    return () => {
      window.removeEventListener('pointerdown', onActivity, opts);
      window.removeEventListener('keydown', onActivity, opts);
      window.removeEventListener('wheel', onActivity, opts);
    };
  }, [isPromoScreen, showWarning, armIdleTimer]);

  return (
    <>
      {children}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            className="idle-timeout-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="idle-timeout-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="idle-timeout-dialog"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <h2 id="idle-timeout-title" className="idle-timeout-title">
                {t(language, 'idleTitle')}
              </h2>
              <p className="idle-timeout-hint">
                {t(language, 'idleAutoHint')} {secondsLeft}s
              </p>
              <div className="idle-timeout-actions">
                <button type="button" className="btn-primary idle-timeout-proceed" onClick={handleProceed}>
                  {t(language, 'idleProceed')}
                </button>
                <button type="button" className="btn-secondary idle-timeout-cancel" onClick={endSession}>
                  {t(language, 'idleCancel')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
