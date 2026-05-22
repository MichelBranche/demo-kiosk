import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { KioskProvider } from './context/KioskContext';
import IdleTimeoutGuard from './components/IdleTimeoutGuard';
import PromoScreen from './screens/PromoScreen';
import StartScreen from './screens/StartScreen';
import MenuScreen from './screens/MenuScreen';
import ProductScreen from './screens/ProductScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderCompleteScreen from './screens/OrderCompleteScreen';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PromoScreen />} />
        <Route path="/start" element={<StartScreen />} />
        <Route path="/menu" element={<MenuScreen />} />
        <Route path="/product/:id" element={<ProductScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/checkout" element={<CheckoutScreen />} />
        <Route path="/order-complete" element={<OrderCompleteScreen />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <KioskProvider>
      <Router>
        <IdleTimeoutGuard>
          <div className="app-shell">
            <div className="app-container">
              <div className="app-routes">
                <AnimatedRoutes />
              </div>
            </div>
            <a
              className="app-credit"
              href="https://www.michelbranche.it"
              target="_blank"
              rel="noopener noreferrer"
            >
              Design by Michel Branche
            </a>
          </div>
        </IdleTimeoutGuard>
      </Router>
    </KioskProvider>
  );
}

export default App;
