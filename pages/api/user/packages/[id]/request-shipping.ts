import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';
import { sendTelegramNotification } from '../../../../../lib/telegram';
import { calculateStorageInfo } from '../../../../../lib/storage-calculator';
import { getAllFedExRates } from '../../../../../lib/fedex';

// Конвертация названия страны в 2-буквенный ISO код
function getCountryCode(countryName: string): string | null {
  if (!countryName) return null;

  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'USA': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Iceland': 'IS',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Slovakia': 'SK',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Serbia': 'RS',
    'Croatia': 'HR',
    'Moldova': 'MD',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Ireland': 'IE',
    'New Zealand': 'NZ',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'South Korea': 'KR',
    'Korea': 'KR',
    'Taiwan': 'TW',
    'Thailand': 'TH',
    'Malaysia': 'MY',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'Vietnam': 'VN',
    'India': 'IN',
    'China': 'CN',
    'Mexico': 'MX',
    'Brazil': 'BR',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Peru': 'PE',
    'South Africa': 'ZA',
    'United Arab Emirates': 'AE',
    'UAE': 'AE',
    'Saudi Arabia': 'SA',
    'Israel': 'IL',
    'Turkey': 'TR',
    'Georgia': 'GE',
    'Russia': 'RU'
  };

  const countryTrimmed = countryName.trim();

  // Если уже 2-буквенный код
  const countryUpper = countryTrimmed.toUpperCase();
  if (countryTrimmed.length === 2 && Object.values(countryMap).includes(countryUpper)) {
    return countryUpper;
  }

  // Конвертировать название в код (case-insensitive поиск)
  const normalizedName = Object.keys(countryMap).find(
    key => key.toLowerCase() === countryTrimmed.toLowerCase()
  );

  return normalizedName ? countryMap[normalizedName] : countryUpper.substring(0, 2);
}

