import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currencies = [
    // Asia
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },

    // Americas
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', flag: '🇦🇷' },
    { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', flag: '🇨🇱' },

    // Europe
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
    { code: 'RSD', name: 'Serbian Dinar', symbol: 'din', flag: '🇷🇸' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴' },

    // Oceania & Africa
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' }
  ];

  const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCurrencyChange = (currencyCode: string) => {
    console.log('💱 [CurrencySelector] Changing currency from', currency, 'to', currencyCode);
    setCurrency(currencyCode as any);
    setIsOpen(false);
    console.log('💱 [CurrencySelector] Currency change complete');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation"
      >
        <span className="text-base sm:text-lg">{selectedCurrency.flag}</span>
        <span className="font-medium text-xs sm:text-sm">{selectedCurrency.code}</span>
        <ChevronDown
          size={14}
          className={`sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 sm:max-h-96 overflow-y-auto">
          <div className="py-1">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencyChange(curr.code)}
                className={`
                  w-full px-3 sm:px-4 py-2 text-left flex items-center gap-2 sm:gap-3 hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation
                  ${curr.code === currency ? 'bg-green-50 text-green-700' : 'text-gray-700'}
                `}
              >
                <span className="text-lg sm:text-xl">{curr.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm">{curr.code}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">{curr.name}</div>
                </div>
                <span className="text-xs sm:text-sm font-bold flex-shrink-0">{curr.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
