import { useState, useRef, useEffect } from 'react';
import { calculateEMSCost, getChargeableWeight } from '@/lib/emsRates';
import { calculateECMSCost, getECMSChargeableWeight, ecmsDestinations, ECMSDestination } from '@/lib/ecmsRates';
import { useCurrency } from '@/context/CurrencyContext';
import { Package, Ruler, Weight, MapPin, Calculator, Plane, Camera, Package2, Layers, ChevronDown, Search, X } from 'lucide-react';

type ShippingService = 'EMS' | 'ECMS';

const emsZones = [
  { zone: 1, name: 'Zone 1', desc: 'China, S.Korea, Taiwan' },
  { zone: 2, name: 'Zone 2', desc: 'Hong Kong, Singapore, Thailand' },
  { zone: 3, name: 'Zone 3', desc: 'Canada, Europe, Australia' },
  { zone: 5, name: 'Zone 5', desc: 'S.America, Africa' },
] as const;

// USA States list with 2-letter codes
const USA_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

// Canadian Provinces
const CANADA_PROVINCES = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' }, { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' }
];

// Australian States
const AUSTRALIA_STATES = [
  { code: 'NSW', name: 'New South Wales' }, { code: 'VIC', name: 'Victoria' }, { code: 'QLD', name: 'Queensland' },
  { code: 'SA', name: 'South Australia' }, { code: 'WA', name: 'Western Australia' }, { code: 'TAS', name: 'Tasmania' },
  { code: 'NT', name: 'Northern Territory' }, { code: 'ACT', name: 'Australian Capital Territory' }
];

// FedEx Countries
const FEDEX_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IN', name: 'India' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'MD', name: 'Moldova' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'RS', name: 'Serbia' },
  { code: 'GR', name: 'Greece' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'PL', name: 'Poland' },
  { code: 'BY', name: 'Belarus' },
  { code: 'RU', name: 'Russia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DK', name: 'Denmark' },
  { code: 'TR', name: 'Turkey' },
  { code: 'GE', name: 'Georgia' },
  { code: 'NO', name: 'Norway' },
  { code: 'SE', name: 'Sweden' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brazil' },
  { code: 'PE', name: 'Peru' },
  { code: 'CL', name: 'Chile' }
];

