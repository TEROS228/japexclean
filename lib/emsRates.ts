// Japan Post EMS Rates (current)
// Source: https://www.post.japanpost.jp/send/oversea/charge/list-ems/all_en.html

export interface EMSRate {
  weight: number; // max weight in kg for this tier
  zone1: number;  // First Zone:  China, South Korea, Taiwan
  zone2: number;  // Second Zone: Asia (excl. China, South Korea, Taiwan)
  zone3: number;  // Third Zone:  Oceania, Canada, Mexico, Middle East, Europe
  zone4: number;  // Fourth Zone: U.S. (incl. Guam and other U.S. territories)
  zone5: number;  // Fifth Zone:  Central/South America (excl. Mexico), Africa
}

export const emsRates: EMSRate[] = [
  { weight: 0.5,  zone1: 1450,  zone2: 1900,  zone3: 3150,  zone4: 3900,  zone5: 3600  },
  { weight: 0.6,  zone1: 1600,  zone2: 2150,  zone3: 3400,  zone4: 4180,  zone5: 3900  },
  { weight: 0.7,  zone1: 1750,  zone2: 2400,  zone3: 3650,  zone4: 4460,  zone5: 4200  },
  { weight: 0.8,  zone1: 1900,  zone2: 2650,  zone3: 3900,  zone4: 4740,  zone5: 4500  },
  { weight: 0.9,  zone1: 2050,  zone2: 2900,  zone3: 4150,  zone4: 5020,  zone5: 4800  },
  { weight: 1.0,  zone1: 2200,  zone2: 3150,  zone3: 4400,  zone4: 5300,  zone5: 5100  },
  { weight: 1.25, zone1: 2500,  zone2: 3500,  zone3: 5000,  zone4: 5990,  zone5: 5850  },
  { weight: 1.5,  zone1: 2800,  zone2: 3850,  zone3: 5550,  zone4: 6600,  zone5: 6600  },
  { weight: 1.75, zone1: 3100,  zone2: 4200,  zone3: 6150,  zone4: 7290,  zone5: 7350  },
  { weight: 2.0,  zone1: 3400,  zone2: 4550,  zone3: 6700,  zone4: 7900,  zone5: 8100  },
  { weight: 2.5,  zone1: 3900,  zone2: 5150,  zone3: 7750,  zone4: 9100,  zone5: 9600  },
  { weight: 3.0,  zone1: 4400,  zone2: 5750,  zone3: 8800,  zone4: 10300, zone5: 11100 },
  { weight: 3.5,  zone1: 4900,  zone2: 6350,  zone3: 9850,  zone4: 11500, zone5: 12600 },
  { weight: 4.0,  zone1: 5400,  zone2: 6950,  zone3: 10900, zone4: 12700, zone5: 14100 },
  { weight: 4.5,  zone1: 5900,  zone2: 7550,  zone3: 11950, zone4: 13900, zone5: 15600 },
  { weight: 5.0,  zone1: 6400,  zone2: 8150,  zone3: 13000, zone4: 15100, zone5: 17100 },
  { weight: 5.5,  zone1: 6900,  zone2: 8750,  zone3: 14050, zone4: 16300, zone5: 18600 },
  { weight: 6.0,  zone1: 7400,  zone2: 9350,  zone3: 15100, zone4: 17500, zone5: 20100 },
  { weight: 7.0,  zone1: 8200,  zone2: 10350, zone3: 17200, zone4: 19900, zone5: 22500 },
  { weight: 8.0,  zone1: 9000,  zone2: 11350, zone3: 19300, zone4: 22300, zone5: 24900 },
  { weight: 9.0,  zone1: 9800,  zone2: 12350, zone3: 21400, zone4: 24700, zone5: 27300 },
  { weight: 10.0, zone1: 10600, zone2: 13350, zone3: 23500, zone4: 27100, zone5: 29700 },
  { weight: 11.0, zone1: 11400, zone2: 14350, zone3: 25600, zone4: 29500, zone5: 32100 },
  { weight: 12.0, zone1: 12200, zone2: 15350, zone3: 27700, zone4: 31900, zone5: 34500 },
  { weight: 13.0, zone1: 13000, zone2: 16350, zone3: 29800, zone4: 34300, zone5: 36900 },
  { weight: 14.0, zone1: 13800, zone2: 17350, zone3: 31900, zone4: 36700, zone5: 39300 },
  { weight: 15.0, zone1: 14600, zone2: 18350, zone3: 34000, zone4: 39100, zone5: 41700 },
  { weight: 16.0, zone1: 15400, zone2: 19350, zone3: 36100, zone4: 41500, zone5: 44100 },
  { weight: 17.0, zone1: 16200, zone2: 20350, zone3: 38200, zone4: 43900, zone5: 46500 },
  { weight: 18.0, zone1: 17000, zone2: 21350, zone3: 40300, zone4: 46300, zone5: 48900 },
  { weight: 19.0, zone1: 17800, zone2: 22350, zone3: 42400, zone4: 48700, zone5: 51300 },
  { weight: 20.0, zone1: 18600, zone2: 23350, zone3: 44500, zone4: 51100, zone5: 53700 },
  { weight: 21.0, zone1: 19400, zone2: 24350, zone3: 46600, zone4: 53500, zone5: 56100 },
  { weight: 22.0, zone1: 20200, zone2: 25350, zone3: 48700, zone4: 55900, zone5: 58500 },
  { weight: 23.0, zone1: 21000, zone2: 26350, zone3: 50800, zone4: 58300, zone5: 60900 },
  { weight: 24.0, zone1: 21800, zone2: 27350, zone3: 52900, zone4: 60700, zone5: 63300 },
  { weight: 25.0, zone1: 22600, zone2: 28350, zone3: 55000, zone4: 63100, zone5: 65700 },
  { weight: 26.0, zone1: 23400, zone2: 29350, zone3: 57100, zone4: 65500, zone5: 68100 },
  { weight: 27.0, zone1: 24200, zone2: 30350, zone3: 59200, zone4: 67900, zone5: 70500 },
  { weight: 28.0, zone1: 25000, zone2: 31350, zone3: 61300, zone4: 70300, zone5: 72900 },
  { weight: 29.0, zone1: 25800, zone2: 32350, zone3: 63400, zone4: 72700, zone5: 75300 },
  { weight: 30.0, zone1: 26600, zone2: 33350, zone3: 65500, zone4: 75100, zone5: 77700 },
];