// Конвертация названия штата в 2-буквенный код
function convertStateNameToCode(stateName: string): string | null {
  if (!stateName) return null;

  const stateMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };

  const stateTrimmed = stateName.trim();

  // Если уже 2-буквенный код (с учетом регистра)
  const stateUpper = stateTrimmed.toUpperCase();
  if (stateTrimmed.length === 2 && Object.values(stateMap).includes(stateUpper)) {
    return stateUpper;
  }

  // Конвертировать название в код (case-insensitive поиск)
  const normalizedName = Object.keys(stateMap).find(
    key => key.toLowerCase() === stateTrimmed.toLowerCase()
  );

  return normalizedName ? stateMap[normalizedName] : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Отключаем кеширование
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Получаем shippingAddressId и selectedService из тела запроса (если есть)
    const { shippingAddressId, selectedService } = req.body;

    // Получаем адрес пользователя
    let userAddress;
    if (shippingAddressId) {
      // Если указан конкретный адрес, загружаем его и проверяем принадлежность
      userAddress = await prisma.address.findUnique({
        where: { id: shippingAddressId }
      });

      if (!userAddress || userAddress.userId !== dbUser.id) {
        console.log('[ERROR] Invalid shipping address:', shippingAddressId);
        return res.status(403).json({ error: 'Invalid shipping address' });
      }
      console.log('[OK] Using selected address:', userAddress.id, userAddress.country);
    } else {
      // Если адрес не указан, берем первый доступный
      userAddress = await prisma.address.findFirst({
        where: { userId: dbUser.id }
      });

      if (!userAddress) {
        console.log('[ERROR] No addresses found for user:', dbUser.id);
        return res.status(400).json({ error: 'Please add a shipping address first' });
      }
      console.log('[OK] Using first available address:', userAddress.id, userAddress.country);
    }

    // Получаем посылку
    console.log('Looking for package with id:', id, 'for user:', dbUser.id);

    const pkg = await prisma.package.findUnique({
      where: {
        id: id as string,
        userId: dbUser.id
      },
      include: {
        orderItem: true
      }
    });

    if (!pkg) {
      console.log('Package not found');
      return res.status(404).json({ error: 'Package not found' });
    }

    console.log('Package found:', pkg.id, 'shippingCost:', pkg.shippingCost, 'status:', pkg.status);

    // Проверяем оплату domestic shipping
    if (pkg.domesticShippingCost > 0 && !pkg.domesticShippingPaid) {
      console.log('[ERROR] Domestic shipping not paid for package:', pkg.id);
      return res.status(400).json({ error: 'Please pay domestic shipping fee before requesting shipping' });
    }

    // Проверяем что посылка готова к отправке
    if (pkg.status !== 'ready' && pkg.status !== 'pending_shipping') {
      console.log('[ERROR] Package status invalid:', pkg.id, pkg.status);
      return res.status(400).json({ error: 'Package is not ready for shipping' });
    }

    // Проверяем что нет активных сервисов в обработке
    if (pkg.photoService && pkg.photoServiceStatus === 'pending') {
      console.log('[ERROR] Photo service pending for package:', pkg.id);
      return res.status(400).json({ error: 'Photo service is still processing. Please wait.' });
    }

    if (pkg.consolidation) {
      console.log('[ERROR] Consolidation in progress for package:', pkg.id);
      return res.status(400).json({ error: 'Package consolidation is in progress. Please wait.' });
    }

    // Проверяем хранение
    const storageInfo = calculateStorageInfo(pkg.arrivedAt, pkg.lastStoragePayment);

    // Если срок хранения истек (10 дней без оплаты) - нельзя отправить
    if (storageInfo.isExpired) {
      console.log('[ERROR] Storage expired for package:', pkg.id);
      return res.status(400).json({ error: 'Storage period expired (10 days without payment). This package has been marked for disposal.' });
    }

    // Если есть неоплаченные дни хранения - требуем оплату
    if (storageInfo.unpaidDays > 0) {
      console.log('[ERROR] Storage fees unpaid:', pkg.id, 'Days:', storageInfo.unpaidDays, 'Fee:', storageInfo.currentFee);
      return res.status(400).json({
        error: 'Please pay storage fees before requesting shipping',
        storageFee: storageInfo.currentFee,
        unpaidDays: storageInfo.unpaidDays,
        daysUntilDisposal: storageInfo.daysUntilDisposal
      });
    }

    // Вычисляем полную стоимость доставки (international + domestic)
    let internationalShippingCost = pkg.shippingCost || 0;

    // Для FedEx - автоматически рассчитываем стоимость через FedEx API
    if (pkg.shippingMethod === 'fedex') {
      console.log('📦 FedEx shipping detected for country:', userAddress.country);

      if (!pkg.weight || pkg.weight === 0) {
        console.log('[ERROR] Package weight missing for FedEx. Package:', pkg.id);
        return res.status(400).json({
          error: 'Package weight is required for FedEx shipping. Please contact support to set the package weight.'
        });
      }

      // Проверяем наличие postal code
      if (!userAddress.postalCode || userAddress.postalCode.trim() === '') {
        console.log('[ERROR] Postal code missing for address:', userAddress.id);
        return res.status(400).json({
          error: 'Postal code is required for FedEx shipping. Please update your address with a valid postal code.'
        });
      }

      // Форматируем postal code: убираем пробелы и лишние символы (FedEx требует без пробелов)
      const formattedPostalCode = userAddress.postalCode.replace(/\s+/g, '').toUpperCase();
      console.log('[OK] Postal code formatted:', userAddress.postalCode, '->', formattedPostalCode);

      // Получаем код страны (для FedEx нужен 2-буквенный ISO код)
      const countryCode = getCountryCode(userAddress.country);
      if (!countryCode) {
        console.log('[ERROR] Unable to determine country code:', userAddress.country);
        return res.status(400).json({
          error: `Unable to determine country code for: ${userAddress.country}. Please contact support.`
        });
      }

      console.log('[OK] Country code:', userAddress.country, '->', countryCode);

      // Для США конвертируем название штата в 2-буквенный код
      // Для других стран - не передаем state (FedEx не требует для большинства стран)
      let stateCode: string | undefined = undefined;
      if (countryCode === 'US') {
        const convertedState = convertStateNameToCode(userAddress.state);
        if (!convertedState) {
          console.log('[ERROR] Invalid US state:', userAddress.state);
          return res.status(400).json({
            error: `Invalid state: ${userAddress.state}. Please update your address with a valid US state.`
          });
        }
        stateCode = convertedState;
        console.log('[OK] State converted:', userAddress.state, '->', stateCode);
      } else if (countryCode === 'CA') {
        // Для Канады также можно передавать код провинции, если он короткий
        if (userAddress.state && userAddress.state.length <= 2) {
          stateCode = userAddress.state.toUpperCase();
        }
      }
      // Для всех остальных стран stateCode остается undefined

      // Всегда получаем свежие цены (НЕ сохраняем в БД)
      if (!selectedService) {
        console.log('[INFO] Fetching FedEx rates - Weight:', pkg.weight, 'To:', countryCode, userAddress.city, formattedPostalCode);
        const allRates = await getAllFedExRates({
          weight: pkg.weight,
          fromCountry: 'JP',
          toCountry: countryCode,
          toCity: userAddress.city,
          toState: stateCode, // undefined для не-US/CA стран
          toPostalCode: formattedPostalCode,
          isCommercial: userAddress.isCommercial || false,
          itemValueJPY: pkg.orderItem.price,
          itemDescription: pkg.orderItem.title
        });

        if (!allRates.success) {
          return res.status(500).json({
            error: allRates.error || 'Failed to calculate shipping cost. Please contact support.',
            fedexError: allRates.error
          });
        }

        return res.status(200).json({
          needsFedExSelection: true,
          fedexOptions: allRates.options,
          message: 'Please select a FedEx shipping service'
        });
      }

      // Если пользователь выбрал сервис - получаем свежую цену для этого сервиса
      if (selectedService) {
        console.log('[INFO] Fetching FedEx rates for service:', selectedService, 'Weight:', pkg.weight);
        const allRates = await getAllFedExRates({
          weight: pkg.weight,
          fromCountry: 'JP',
          toCountry: countryCode,
          toCity: userAddress.city,
          toState: stateCode,
          toPostalCode: formattedPostalCode,
          isCommercial: userAddress.isCommercial || false,
          itemValueJPY: pkg.orderItem.price,
          itemDescription: pkg.orderItem.title
        });

        if (!allRates.success || !allRates.options) {
          return res.status(500).json({
            error: allRates.error || 'Failed to get shipping rates. Please verify your shipping address or contact support.'
          });
        }

        const selectedOption = allRates.options.find((opt: any) => opt.serviceType === selectedService);

        if (!selectedOption) {
          console.log('[ERROR] Invalid FedEx service:', selectedService);
          return res.status(400).json({ error: 'Invalid FedEx service selected' });
        }

        internationalShippingCost = selectedOption.rateJPY;

        await prisma.package.update({
          where: { id: pkg.id },
          data: {
            shippingCost: internationalShippingCost,
            selectedFedexService: selectedService,
            notes: `${pkg.notes || ''}\n\n[FedEx ${selectedOption.serviceName}: ¥${internationalShippingCost}${selectedOption.deliveryDays ? `, ${selectedOption.deliveryDays} days` : ''}]`.trim()
          }
        });
      }
    }

    const totalShippingCost = internationalShippingCost + (pkg.domesticShippingCost || 0);

    // Проверяем баланс для оплаты доставки
    if (dbUser.balance < totalShippingCost) {
      console.log('[ERROR] Insufficient balance. User:', dbUser.id, 'Balance:', dbUser.balance, 'Required:', totalShippingCost);
      return res.status(400).json({ error: 'Insufficient balance for shipping' });
    }

    // Списываем стоимость доставки
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { balance: { decrement: totalShippingCost } }
    });

    // Создаем транзакцию
    await prisma.transaction.create({
      data: {
        userId: dbUser.id,
        amount: -totalShippingCost,
        type: 'shipping',
        status: 'completed',
        description: `Shipping cost for "${pkg.orderItem.title}"${pkg.domesticShippingCost > 0 ? ` (includes ¥${pkg.domesticShippingCost} domestic shipping)` : ''}`
      }
    });

    // Обновляем статус посылки и привязываем адрес доставки
    const updatedPackage = await prisma.package.update({
      where: { id: id as string },
      data: {
        shippingRequested: true,
        shippingRequestedAt: new Date(),
        shippingAddressId: userAddress.id
      },
      include: {
        orderItem: true
      }
    });

    // Создаем уведомление для всех админов
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true }
    });

    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'shipping_request',
          title: '📮 New Shipping Request',
          message: `${dbUser.email} requested shipping for "${pkg.orderItem.title}". Process and ship the package.`
        }
      });
    }

    // Уведомляем пользователя
    await prisma.notification.create({
      data: {
        userId: dbUser.id,
        type: 'shipping_requested',
        title: '📮 Shipping request received',
        message: `Your shipping request for "${pkg.orderItem.title}" has been received. We'll ship it soon!`
      }
    });

    // Отправляем уведомление в Telegram
    const telegramMessage = `
🚢 <b>NEW SHIPPING REQUEST</b>

👤 <b>User:</b> ${dbUser.email}
📦 <b>Package:</b> ${pkg.orderItem.title}
💰 <b>Total Shipping Cost:</b> ¥${totalShippingCost.toLocaleString()}${pkg.domesticShippingCost > 0 ? `\n   └ Domestic: ¥${pkg.domesticShippingCost.toLocaleString()}\n   └ International: ¥${(pkg.shippingCost || 0).toLocaleString()}` : ''}
⚖️ <b>Weight:</b> ${pkg.weight || 'N/A'} kg

<i>Please process and ship this package.</i>
    `.trim();

    await sendTelegramNotification(telegramMessage);

    res.status(200).json({
      success: true,
      message: 'Shipping request sent successfully',
      package: updatedPackage
    });

  } catch (error: any) {
    console.error('Error requesting shipping:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
