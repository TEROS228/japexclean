// FedEx API Integration for shipping rate calculation
// Docs: https://developer.fedex.com/api/en-us/catalog/rate/v1/docs.html

interface FedExRateRequest {
  weight: number; // in kg
  fromCountry: string; // "JP"
  toCountry: string; // "US"
  toCity: string;
  toState?: string; // Optional - only required for US/CA
  toPostalCode: string;
  isCommercial?: boolean; // Is delivery address commercial/business (affects residential surcharge)
  itemValueJPY?: number; // Стоимость товара в иенах (для таможни)
  itemDescription?: string; // Описание товара
}

interface FedExRateResponse {
  success: boolean;
  rate?: number; // в иенах
  service?: string; // "FEDEX_INTERNATIONAL_PRIORITY" или "FEDEX_INTERNATIONAL_ECONOMY"
  deliveryDays?: number;
  error?: string;
}

interface FedExServiceOption {
  serviceType: string; // "INTERNATIONAL_PRIORITY", "INTERNATIONAL_ECONOMY", etc.
  serviceName: string; // "International Priority®", "International Economy®"
  rateUSD: number;
  rateJPY: number;
  deliveryDays?: number;
  estimatedDeliveryDate?: string; // ISO date string "2025-12-04"
  deliveryTime?: string; // Time string "09:30:00" or "21:00:00"
  deliveryEstimate?: string; // Text estimate "2-7 business days"
  priceNote?: string; // Note about pricing "Official FedEx retail rate"
}

interface FedExAllRatesResponse {
  success: boolean;
  options?: FedExServiceOption[];
  error?: string;
}

// Конвертация кг в фунты (FedEx использует фунты)
function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

// Глобальный кеш курса валют (чтобы не запрашивать каждый раз)
let exchangeRateCache: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 час

// Получить актуальный курс USD/JPY
async function getExchangeRate(): Promise<number> {
  // Проверяем кеш
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }

  try {
    // Используем бесплатный API для получения актуального курса
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const rate = data.rates?.JPY || 150; // Fallback на 150 если API не работает

    // Сохраняем в кеш
    exchangeRateCache = { rate, timestamp: Date.now() };

    return rate;
  } catch (error) {
        return 150; // Fallback курс
  }
}

// Конвертация USD в JPY (реальный курс через API)
async function convertUsdToJpy(usd: number): Promise<number> {
  const rate = await getExchangeRate();
  return Math.round(usd * rate);
}

// Конвертация JPY в USD (реальный курс через API)
async function convertJpyToUsd(jpy: number): Promise<number> {
  const rate = await getExchangeRate();
  return Math.round(jpy / rate);
}

/**
 * Получить токен доступа FedEx OAuth
 */
async function getFedExAccessToken(): Promise<string | null> {
  const apiKey = process.env.FEDEX_API_KEY;
  const secretKey = process.env.FEDEX_SECRET_KEY;

      
  if (!apiKey || !secretKey) {
    console.error('❌ FedEx API credentials not configured in environment variables');
    console.error('   Please add FEDEX_API_KEY and FEDEX_SECRET_KEY to your .env file');
    return null;
  }

  try {
    const response = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: secretKey
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ FedEx auth failed with status:', response.status);
      console.error('   Response:', errorText);
      return null;
    }

    const data = await response.json();
        return data.access_token;
  } catch (error) {
    console.error('❌ Error getting FedEx token:', error);
    return null;
  }
}

/**
 * Рассчитать стоимость доставки через FedEx Rates and Transit Times API v1
 * Docs: https://developer.fedex.com/api/en-us/catalog/rate/v1/docs.html
 */
