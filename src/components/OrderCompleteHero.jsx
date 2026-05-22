import React from 'react';
import { motion } from 'framer-motion';
import './OrderCompleteHero.css';

const HERO_SRC = '/brand/order-complete-hero.png';

export default function OrderCompleteHero() {
  return (
    <motion.div
      className="order-complete-hero"
      aria-hidden
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <img
        src={HERO_SRC}
        alt=""
        className="order-complete-hero-img"
        draggable={false}
      />
    </motion.div>
  );
}