// Country → EMS zone mapping
const zone1Countries = [
  'China', 'South Korea', 'Korea', 'Taiwan',
];
const zone2Countries = [
  'Japan', // domestic — unlikely but safe
  'Hong Kong', 'Macau', 'Mongolia',
  'Bangladesh', 'Bhutan', 'India', 'Maldives', 'Nepal', 'Pakistan', 'Sri Lanka',
  'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines',
  'Singapore', 'Thailand', 'Timor-Leste', 'Vietnam',
];
const zone3Countries = [
  // Oceania
  'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu',
  // Canada & Mexico
  'Canada', 'Mexico',
  // Middle East
  'Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Oman',
  'Qatar', 'Saudi Arabia', 'Syria', 'UAE', 'United Arab Emirates', 'Yemen',
  // Europe
  'Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium',
  'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Gibraltar', 'Greece',
  'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kazakhstan', 'Kosovo', 'Kyrgyzstan',
  'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco',
  'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal',
  'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
  'Sweden', 'Switzerland', 'Tajikistan', 'Turkey', 'Turkmenistan', 'Ukraine',
  'United Kingdom', 'Great Britain', 'UK', 'Uzbekistan', 'Vatican',
];
const zone4Countries = [
  'United States', 'USA', 'US', 'Guam', 'Puerto Rico', 'American Samoa',
  'U.S. Virgin Islands', 'Northern Mariana Islands',
];
// Zone 5: everything else (Central/South America excl. Mexico, Africa)

export function getEMSZone(country: string): 1 | 2 | 3 | 4 | 5 {
  const c = country?.trim();
  if (!c) return 3; // default
  if (zone1Countries.some(z => c.toLowerCase().includes(z.toLowerCase()))) return 1;
  if (zone2Countries.some(z => c.toLowerCase().includes(z.toLowerCase()))) return 2;
  if (zone3Countries.some(z => c.toLowerCase().includes(z.toLowerCase()))) return 3;
  if (zone4Countries.some(z => c.toLowerCase().includes(z.toLowerCase()))) return 4;
  return 5;
}

export function calculateEMSCost(weightKg: number, zone: 1 | 2 | 3 | 4 | 5): number {
  const rate = emsRates.find(r => r.weight >= weightKg);
  if (!rate) return emsRates[emsRates.length - 1][`zone${zone}` as keyof EMSRate] as number;
  return rate[`zone${zone}` as keyof EMSRate] as number;
}

export function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 6000;
}

export function getChargeableWeight(actualWeight: number, length: number, width: number, height: number): number {
  const volumetricWeight = calculateVolumetricWeight(length, width, height);
  return Math.max(actualWeight, volumetricWeight);
}

export const zoneDescriptions: Record<number, string> = {
  1: 'Zone 1 — China, South Korea, Taiwan',
  2: 'Zone 2 — Asia (excl. China, South Korea, Taiwan)',
  3: 'Zone 3 — Oceania, Canada, Mexico, Middle East, Europe',
  4: 'Zone 4 — United States (incl. Guam)',
  5: 'Zone 5 — Central/South America (excl. Mexico), Africa',
};
