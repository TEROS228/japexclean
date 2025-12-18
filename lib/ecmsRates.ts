// ECMS Express Rates (2022 rates - from tenso.com)
// Source: https://media.tenso.com/guide/ecms2207/en/announcement.html

export interface ECMSRate {
  weight: number; // in kg
  hongKong: number;
  taiwan: number;
  korea: number;
  singapore: number;
  usa: number;
}

export const ecmsRates: ECMSRate[] = [
  { weight: 0.5, hongKong: 1180, taiwan: 1254, korea: 1254, singapore: 1813, usa: 2743 },
  { weight: 1.0, hongKong: 1423, taiwan: 1539, korea: 1539, singapore: 2142, usa: 3192 },
  { weight: 1.5, hongKong: 1647, taiwan: 1811, korea: 1811, singapore: 2485, usa: 3649 },
  { weight: 2.0, hongKong: 1881, taiwan: 2091, korea: 2091, singapore: 2815, usa: 4084 },
  { weight: 2.5, hongKong: 2106, taiwan: 2364, korea: 2364, singapore: 3157, usa: 4538 },
  { weight: 3.0, hongKong: 2140, taiwan: 2398, korea: 2398, singapore: 3200, usa: 4587 },
  { weight: 5.0, hongKong: 3023, taiwan: 3281, korea: 3281, singapore: 4477, usa: 6393 },
  { weight: 10.0, hongKong: 5018, taiwan: 5359, korea: 5359, singapore: 7357, usa: 10118 },
  { weight: 15.0, hongKong: 7173, taiwan: 7649, korea: 7649, singapore: 10509, usa: 14094 },
  { weight: 20.0, hongKong: 9538, taiwan: 10165, korea: 10165, singapore: 13943, usa: 18443 },
  { weight: 25.0, hongKong: 11614, taiwan: 12383, korea: 12383, singapore: 16968, usa: 22322 },
  { weight: 30.0, hongKong: 13798, taiwan: 14714, korea: 14714, singapore: 20132, usa: 26309 },
];

export type ECMSDestination = 'hongKong' | 'taiwan' | 'korea' | 'singapore' | 'usa';

export const ecmsDestinations = {
  usa: {
    name: "United States",
    flag: "🇺🇸",
    key: 'usa' as ECMSDestination
  }
};

export function calculateECMSCost(weight: number, destination: ECMSDestination): number {
  // Округляем вес вверх до ближайшей весовой категории
  const roundedWeight = Math.ceil(weight * 2) / 2; // Округление до 0.5 кг

  // Находим подходящую тарифную категорию
  const rate = ecmsRates.find(r => r.weight >= roundedWeight);

  if (!rate) {
    // Если вес больше максимального (30кг), возвращаем максимальную ставку
    const maxRate = ecmsRates[ecmsRates.length - 1];
    return maxRate[destination];
  }

  return rate[destination];
}

// Расчет объемного веса для ECMS (L x W x H / 5000) - отличается от EMS!
export function calculateECMSVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000;
}

// Определяем итоговый вес для расчета (больше из фактического и объемного)
export function getECMSChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  const volumetricWeight = calculateECMSVolumetricWeight(length, width, height);
  return Math.max(actualWeight, volumetricWeight);
}
