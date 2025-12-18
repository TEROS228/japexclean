import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

// Конвертация кода штата в полное название (для сохранения в БД)
function normalizeStateName(state: string, country: string): string {
  // Только для США
  if (!country.toLowerCase().includes('united states') && country.toLowerCase() !== 'us' && country.toLowerCase() !== 'usa') {
    return state;
  }

  const stateMap: { [key: string]: string } = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  const stateTrimmed = state.trim().toUpperCase();

  // Если это 2-буквенный код, конвертируем в полное название
  if (stateTrimmed.length === 2 && stateMap[stateTrimmed]) {
    return stateMap[stateTrimmed];
  }

  // Уже полное название - возвращаем как есть
  return state;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Отключаем кеширование
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // Находим пользователя в БД
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      // Получаем адреса из БД
      const addresses = await prisma.address.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ addresses, hasAddress: addresses.length > 0 });
    } else if (req.method === 'POST') {
      // Создаем или обновляем адрес
      const { id, name, address, apartment, city, state, postalCode, country, phoneNumber, isCommercial, ssnNumber, taxIdType, taxIdNumber, companyName } = req.body;

      // Нормализуем state (конвертируем код в полное название для читабельности)
      const normalizedState = normalizeStateName(state, country);

      let savedAddress;

      if (id) {
        // Обновляем существующий адрес
        savedAddress = await prisma.address.update({
          where: {
            id,
            userId: dbUser.id
          },
          data: {
            name,
            address,
            apartment,
            city,
            state: normalizedState,
            postalCode,
            country,
            phoneNumber,
            isCommercial: isCommercial || false,
            ssnNumber: ssnNumber || null,
            taxIdType: taxIdType || null,
            taxIdNumber: taxIdNumber || null,
            companyName: companyName || null
          }
        });
      } else {
        // Проверяем лимит адресов (максимум 3)
        const existingAddresses = await prisma.address.count({
          where: { userId: dbUser.id }
        });

        if (existingAddresses >= 3) {
          return res.status(400).json({ error: 'Maximum 3 addresses allowed' });
        }

        // Создаем новый адрес
        savedAddress = await prisma.address.create({
          data: {
            userId: dbUser.id,
            name,
            address,
            apartment,
            city,
            state: normalizedState,
            postalCode,
            country,
            phoneNumber,
            isCommercial: isCommercial || false,
            ssnNumber: ssnNumber || null,
            taxIdType: taxIdType || null,
            taxIdNumber: taxIdNumber || null,
            companyName: companyName || null
          }
        });
      }

      res.status(200).json({ address: savedAddress, isUpdate: !!id });
    } else if (req.method === 'DELETE') {
      // Удаляем адрес
      const { id } = req.body;

      await prisma.address.delete({
        where: {
          id,
          userId: dbUser.id
        }
      });

      res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling address:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
