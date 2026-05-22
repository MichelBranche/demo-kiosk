import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  mealUpgradeOptions,
  defaultMealDrinkImage,
  defaultMealFriesImage,
  getMealDrinkOptions,
  getMealFriesOptions,
  products,
} from '../data';
import { buildMealExtraCrossSellItems } from '../utils/crossSell';
import {
  calcMealFriesSurcharge,
  getIncludedFriesForMealSize,
} from '../utils/mealFries';
import { t } from '../i18n';
import './MealComposeWizard.css';

const STEPS = ['size', 'fries', 'drink', 'extras'];

function ComposeCancelLink({ language, onCancel }) {
  if (!onCancel) return null;
  return (
    <button type="button" className="meal-compose-cancel" onClick={onCancel}>
      {t(language, 'mealComposeCancel')}
    </button>
  );
}

export default function MealComposeWizard({
  open,
  product,
  variant = 'meal',
  language,
  onComplete,
  onSolo,
  onCancel,
}) {
  const [step, setStep] = useState('size');
  const [sizeOption, setSizeOption] = useState(null);
  const [fries, setFries] = useState(null);
  const [drink, setDrink] = useState(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState(() => new Set());

  const friesOptions = getMealFriesOptions();
  const drinks = getMealDrinkOptions();
  const extraProducts = useMemo(() => buildMealExtraCrossSellItems(products), [open, product?.id]);
  const includedFries = sizeOption ? getIncludedFriesForMealSize(sizeOption.id) : null;

  useEffect(() => {
    if (!open) return;
    setStep('size');
    setSizeOption(null);
    setFries(null);
    setDrink(null);
    setSelectedExtraIds(new Set());
  }, [open, product?.id]);

  useEffect(() => {
    if (step !== 'fries' || !sizeOption || fries) return;
    const included = getIncludedFriesForMealSize(sizeOption.id);
    if (!included) return;
    setFries({
      id: included.id,
      name: included.name,
      image: included.image,
      price: included.price,
    });
  }, [step, sizeOption, fries]);

  if (!open || !product) return null;

  const stepIndex = STEPS.indexOf(step);

  const goBack = () => {
    if (step === 'fries') setStep('size');
    else if (step === 'drink') setStep('fries');
    else if (step === 'extras') setStep('drink');
  };

  const toggleExtra = (productId) => {
    setSelectedExtraIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const finish = () => {
    const selectedExtras = extraProducts
      .filter((item) => selectedExtraIds.has(item.productId))
      .map((item) => ({
        productId: item.productId,
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      }));

    onComplete({
      sizeOption,
      fries,
      drink,
      selectedExtras,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="meal-compose-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="meal-compose-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <div className="meal-compose-progress" aria-hidden>
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`meal-compose-dot${i <= stepIndex ? ' is-active' : ''}`}
                />
              ))}
            </div>

            {step === 'size' && (
              <div className="meal-compose-step">
                <h2 className="meal-compose-title">{t(language, 'mealComposeSizeTitle')}</h2>
                <p className="meal-compose-sub">{t(language, 'mealComposeSizeSub')}</p>

                <div className="meal-compose-size-options">
                  {mealUpgradeOptions.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`meal-compose-size-card${sizeOption?.id === option.id ? ' is-selected' : ''}`}
                      onClick={() => setSizeOption(option)}
                    >
                      {option.isBestseller && (
                        <span className="badge-bestseller">bestseller</span>
                      )}
                      <div className="meal-compose-size-visual">
                        <img src={product.image} alt="" className="meal-compose-size-main" />
                        <img
                          src={defaultMealFriesImage}
                          alt=""
                          className="meal-compose-size-fries"
                        />
                        <img
                          src={defaultMealDrinkImage}
                          alt=""
                          className="meal-compose-size-drink"
                        />
                      </div>
                      <span className="meal-compose-size-name">{option.name}</span>
                      {variant === 'burger' && (
                        <span className="meal-compose-size-price">+{option.price.toFixed(2)} €</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="meal-compose-footer">
                  <div className="meal-compose-actions">
                    {variant === 'burger' && (
                      <button type="button" className="btn-secondary full-width" onClick={onSolo}>
                        {t(language, 'notToday')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary full-width"
                      disabled={!sizeOption}
                      onClick={() => setStep('fries')}
                    >
                      {t(language, 'mealComposeContinue')}
                    </button>
                  </div>
                  <ComposeCancelLink language={language} onCancel={onCancel} />
                </div>
              </div>
            )}

            {step === 'fries' && (
              <div className="meal-compose-step">
                <h2 className="meal-compose-title">{t(language, 'mealComposeFriesTitle')}</h2>
                <p className="meal-compose-sub">{t(language, 'mealComposeFriesSub')}</p>
                {includedFries && (
                  <p className="meal-compose-sub meal-compose-sub--included">
                    {includedFries.name} {t(language, 'mealComposeFriesIncluded')}
                  </p>
                )}

                <div className="meal-compose-drinks no-scrollbar">
                  {friesOptions.map((f) => {
                    const surcharge = calcMealFriesSurcharge(sizeOption, f);
                    return (
                      <button
                        type="button"
                        key={f.id}
                        className={`meal-compose-drink-card${fries?.id === f.id ? ' is-selected' : ''}`}
                        onClick={() =>
                          setFries({ id: f.id, name: f.name, image: f.image, price: f.price })
                        }
                      >
                        <img src={f.image} alt="" className="meal-compose-drink-img" />
                        <span className="meal-compose-drink-name">{f.name}</span>
                        {surcharge > 0 && (
                          <span className="meal-compose-fries-surcharge">
                            +{surcharge.toFixed(2)} €
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="meal-compose-footer">
                  <div className="meal-compose-actions meal-compose-actions--row">
                    <button type="button" className="btn-secondary meal-compose-back" onClick={goBack}>
                      {t(language, 'mealComposeBack')}
                    </button>
                    <button
                      type="button"
                      className="btn-primary meal-compose-next"
                      disabled={!fries}
                      onClick={() => setStep('drink')}
                    >
                      {t(language, 'mealComposeContinue')}
                    </button>
                  </div>
                  <ComposeCancelLink language={language} onCancel={onCancel} />
                </div>
              </div>
            )}

            {step === 'drink' && (
              <div className="meal-compose-step">
                <h2 className="meal-compose-title">{t(language, 'mealComposeDrinkTitle')}</h2>
                <p className="meal-compose-sub">{t(language, 'mealComposeDrinkSub')}</p>

                <div className="meal-compose-drinks no-scrollbar">
                  {drinks.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`meal-compose-drink-card${drink?.id === d.id ? ' is-selected' : ''}`}
                      onClick={() => setDrink({ id: d.id, name: d.name, image: d.image })}
                    >
                      <img src={d.image} alt="" className="meal-compose-drink-img" />
                      <span className="meal-compose-drink-name">{d.name}</span>
                    </button>
                  ))}
                </div>

                <div className="meal-compose-footer">
                  <div className="meal-compose-actions meal-compose-actions--row">
                    <button type="button" className="btn-secondary meal-compose-back" onClick={goBack}>
                      {t(language, 'mealComposeBack')}
                    </button>
                    <button
                      type="button"
                      className="btn-primary meal-compose-next"
                      disabled={!drink}
                      onClick={() => setStep('extras')}
                    >
                      {t(language, 'mealComposeContinue')}
                    </button>
                  </div>
                  <ComposeCancelLink language={language} onCancel={onCancel} />
                </div>
              </div>
            )}

            {step === 'extras' && (
              <div className="meal-compose-step">
                <h2 className="meal-compose-title">{t(language, 'mealComposeExtrasTitle')}</h2>
                <p className="meal-compose-sub">{t(language, 'mealComposeExtrasSub')}</p>

                <div className="meal-compose-extras no-scrollbar">
                  {extraProducts.map((item) => {
                    const selected = selectedExtraIds.has(item.productId);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`meal-compose-extra-card${selected ? ' is-selected' : ''}`}
                        onClick={() => toggleExtra(item.productId)}
                      >
                        {selected && (
                          <span className="meal-compose-extra-check" aria-hidden>
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                        <img src={item.image} alt="" className="meal-compose-extra-img" />
                        <span className="meal-compose-extra-name">{item.name}</span>
                        <span className="meal-compose-extra-price">
                          {item.price.toFixed(2)} €
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="meal-compose-footer">
                  <div className="meal-compose-actions meal-compose-actions--row">
                    <button type="button" className="btn-secondary meal-compose-back" onClick={goBack}>
                      {t(language, 'mealComposeBack')}
                    </button>
                    <button type="button" className="btn-primary meal-compose-next" onClick={finish}>
                      {t(language, 'mealComposeContinue')}
                    </button>
                  </div>
                  <ComposeCancelLink language={language} onCancel={onCancel} />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
