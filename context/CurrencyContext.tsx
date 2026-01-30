import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'NZD' |
                'CNY' | 'KRW' | 'TWD' | 'THB' | 'PHP' | 'IDR' | 'VND' | 'MYR' | 'INR' |
                'BRL' | 'ARS' | 'CLP' | 'ZAR' | 'SEK' | 'NOK' | 'DKK' | 'PLN' |
                'RSD' | 'TRY' | 'RON';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  convertPrice: (priceInJPY: number) => number;
  convertToJPY: (priceInCurrentCurrency: number) => number;
  formatPrice: (priceInJPY: number) => string;
  getCurrencySymbol: () => string;
  isLoaded: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const defaultRates: ExchangeRates = {
  JPY: 1,
  USD: 0.0067, EUR: 0.0062, GBP: 0.0053,
  CAD: 0.0093, AUD: 0.0104, NZD: 0.0112,
  CNY: 0.048, KRW: 8.95, TWD: 0.213, THB: 0.234, PHP: 0.380, IDR: 105, VND: 170, MYR: 0.030, INR: 0.56,
  BRL: 0.039, ARS: 6.8, CLP: 6.4, ZAR: 0.124,
  SEK: 0.072, NOK: 0.074, DKK: 0.046, PLN: 0.027,
  RSD: 0.73, TRY: 0.23, RON: 0.031
};

const currencyList = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD',
  'CNY', 'KRW', 'TWD', 'THB', 'PHP', 'IDR', 'VND', 'MYR', 'INR',
  'BRL', 'ARS', 'CLP', 'ZAR', 'SEK', 'NOK', 'DKK', 'PLN', 'RSD', 'TRY', 'RON'];

// Функция для получения начальной валюты из localStorage
function getInitialCurrency(): Currency {
  if (typeof window === 'undefined') return 'JPY';

  const savedCurrency = localStorage.getItem('preferred_currency') as Currency;
  const validCurrencies: Currency[] = ['JPY', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD',
    'CNY', 'KRW', 'TWD', 'THB', 'PHP', 'IDR', 'VND', 'MYR', 'INR',
    'BRL', 'ARS', 'CLP', 'ZAR', 'SEK', 'NOK', 'DKK', 'PLN', 'RSD', 'TRY', 'RON'];

  if (savedCurrency && validCurrencies.includes(savedCurrency)) {
        return savedCurrency;
  }

  return 'JPY';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    // Синхронная инициализация на клиенте
    if (typeof window !== 'undefined') {
      return getInitialCurrency();
    }
    return 'JPY';
  });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(defaultRates);
  const [isLoaded, setIsLoaded] = useState(false);

  // Обертка для setCurrency с логированием
  const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
  };

  // Получаем актуальные курсы валют при монтировании
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
        if (response.ok) {
          const data = await response.json();
          const rates = data.rates;

          // Создаем объект с актуальными курсами
          const newRates: ExchangeRates = { JPY: 1 };

          // Для каждой валюты берем курс из API или из дефолтных значений
          currencyList.forEach(curr => {
            newRates[curr] = rates[curr] || defaultRates[curr] || 1;
          });

                    setExchangeRates(newRates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
                // Используем дефолтные курсы если API недоступен - уже установлены в useState
      } finally {
        setIsLoaded(true);
      }
    };

    fetchExchangeRates();
  }, []);

  // Сохраняем выбранную валюту в localStorage при изменении
  useEffect(() => {
        localStorage.setItem('preferred_currency', currency);

    // Создаем кастомное событие для уведомления всех компонентов
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }));
  }, [currency]);

  const convertPrice = (priceInJPY: number): number => {
    const rate = exchangeRates[currency];

    // Проверяем что цена и курс валидны
    if (!priceInJPY || isNaN(priceInJPY)) return 0;
    if (!rate || isNaN(rate)) return priceInJPY; // Возвращаем исходную цену если курс невалиден

    return priceInJPY * rate;
  };

  const convertToJPY = (priceInCurrentCurrency: number): number => {
    const rate = exchangeRates[currency];

    // Проверяем что цена и курс валидны
    if (!priceInCurrentCurrency || isNaN(priceInCurrentCurrency)) return 0;
    if (!rate || isNaN(rate)) return priceInCurrentCurrency; // Возвращаем исходную цену если курс невалиден

    // Конвертируем обратно в JPY
    return Math.round(priceInCurrentCurrency / rate);
  };

  const getCurrencySymbol = (): string => {
    const symbols: { [key in Currency]: string } = {
      JPY: '¥', USD: '$', EUR: '€', GBP: '£',
      CAD: 'C$', AUD: 'A$', NZD: 'NZ$',
      CNY: '¥', KRW: '₩', TWD: 'NT$', THB: '฿', PHP: '₱', IDR: 'Rp', VND: '₫', MYR: 'RM', INR: '₹',
      BRL: 'R$', ARS: 'ARS$', CLP: 'CLP$', ZAR: 'R',
      SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
      RSD: 'din', TRY: '₺', RON: 'lei'
    };
    return symbols[currency];
  };

  const formatPrice = (priceInJPY: number): string => {
    const convertedPrice = convertPrice(priceInJPY);
    const symbol = getCurrencySymbol();

    // Проверяем на NaN
    if (isNaN(convertedPrice)) {
      console.error('NaN detected in formatPrice:', { priceInJPY, currency, rate: exchangeRates[currency] });
      return `${symbol}0`;
    }

    // Валюты без десятичных (используют целые числа)
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP'];
    if (noDecimalCurrencies.includes(currency)) {
      return `${symbol}${Math.round(convertedPrice).toLocaleString('en-US')}`;
    }

    // Для остальных валют показываем с 2 десятичными знаками и разделителями тысяч
    return `${symbol}${convertedPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRates,
        convertPrice,
        convertToJPY,
        formatPrice,
        getCurrencySymbol,
        isLoaded
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
