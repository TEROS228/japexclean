// Japan Post EMS Rates (2024)
// Source: https://www.post.japanpost.jp/int/charge/list/ems_all_en.html

export interface EMSRate {
  weight: number; // in kg
  zone1: number;  // First Zone: China, South Korea
  zone2: number;  // Second Zone: Singapore, Thailand, Malaysia, Philippines, Vietnam, Indonesia
  zone3: number;  // Third Zone: UK, Germany, France, Canada, Australia, New Zealand, Europe, Turkey
  zone4: number;  // Zone 4: U.S. (SUSPENDED)
  zone5: number;  // Fifth Zone: South Africa, Argentina, Brazil, Peru, Chile
}

export const emsRates: EMSRate[] = [
  { weight: 0.5, zone1: 1450, zone2: 2200, zone3: 2900, zone4: 3600, zone5: 3600 },
  { weight: 1.0, zone1: 1900, zone2: 2900, zone3: 4000, zone4: 5100, zone5: 5300 },
  { weight: 1.5, zone1: 2400, zone2: 3600, zone3: 5100, zone4: 6600, zone5: 7000 },
  { weight: 2.0, zone1: 2900, zone2: 4300, zone3: 6200, zone4: 8100, zone5: 8700 },
  { weight: 2.5, zone1: 3400, zone2: 5000, zone3: 7300, zone4: 9600, zone5: 10400 },
  { weight: 3.0, zone1: 3900, zone2: 5700, zone3: 8400, zone4: 11100, zone5: 12100 },
  { weight: 3.5, zone1: 4400, zone2: 6400, zone3: 9500, zone4: 12600, zone5: 13800 },
  { weight: 4.0, zone1: 4900, zone2: 7100, zone3: 10600, zone4: 14100, zone5: 15500 },
  { weight: 4.5, zone1: 5400, zone2: 7800, zone3: 11700, zone4: 15600, zone5: 17200 },
  { weight: 5.0, zone1: 5900, zone2: 8500, zone3: 12800, zone4: 17100, zone5: 18900 },
  { weight: 6.0, zone1: 6900, zone2: 9900, zone3: 15000, zone4: 20100, zone5: 22300 },
  { weight: 7.0, zone1: 7900, zone2: 11300, zone3: 17200, zone4: 23100, zone5: 25700 },
  { weight: 8.0, zone1: 8900, zone2: 12700, zone3: 19400, zone4: 26100, zone5: 29100 },
  { weight: 9.0, zone1: 9900, zone2: 14100, zone3: 21600, zone4: 29100, zone5: 32500 },
  { weight: 10.0, zone1: 10900, zone2: 15500, zone3: 23800, zone4: 32100, zone5: 35900 },
  { weight: 11.0, zone1: 11900, zone2: 16900, zone3: 26000, zone4: 35100, zone5: 39300 },
  { weight: 12.0, zone1: 12900, zone2: 18300, zone3: 28200, zone4: 38100, zone5: 42700 },
  { weight: 13.0, zone1: 13900, zone2: 19700, zone3: 30400, zone4: 41100, zone5: 46100 },
  { weight: 14.0, zone1: 14900, zone2: 21100, zone3: 32600, zone4: 44100, zone5: 49500 },
  { weight: 15.0, zone1: 15900, zone2: 22500, zone3: 34800, zone4: 47100, zone5: 52900 },
  { weight: 16.0, zone1: 16900, zone2: 23900, zone3: 37000, zone4: 50100, zone5: 56300 },
  { weight: 17.0, zone1: 17900, zone2: 25300, zone3: 39200, zone4: 53100, zone5: 59700 },
  { weight: 18.0, zone1: 18900, zone2: 26700, zone3: 41400, zone4: 56100, zone5: 63100 },
  { weight: 19.0, zone1: 19900, zone2: 28100, zone3: 43600, zone4: 59100, zone5: 66500 },
  { weight: 20.0, zone1: 20900, zone2: 29500, zone3: 45800, zone4: 62100, zone5: 69900 },
  { weight: 21.0, zone1: 21900, zone2: 30900, zone3: 48000, zone4: 65100, zone5: 73300 },
  { weight: 22.0, zone1: 22900, zone2: 32300, zone3: 50200, zone4: 68100, zone5: 76700 },
  { weight: 23.0, zone1: 23900, zone2: 33700, zone3: 52400, zone4: 71100, zone5: 80100 },
  { weight: 24.0, zone1: 24900, zone2: 35100, zone3: 54600, zone4: 74100, zone5: 83500 },
  { weight: 25.0, zone1: 25900, zone2: 36500, zone3: 56800, zone4: 77100, zone5: 86900 },
];

export const zones = {
  zone1: {
    name: "First Zone",
    regions: ["East Asia"],
    countries: ["China", "South Korea"]
  },
  zone2: {
    name: "Second Zone",
    regions: ["Southeast Asia"],
    countries: ["Singapore", "Thailand", "Malaysia", "Philippines", "Vietnam", "Indonesia"]
  },
  zone3: {
    name: "Third Zone",
    regions: ["Europe", "Oceania", "Canada", "Middle East"],
    countries: [
      // Oceania & Canada
      "Australia", "New Zealand", "Canada",
      // Western & Northern Europe
      "United Kingdom", "Great Britain", "UK", "Germany", "France", "Austria", "Ireland",
      "Spain", "Portugal", "Italy", "Norway", "Sweden", "Finland",
      // Eastern & Central Europe
      "Poland", "Czech Republic", "Czechia", "Hungary", "Slovakia", "Lithuania",
      "Latvia", "Estonia", "Romania", "Bulgaria", "Croatia", "Greece",
      // Middle East
      "Turkey"
    ]
  },
  zone4: {
    name: "Zone 4 - SUSPENDED",
    regions: ["United States - EMS SHIPPING CURRENTLY SUSPENDED"],
    countries: ["USA", "United States", "Guam"],
    suspended: true
  },
  zone5: {
    name: "Fifth Zone",
    regions: ["Africa", "South America"],
    countries: [
      // Africa
      "South Africa",
      // South America
      "Argentina", "Brazil", "Peru", "Chile"
    ]
  }
};

export function calculateEMSCost(weight: number, zone: 1 | 2 | 3 | 4 | 5): number {
  // Округляем вес вверх до ближайшей весовой категории
  const roundedWeight = Math.ceil(weight * 2) / 2; // Округление до 0.5 кг

  // Находим подходящую тарифную категорию
  const rate = emsRates.find(r => r.weight >= roundedWeight);

  if (!rate) {
    // Если вес больше максимального (25кг), возвращаем максимальную ставку
    const maxRate = emsRates[emsRates.length - 1];
    return maxRate[`zone${zone}` as keyof EMSRate] as number;
  }

  return rate[`zone${zone}` as keyof EMSRate] as number;
}

// Расчет объемного веса для EMS (L x W x H / 6000)
export function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 6000;
}

// Определяем итоговый вес для расчета (больше из фактического и объемного)
export function getChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  const volumetricWeight = calculateVolumetricWeight(length, width, height);
  return Math.max(actualWeight, volumetricWeight);
}