export default function ShippingCalculator() {
  const { formatPrice } = useCurrency();

  // Service selection
  const [service, setService] = useState<ShippingService>('EMS');

  // Input states
  const [weightGrams, setWeightGrams] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');

  // EMS zones: 1, 2, 3, 5 (Zone 4 suspended)
  const [emsZone, setEmsZone] = useState<1 | 2 | 3 | 5>(3);

  // ECMS destinations
  const [ecmsDestination, setEcmsDestination] = useState<ECMSDestination>('usa');

  // FedEx address input states
  const [fedexWeight, setFedexWeight] = useState<string>('');
  const [fedexCity, setFedexCity] = useState<string>('');
  const [fedexState, setFedexState] = useState<string>('');
  const [fedexPostalCode, setFedexPostalCode] = useState<string>('');
  const [fedexCountry, setFedexCountry] = useState<string>('US');
  const [fedexIsCommercial, setFedexIsCommercial] = useState<boolean>(false);
  const [fedexOptions, setFedexOptions] = useState<any[]>([]);
  const [loadingFedex, setLoadingFedex] = useState(false);
  const [fedexError, setFedexError] = useState<string | null>(null);

  // Dropdown states
  const [emsDropdownOpen, setEmsDropdownOpen] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Refs for click outside
  const emsDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);

  // Additional services
  const [photoService, setPhotoService] = useState(false);
  const [consolidation, setConsolidation] = useState(false);

  // Result states
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [chargeableWeight, setChargeableWeight] = useState<number | null>(null);
  const [volumetricWeight, setVolumetricWeight] = useState<number | null>(null);
  const [calculationKey, setCalculationKey] = useState(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emsDropdownRef.current && !emsDropdownRef.current.contains(event.target as Node)) {
        setEmsDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = FEDEX_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Auto-focus on search input when dropdown opens
  useEffect(() => {
    if (showCountryDropdown && countrySearchInputRef.current) {
      setTimeout(() => {
        countrySearchInputRef.current?.focus();
      }, 100);
    }
  }, [showCountryDropdown]);

  const handleCalculate = () => {
    const grams = parseFloat(weightGrams);
    const l = parseFloat(length);
    const wi = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(grams) || grams <= 0) {
      alert('Please enter a valid weight in grams');
      return;
    }

    // Сбрасываем предыдущие результаты для принудительного обновления
    setShippingCost(null);
    setChargeableWeight(null);
    setVolumetricWeight(null);

    // Небольшая задержка для принудительного ререндера
    setTimeout(() => {
      // Конвертируем граммы в килограммы
      const actualWeight = grams / 1000;

      // Если размеры указаны, рассчитываем объемный вес
      let volWeight = 0;
      let finalWeight = actualWeight;

      // Проверяем что ВСЕ размеры заполнены и валидны
      const hasDimensions = !isNaN(l) && !isNaN(wi) && !isNaN(h) && l > 0 && wi > 0 && h > 0;

      if (hasDimensions) {
        if (service === 'EMS') {
          // EMS uses divisor 6000
          volWeight = (l * wi * h) / 6000;
        } else {
          // ECMS uses divisor 5000
          volWeight = (l * wi * h) / 5000;
        }

        // Берем больший вес из фактического и объемного
        finalWeight = Math.max(actualWeight, volWeight);
        setVolumetricWeight(volWeight);
      } else {
        setVolumetricWeight(null);
      }

      // Округляем вес до 0.5 кг для тарификации (как в EMS/ECMS)
      // Например: 0.4кг -> 0.5кг, 0.6кг -> 1.0кг, 1.2кг -> 1.5кг
      const chargeableWeightRounded = Math.ceil(finalWeight * 2) / 2;
      setChargeableWeight(chargeableWeightRounded);

      // Calculate cost based on rounded weight
      const cost = service === 'EMS'
        ? calculateEMSCost(chargeableWeightRounded, emsZone)
        : calculateECMSCost(chargeableWeightRounded, ecmsDestination);

      setShippingCost(cost);

      // Обновляем ключ для принудительного ререндера результатов
      setCalculationKey(prev => prev + 1);
    }, 10);
  };

  const handleFedExCalculate = async () => {
    const weight = parseFloat(fedexWeight);

    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight in kg');
      return;
    }

    if (!fedexCity || !fedexState || !fedexPostalCode) {
      alert('Please fill in all address fields');
      return;
    }

    setLoadingFedex(true);
    setFedexError(null);
    setFedexOptions([]);

    try {
      const response = await fetch('/api/fedex/calculate-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weight,
          toCountry: fedexCountry,
          toCity: fedexCity,
          toState: fedexState,
          toPostalCode: fedexPostalCode,
          isCommercial: fedexIsCommercial
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setFedexError(result.error || 'Failed to calculate shipping rates');
        return;
      }

      if (result.success && result.options) {
        setFedexOptions(result.options);
      } else {
        setFedexError(result.error || 'No rates available');
      }
    } catch (error) {
      console.error('Error fetching FedEx rates:', error);
      setFedexError('Failed to calculate rates. Please try again.');
    } finally {
      setLoadingFedex(false);
    }
  };


  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
          <Calculator className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">International Shipping Calculator</h2>
          <p className="text-sm text-gray-500">Calculate shipping costs from Japan</p>
        </div>
      </div>

      {/* Service Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Plane size={16} />
          Shipping Service
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setService('EMS');
              setFedexOptions([]);
              setFedexError(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              service === 'EMS'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package size={18} />
            Japan Post EMS
          </button>
          <button
            onClick={() => {
              setService('ECMS');
              setShippingCost(null);
              setChargeableWeight(null);
              setVolumetricWeight(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
              service === 'ECMS'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Plane size={18} />
            FedEx
          </button>
        </div>
        {service === 'EMS' && (
          <div className="flex items-center gap-2 text-xs text-amber-700 mt-2 font-semibold bg-amber-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            EMS to USA is currently suspended
          </div>
        )}
        {service === 'ECMS' && (
          <div className="flex items-center gap-2 text-xs text-green-700 mt-2 font-semibold bg-green-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Get real-time FedEx rates for worldwide shipping
          </div>
        )}
      </div>

      {/* Destination Selection - Only show for EMS */}
      {service === 'EMS' && (
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <MapPin size={16} />
            Destination
          </label>

          <div className="relative" ref={emsDropdownRef}>
            <button
              onClick={() => setEmsDropdownOpen(!emsDropdownOpen)}
              className="w-full p-4 rounded-xl text-left transition-all border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {emsZones.find(z => z.zone === emsZone)?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {emsZones.find(z => z.zone === emsZone)?.desc}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-500 transition-transform ${emsDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {emsDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {emsZones.map((z) => (
                  <button
                    key={z.zone}
                    onClick={() => {
                      setEmsZone(z.zone as 1 | 2 | 3 | 5);
                      setEmsDropdownOpen(false);
                    }}
                    className={`w-full p-4 text-left transition-all hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                      emsZone === z.zone ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        emsZone === z.zone ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <MapPin size={18} className={emsZone === z.zone ? 'text-blue-600' : 'text-gray-600'} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{z.name}</p>
                        <p className="text-xs text-gray-600">{z.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight - Only show for EMS */}
      {service === 'EMS' && (
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Weight size={16} />
            Actual Weight (grams)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="e.g., 500 or 2500"
            value={weightGrams}
            onChange={(e) => setWeightGrams(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter weight in grams (e.g., 400g = 400, 1.5kg = 1500)
          </p>
        </div>
      )}

      {/* Dimensions - Only show for EMS */}
      {service === 'EMS' && (
        <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Ruler size={16} />
          Parcel Dimensions (cm) - Optional
        </label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-start gap-2 text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p>If dimensions are provided, volumetric weight will be calculated (L × W × H ÷ {service === 'EMS' ? '6000' : '5000'}).</p>
            <p className="mt-1 font-semibold text-orange-600">
              You'll be charged for whichever is greater: actual or volumetric weight.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Additional Services - Only show for EMS */}
      {service === 'EMS' && (
        <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Layers size={16} />
          Additional Services (Optional)
        </label>
        <div className="space-y-3">
          {/* Photo Service */}
          <button
            onClick={() => setPhotoService(!photoService)}
            className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
              photoService
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg mt-0.5 ${
                photoService ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Camera size={18} className={photoService ? 'text-purple-600' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">Photo Service</span>
                  <span className="text-sm font-bold text-gray-900">¥500</span>
                </div>
                <p className="text-xs text-gray-600">
                  Receive up to 3 photos of your items before shipping for quality inspection
                </p>
              </div>
            </div>
          </button>

          {/* Consolidation */}
          <button
            onClick={() => setConsolidation(!consolidation)}
            className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
              consolidation
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg mt-0.5 ${
                consolidation ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Package2 size={18} className={consolidation ? 'text-blue-600' : 'text-gray-600'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">Package Consolidation</span>
                  <span className="text-sm font-bold text-green-600">Free</span>
                </div>
                <p className="text-xs text-gray-600">
                  Combine multiple packages into one to save on shipping costs
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-start gap-2 text-xs text-blue-700 mt-3 bg-blue-50 p-3 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            These services are applied after your items arrive at our warehouse in Japan. The calculator shows estimated costs for planning purposes.
          </p>
        </div>
      </div>
      )}

      {/* Calculate Button - Only show for EMS */}
      {service === 'EMS' && (
        <div className="mb-6">
          <button
            onClick={handleCalculate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Calculate Shipping Cost
          </button>
        </div>
      )}

      {/* FedEx Calculator */}
      {service === 'ECMS' && (
        <>
          {/* Weight */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Weight size={16} />
              Package Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g., 2.5"
              value={fedexWeight}
              onChange={(e) => setFedexWeight(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter weight in kilograms (e.g., 2.5 kg)
            </p>
          </div>

          {/* Destination Address */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <MapPin size={16} />
              Destination Address
            </label>

            <div className="space-y-3">
              {/* Country */}
              <div className="relative" ref={countryDropdownRef}>
                <label className="text-xs text-gray-600 mb-1 block">Country</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-left bg-white flex justify-between items-center"
                  >
                    <span className={fedexCountry ? 'text-gray-900' : 'text-gray-400'}>
                      {fedexCountry
                        ? `${fedexCountry} - ${FEDEX_COUNTRIES.find(c => c.code === fedexCountry)?.name || fedexCountry}`
                        : 'Select Country'}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            ref={countrySearchInputRef}
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {countrySearch && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCountrySearch('');
                                countrySearchInputRef.current?.focus();
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {countrySearch && (
                          <p className="text-xs text-gray-500 mt-2">
                            Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
                          </p>
                        )}
                      </div>

                      {/* Countries List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => {
                            const isSelected = country.code === fedexCountry;
                            return (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setFedexCountry(country.code);
                                  setFedexState('');
                                  setShowStateDropdown(false);
                                  setShowCountryDropdown(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-0 ${
                                  isSelected
                                    ? 'bg-green-100 hover:bg-green-200'
                                    : 'hover:bg-green-50'
                                }`}
                              >
                                <div className={`font-medium text-sm flex items-center justify-between ${
                                  isSelected ? 'text-green-700' : 'text-gray-900'
                                }`}>
                                  <span>{country.code} - {country.name}</span>
                                  {isSelected && (
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            No countries found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">City</label>
                <input
                  type="text"
                  placeholder="e.g., New York"
                  value={fedexCity}
                  onChange={(e) => setFedexCity(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {/* State */}
              <div className="relative" ref={stateDropdownRef}>
                <label className="text-xs text-gray-600 mb-1 block">State/Province</label>
                {fedexCountry === 'US' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-left bg-white flex justify-between items-center"
                    >
                      <span className={fedexState ? 'text-gray-900' : 'text-gray-400'}>
                        {fedexState ? `${fedexState} - ${USA_STATES.find(s => s.code === fedexState)?.name || fedexState}` : 'Select State'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showStateDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {USA_STATES.map((state) => (
                          <button
                            key={state.code}
                            type="button"
                            onClick={() => {
                              setFedexState(state.code);
                              setShowStateDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {state.code} - {state.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : fedexCountry === 'CA' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-left bg-white flex justify-between items-center"
                    >
                      <span className={fedexState ? 'text-gray-900' : 'text-gray-400'}>
                        {fedexState ? `${fedexState} - ${CANADA_PROVINCES.find(p => p.code === fedexState)?.name || fedexState}` : 'Select Province'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showStateDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {CANADA_PROVINCES.map((province) => (
                          <button
                            key={province.code}
                            type="button"
                            onClick={() => {
                              setFedexState(province.code);
                              setShowStateDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {province.code} - {province.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : fedexCountry === 'AU' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-left bg-white flex justify-between items-center"
                    >
                      <span className={fedexState ? 'text-gray-900' : 'text-gray-400'}>
                        {fedexState ? `${fedexState} - ${AUSTRALIA_STATES.find(s => s.code === fedexState)?.name || fedexState}` : 'Select State'}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-500 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showStateDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {AUSTRALIA_STATES.map((state) => (
                          <button
                            key={state.code}
                            type="button"
                            onClick={() => {
                              setFedexState(state.code);
                              setShowStateDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">
                              {state.code} - {state.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g., Region"
                    value={fedexState}
                    onChange={(e) => setFedexState(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                )}
              </div>

              {/* Postal Code */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Postal/ZIP Code</label>
                <input
                  type="text"
                  placeholder="e.g., 10001"
                  value={fedexPostalCode}
                  onChange={(e) => setFedexPostalCode(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Commercial/Residential */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fedexIsCommercial}
                    onChange={(e) => setFedexIsCommercial(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    Commercial/Business address (saves on residential surcharge)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <div className="mb-6">
            <button
              onClick={handleFedExCalculate}
              disabled={loadingFedex}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingFedex ? 'Calculating...' : 'Calculate FedEx Rates'}
            </button>
          </div>

          {/* Error */}
          {fedexError && (
            <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700">{fedexError}</p>
                </div>
              </div>
            </div>
          )}

          {/* FedEx Results */}
          {fedexOptions.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="text-green-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">FedEx Shipping Options</h3>
              </div>

              <div className="space-y-3">
                {fedexOptions.map((option: any, idx: number) => (
                  <div key={idx} className="bg-white border-2 border-green-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{option.serviceName}</p>
                        {option.deliveryDays && (
                          <p className="text-xs text-gray-600 mt-1">
                            Estimated delivery: {option.deliveryDays} business days
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatPrice(option.rateJPY)}</p>
                      </div>
                    </div>
                    {option.estimatedDeliveryDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Estimated arrival: {new Date(option.estimatedDeliveryDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 text-xs text-green-700 mt-4 bg-green-100 border border-green-300 p-3 rounded-lg">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>
                  These are official FedEx rates from Japan to your destination. Rates include all surcharges and fees.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Results - Only show for EMS */}
      {service === 'EMS' && shippingCost !== null && (
        <div key={calculationKey} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Shipping Estimate</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Actual Weight:</span>
              <span className="font-semibold text-gray-900">
                {Math.round(parseFloat(weightGrams))}g ({(parseFloat(weightGrams) / 1000).toFixed(2)} kg)
              </span>
            </div>

            {volumetricWeight !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Volumetric Weight:</span>
                <span className={`font-semibold ${volumetricWeight > (parseFloat(weightGrams) / 1000) ? 'text-orange-600' : 'text-gray-900'}`}>
                  {Math.round(volumetricWeight * 1000)}g ({volumetricWeight.toFixed(2)} kg)
                  {volumetricWeight > (parseFloat(weightGrams) / 1000) && (
                    <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              </div>
            )}

            <div className="border-t-2 border-blue-200 pt-3 mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{service} Shipping:</span>
                <span className="font-semibold text-gray-900">{formatPrice(shippingCost)}</span>
              </div>

              {/* Additional Services Costs */}
              {(photoService || consolidation) && (
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  {photoService && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Camera size={14} className="text-purple-600" />
                        Photo Service
                      </span>
                      <span className="font-semibold text-gray-900">¥500</span>
                    </div>
                  )}
                  {consolidation && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Package2 size={14} className="text-blue-600" />
                        Consolidation
                      </span>
                      <span className="font-semibold text-green-600">Free</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-blue-200">
                <span className="text-lg font-bold text-gray-900">Total Estimated Cost:</span>
                <span className={`text-2xl font-bold ${service === 'EMS' ? 'text-blue-600' : 'text-green-600'}`}>
                  {formatPrice(shippingCost + (photoService ? 500 : 0))}
                </span>
              </div>
            </div>

            <div className={`flex items-start gap-2 border rounded-lg p-3 mt-4 ${service === 'EMS' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'}`}>
              <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${service === 'EMS' ? 'text-blue-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className={`text-xs ${service === 'EMS' ? 'text-blue-800' : 'text-green-800'}`}>
                  This is an estimate based on {service === 'EMS' ? 'Japan Post EMS' : 'FedEx International Priority'} rates. Actual costs may vary.
                  {volumetricWeight !== null && volumetricWeight > (parseFloat(weightGrams) / 1000) && (
                    <span className="block mt-2 font-semibold text-orange-700 flex items-start gap-1">
                      <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Your package is charged by volumetric weight because it's larger than actual weight.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