export async function calculateFedExRate(request: FedExRateRequest): Promise<FedExRateResponse> {
  try {
    // Получаем токен доступа
    const accessToken = await getFedExAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with FedEx API'
      };
    }

    // Подготавливаем запрос к FedEx Rate API v1
    const weightLbs = kgToLbs(request.weight);
    const dimensions = estimatePackageDimensions(request.weight);

    const rateRequest = {
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER || ''
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: '105-0011', // Tokyo postal code (from warehouse)
            countryCode: 'JP',
            city: 'Tokyo',
            stateOrProvinceCode: ''
          }
        },
        recipient: {
          address: {
            postalCode: request.toPostalCode,
            countryCode: request.toCountry,
            city: request.toCity,
            stateOrProvinceCode: request.toState || ''
          }
        },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: 'INTERNATIONAL_PRIORITY', // Можно использовать INTERNATIONAL_ECONOMY для более дешевой доставки
        rateRequestType: ['ACCOUNT', 'LIST'], // Получаем и account rates и list rates
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: Math.max(0.1, weightLbs) // Минимум 0.1 фунта
            },
            dimensions: {
              length: Math.max(1, Math.round(dimensions.length / 2.54)), // cm to inches, минимум 1
              width: Math.max(1, Math.round(dimensions.width / 2.54)),
              height: Math.max(1, Math.round(dimensions.height / 2.54)),
              units: 'IN'
            }
          }
        ],
        shipDateStamp: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        packagingType: 'YOUR_PACKAGING' // Упаковка клиента
      }
    };

    const response = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-locale': 'en_US'
      },
      body: JSON.stringify(rateRequest)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('FedEx rate request failed:', responseText);

      // Попробуем распарсить ошибку
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.errors?.[0]?.message || 'Failed to get rates from FedEx';
        return {
          success: false,
          error: errorMessage
        };
      } catch (e) {
        return {
          success: false,
          error: 'Failed to get rates from FedEx'
        };
      }
    }

    const data = JSON.parse(responseText);

    // Извлекаем самый дешевый вариант доставки
    if (!data.output?.rateReplyDetails || data.output.rateReplyDetails.length === 0) {
      return {
        success: false,
        error: 'No rates available for this route'
      };
    }

    // Находим самую дешевую услугу (приоритет: ACCOUNT rate > LIST rate)
    let cheapestRate = Infinity;
    let selectedService = '';
    let deliveryDays = 0;

    for (const rateDetail of data.output.rateReplyDetails) {
      // Ищем account rate сначала (с volume discount), потом list rate
      const ratedShipment = rateDetail.ratedShipmentDetails?.find((d: any) => d.rateType === 'ACCOUNT') ||
                           rateDetail.ratedShipmentDetails?.find((d: any) => d.rateType === 'LIST');

      if (ratedShipment?.totalNetCharge) {
        const rate = parseFloat(ratedShipment.totalNetCharge);
        if (rate < cheapestRate) {
          cheapestRate = rate;
          selectedService = rateDetail.serviceName || rateDetail.serviceType;

          // Получаем transit time из commit или operationalDetail
          if (rateDetail.commit?.dateDetail?.dayFormat) {
            deliveryDays = parseInt(rateDetail.commit.dateDetail.dayFormat) || 0;
          } else if (rateDetail.operationalDetail?.transitTime) {
            deliveryDays = parseInt(rateDetail.operationalDetail.transitTime.replace(/\D/g, '')) || 0;
          }
        }
      }
    }

    if (cheapestRate === Infinity) {
      return {
        success: false,
        error: 'Could not determine shipping cost'
      };
    }

    // Конвертируем USD в JPY
    const rateInJpy = await convertUsdToJpy(cheapestRate);

    
    return {
      success: true,
      rate: rateInJpy,
      service: selectedService,
      deliveryDays
    };

  } catch (error) {
    console.error('❌ Error calculating FedEx rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Вспомогательная функция: оценить размеры посылки если не указаны
 */
export function estimatePackageDimensions(weight: number): { length: number; width: number; height: number } {
  // Простая эвристика на основе веса
  if (weight <= 0.5) {
    return { length: 20, width: 15, height: 5 }; // Маленькая коробка
  } else if (weight <= 2) {
    return { length: 30, width: 25, height: 10 }; // Средняя коробка
  } else if (weight <= 5) {
    return { length: 40, width: 30, height: 20 }; // Большая коробка
  } else {
    return { length: 50, width: 40, height: 30 }; // Очень большая коробка
  }
}

/**
 * Получить ТОЧНЫЕ цены через FedEx Ship API (без создания shipment)
 */
export async function getExactFedExRates(request: FedExRateRequest): Promise<FedExAllRatesResponse> {
  try {
    const accessToken = await getFedExAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with FedEx API'
      };
    }

    const weightLbs = kgToLbs(request.weight);
    const dimensions = estimatePackageDimensions(request.weight);

    // Ship API запрос для получения точных цен
    const shipRequest = {
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER || ''
      },
      requestedShipment: {
        shipper: {
          contact: {
            personName: 'Warehouse',
            phoneNumber: '0312345678'
          },
          address: {
            postalCode: '105-0011',
            countryCode: 'JP',
            city: 'Tokyo'
          }
        },
        recipients: [{
          contact: {
            personName: 'Customer',
            phoneNumber: '1234567890'
          },
          address: {
            postalCode: request.toPostalCode,
            countryCode: request.toCountry,
            city: request.toCity,
            stateOrProvinceCode: request.toState || '',
            residential: true
          }
        }],
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: 'FEDEX_INTERNATIONAL_PRIORITY', // Будем менять для разных сервисов
        packagingType: 'YOUR_PACKAGING',
        shipDateStamp: new Date().toISOString().split('T')[0],
        totalWeight: weightLbs,
        preferredCurrency: 'JPY',
        shipmentSpecialServices: {
          returnShipmentDetail: {
            returnType: 'PRINT_RETURN_LABEL'
          }
        },
        requestedPackageLineItems: [{
          weight: {
            units: 'LB',
            value: Math.max(0.1, weightLbs)
          },
          dimensions: {
            length: Math.max(1, Math.round(dimensions.length / 2.54)),
            width: Math.max(1, Math.round(dimensions.width / 2.54)),
            height: Math.max(1, Math.round(dimensions.height / 2.54)),
            units: 'IN'
          }
        }],
        labelSpecification: {
          labelStockType: 'PAPER_4X6'
        },
        shippingChargesPayment: {
          paymentType: 'SENDER'
        }
      },
      labelResponseOptions: 'URL_ONLY',
      shipAction: 'RETURN_SHIPMENT_INFORMATION' // НЕ создаем shipment, только получаем цены
    };

    const serviceTypes = [
      'FEDEX_INTERNATIONAL_CONNECT_PLUS',
      'INTERNATIONAL_ECONOMY',
      'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS',
      'INTERNATIONAL_FIRST'
    ];

    const options: FedExServiceOption[] = [];

    for (const serviceType of serviceTypes) {
      const requestCopy = JSON.parse(JSON.stringify(shipRequest));
      requestCopy.requestedShipment.serviceType = serviceType;

      try {
        const response = await fetch('https://apis.fedex.com/ship/v1/shipments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-locale': 'en_US'
          },
          body: JSON.stringify(requestCopy)
        });

        if (!response.ok) {
                    continue;
        }

        const data = await response.json();

        if (data.output?.transactionShipments?.[0]?.shipmentDocuments) {
          const shipment = data.output.transactionShipments[0];
          const pieceResponses = shipment.pieceResponses?.[0];

          if (pieceResponses?.netCharge) {
            const totalCharge = parseFloat(pieceResponses.netCharge);
            const currency = pieceResponses.currency || 'JPY';

            let rateJPY: number;
            let rateUSD: number;

            if (currency === 'JPY') {
              rateJPY = Math.round(totalCharge);
              const exchangeRate = await getExchangeRate();
              rateUSD = totalCharge / exchangeRate; // Реальный курс
            } else {
              rateUSD = totalCharge;
              rateJPY = await convertUsdToJpy(rateUSD);
            }

            options.push({
              serviceType: serviceType,
              serviceName: serviceType.replace(/_/g, ' '),
              rateUSD,
              rateJPY,
              deliveryDays: undefined
            });
          }
        }
      } catch (error) {
                continue;
      }
    }

    if (options.length === 0) {
      return {
        success: false,
        error: 'No FedEx services available'
      };
    }

    options.sort((a, b) => a.rateJPY - b.rateJPY);

    return {
      success: true,
      options
    };

  } catch (error) {
    console.error('❌ Error getting exact FedEx rates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Получить ВСЕ доступные варианты доставки FedEx (Priority, Economy, и т.д.)
 * @deprecated Используйте getExactFedExRates для точных цен
 */
export async function getAllFedExRates(request: FedExRateRequest): Promise<FedExAllRatesResponse> {
  try {
    // Получаем токен доступа
    const accessToken = await getFedExAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with FedEx API'
      };
    }

    // Список основных международных сервисов FedEx
    const serviceTypes = [
      'FEDEX_INTERNATIONAL_CONNECT_PLUS',
      'INTERNATIONAL_ECONOMY',
      'FEDEX_INTERNATIONAL_PRIORITY',  // Изменено с INTERNATIONAL_PRIORITY
      'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS',
      'INTERNATIONAL_FIRST'
    ];

    const weightLbs = kgToLbs(request.weight);

    // Конвертируем стоимость товара из JPY в USD для таможни (реальный курс)
    const itemValueUSD = request.itemValueJPY ? await convertJpyToUsd(request.itemValueJPY) : 100;
    const itemDescription = request.itemDescription || 'General Merchandise';

    const options: FedExServiceOption[] = [];
    const errors: string[] = []; // Собираем ошибки для анализа

    
    // Запрашиваем расценки для каждого сервиса
    for (const serviceType of serviceTypes) {
      
      const packageLineItem = {
        weight: {
          units: 'LB',
          value: Math.max(0.1, weightLbs)
        }
      };

      const rateRequest = {
        accountNumber: {
          value: process.env.FEDEX_ACCOUNT_NUMBER || ''
        },
        requestedShipment: {
          shipper: {
            contact: {
              personName: 'Warehouse',
              phoneNumber: '0312345678',
              companyName: 'Japrix Warehouse'
            },
            address: {
              postalCode: '105-0011',
              countryCode: 'JP',
              city: 'Tokyo',
              stateOrProvinceCode: '',
              residential: false // Warehouse - commercial address
            }
          },
          recipient: {
            contact: {
              personName: 'Customer',
              phoneNumber: '1234567890'
            },
            address: {
              postalCode: request.toPostalCode,
              countryCode: request.toCountry,
              city: request.toCity,
              stateOrProvinceCode: request.toState || '',
              residential: !request.isCommercial // If isCommercial=true, residential=false
            }
          },
          pickupType: 'USE_SCHEDULED_PICKUP', // Regular scheduled pickup
          serviceType: serviceType,
          rateRequestType: ['LIST', 'ACCOUNT'], // Получаем оба типа цен
          returnTransitAndCommit: true, // ВАЖНО: Запрашиваем информацию о времени доставки и commit dates
          shippingChargesPayment: {
            paymentType: 'SENDER',
            payor: {
              responsibleParty: {
                accountNumber: {
                  value: process.env.FEDEX_ACCOUNT_NUMBER || ''
                },
                address: {
                  countryCode: 'JP'
                }
              }
            }
          },
          customsClearanceDetail: {
            dutiesPayment: {
              paymentType: 'SENDER',
              payor: {
                responsibleParty: {
                  accountNumber: {
                    value: process.env.FEDEX_ACCOUNT_NUMBER || ''
                  },
                  address: {
                    countryCode: 'JP'
                  }
                }
              }
            },
            commodities: [
              {
                description: itemDescription.substring(0, 35), // Максимум 35 символов
                quantity: 1,
                quantityUnits: 'PCS',
                weight: {
                  units: 'LB',
                  value: Math.max(0.1, weightLbs)
                },
                customsValue: {
                  amount: itemValueUSD, // Реальная стоимость товара в USD
                  currency: 'USD'
                }
              }
            ]
          },
          requestedPackageLineItems: [packageLineItem],
          shipDateStamp: new Date().toISOString().split('T')[0],
          packagingType: 'YOUR_PACKAGING',
          preferredCurrency: 'JPY' // Запрашиваем цены в иенах
        }
      };

      try {
        const response = await fetch('https://apis.fedex.com/rate/v1/rates/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-locale': 'en_US'
          },
          body: JSON.stringify(rateRequest)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ ${serviceType} failed with status ${response.status}`);
          console.error(`      Response: ${errorText.substring(0, 200)}`);

          // Пытаемся распарсить ошибку для анализа
          try {
            const errorData = JSON.parse(errorText);
            const errorMessage = errorData.errors?.[0]?.message || '';
            errors.push(errorMessage);
          } catch (e) {
            // Игнорируем ошибки парсинга
          }

          continue;
        }

        const data = await response.json();

        if (data.output?.rateReplyDetails && data.output.rateReplyDetails.length > 0) {
          const rateDetail = data.output.rateReplyDetails[0];
          const listRate = rateDetail.ratedShipmentDetails?.find((d: any) => d.rateType === 'LIST');

          if (listRate?.totalNetCharge) {
            const totalCharge = parseFloat(listRate.totalNetCharge);
            const currency = listRate.currency || 'USD';

            let rateJPY: number;
            let rateUSD: number;

            if (currency === 'JPY') {
              rateJPY = Math.round(totalCharge);
              const exchangeRate = await getExchangeRate();
              rateUSD = rateJPY / exchangeRate;
            } else {
              rateUSD = totalCharge;
              rateJPY = await convertUsdToJpy(rateUSD);
            }

            let deliveryDays: number | undefined;
            let estimatedDeliveryDate: string | undefined;
            let deliveryTime: string | undefined;
            let deliveryEstimate: string | undefined;

            // Извлекаем дату и время доставки из commit
            if (rateDetail.commit?.dateDetail) {
              // dayFormat может быть "2025-12-04" или "Thu, Dec 4"
              const dayFormat = rateDetail.commit.dateDetail.dayFormat;
              if (dayFormat) {
                // Пробуем парсить как ISO дату
                if (dayFormat.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  estimatedDeliveryDate = dayFormat;
                } else {
                  // Иначе это уже formatted date
                  estimatedDeliveryDate = dayFormat;
                }
                              }

              // timeFormat может быть "09:30:00" или "9:30 AM"
              if (rateDetail.commit.timeDetail?.timeFormat) {
                deliveryTime = rateDetail.commit.timeDetail.timeFormat;
                              }
            }

            // Fallback: пробуем посчитать дни доставки из operationalDetail
            if (rateDetail.operationalDetail?.transitTime) {
              const transitDays = parseInt(rateDetail.operationalDetail.transitTime.replace(/\D/g, ''));
              if (!isNaN(transitDays)) {
                deliveryDays = transitDays;

                // Если нет estimatedDeliveryDate, рассчитаем её сами
                if (!estimatedDeliveryDate) {
                  const shipDate = new Date(rateRequest.requestedShipment.shipDateStamp);
                  const deliveryDate = new Date(shipDate);
                  deliveryDate.setDate(deliveryDate.getDate() + transitDays);
                  estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];
                }
              }
            }

            // Final fallback: используем статические оценки времени доставки для FedEx сервисов
            // (FedEx Rate API не всегда возвращает transit times для международных отправлений)
            // Данные основаны на реальных оценках FedEx для маршрута JP -> US
            if (!deliveryDays && !estimatedDeliveryDate) {
              const serviceEstimates: { [key: string]: { days: number; time: string } } = {
                'INTERNATIONAL_FIRST': { days: 1, time: '09:30:00' }, // Next day by 9:30 AM
                'FEDEX_INTERNATIONAL_PRIORITY_EXPRESS': { days: 1, time: '13:30:00' }, // Next day by 1:30 PM
                'FEDEX_INTERNATIONAL_PRIORITY': { days: 1, time: '20:00:00' }, // Next day by 8:00 PM
                'FEDEX_INTERNATIONAL_CONNECT_PLUS': { days: 2, time: '22:00:00' }, // 2 days by 10:00 PM
                'INTERNATIONAL_ECONOMY': { days: 6, time: '20:00:00' } // 6 days by 8:00 PM
              };

              const estimate = serviceEstimates[serviceType];
              if (estimate) {
                deliveryDays = estimate.days;
                deliveryTime = estimate.time;
                deliveryEstimate = estimate.days === 1
                  ? '1 business day'
                  : `${estimate.days} business days`;

                // Рассчитываем дату доставки
                const shipDate = new Date(rateRequest.requestedShipment.shipDateStamp);
                const deliveryDate = new Date(shipDate);
                deliveryDate.setDate(deliveryDate.getDate() + estimate.days);
                estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];
              }
            }

            const option = {
              serviceType: rateDetail.serviceType || serviceType,
              serviceName: rateDetail.serviceName || serviceType.replace(/_/g, ' '),
              rateUSD,
              rateJPY,
              deliveryDays,
              estimatedDeliveryDate,
              deliveryTime,
              deliveryEstimate,
              priceNote: 'Official FedEx rate (includes all fees)'
            };

            options.push(option);
          }
        }
      } catch (error) {
        console.error(`   ❌ ${serviceType} exception:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    if (options.length === 0) {
      console.error('❌ No FedEx services available - all services failed');

      // Проверяем, связаны ли ошибки с адресом/postal code
      const hasAddressError = errors.some(err =>
        err.toLowerCase().includes('postal') ||
        err.toLowerCase().includes('zip') ||
        err.toLowerCase().includes('address') ||
        err.toLowerCase().includes('invalid destination') ||
        err.toLowerCase().includes('recipient')
      );

      if (hasAddressError) {
        return {
          success: false,
          error: 'Unable to calculate shipping rates. Please verify that your postal/ZIP code is correct and matches your city and state. If the issue persists, contact support.'
        };
      }

      return {
        success: false,
        error: 'No FedEx services available for this route. Please verify your shipping address or contact support.'
      };
    }

    options.sort((a, b) => a.rateJPY - b.rateJPY);

    return {
      success: true,
      options
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
