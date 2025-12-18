import { useState, useEffect } from 'react';

/**
 * Хук для принудительного обновления компонента при изменении данных
 * Слушает события обновлений и форсит ре-рендер
 */
export function useForceUpdate() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const forceUpdate = () => {
      console.log('🔄 [useForceUpdate] Force updating component');
      setTick(tick => tick + 1);
    };

    // Слушаем ВСЕ типы обновлений
    const events = [
      'currencyChanged',
      'dataUpdated',
      'packagesUpdated',
      'ordersUpdated',
      'balanceUpdated',
      'addressesUpdated'
    ];

    events.forEach(event => {
      window.addEventListener(event, forceUpdate);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, forceUpdate);
      });
    };
  }, []);
}

/**
 * Функция для отправки события обновления
 */
export function triggerUpdate(type: string) {
  console.log(`📡 [triggerUpdate] Broadcasting ${type} update`);
  window.dispatchEvent(new CustomEvent(type));
}
