import { NextApiRequest, NextApiResponse } from 'next';

// Простой кэш для результатов
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, country, state } = req.query;

  if (!query || typeof query !== 'string' || query.length < 3) {
    return res.status(400).json({ error: 'Query must be at least 3 characters' });
  }

  // Проверяем кэш (учитываем страну и штат в ключе)
  const cacheKey = `${query}|${country || ''}|${state || ''}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.status(200).json(cached.data);
  }

  try {
    // Формируем поисковый запрос с учетом штата и страны
    let searchQuery = query;
    if (state && typeof state === 'string') {
      searchQuery += `, ${state}`;
    }
    if (country && typeof country === 'string') {
      searchQuery += `, ${country}`;
    }

    // Определяем код страны для фильтрации
    let countryCode = '';
    if (country && typeof country === 'string') {
      const countryLower = country.toLowerCase();
      if (countryLower.includes('united states') || countryLower.includes('usa') || countryLower === 'us') {
        countryCode = 'us';
      } else if (countryLower.includes('canada')) {
        countryCode = 'ca';
      } else if (countryLower.includes('mexico')) {
        countryCode = 'mx';
      } else if (countryLower.includes('japan')) {
        countryCode = 'jp';
      } else if (countryLower.includes('united kingdom') || countryLower.includes('uk')) {
        countryCode = 'gb';
      }
      // Добавьте другие страны по необходимости
    }

    // Список поддерживаемых стран (если страна не указана)
    const countryCodes = countryCode || 'us,ca,mx,br,ar,cl,co,pe,gb,de,fr,it,es,nl,be,ch,at,pl,se,no,dk,fi,ie,pt,cz,ro,gr,hu,ru,ua,tr,eg,za,ng,ke,ma,au,nz,jp,cn,kr,tw,hk,sg,my,th,ph,id,vn,in,pk,bd,ae,sa,il,kw,qa';

    // Используем Nominatim API для поиска ТОЛЬКО городов
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 секунд таймаут

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(searchQuery)}&` + // Используем общий поиск
      `format=json&` +
      `addressdetails=1&` +
      `limit=30&` + // Увеличили до 30 результатов для лучшего покрытия
      `countrycodes=${countryCodes}`,
      {
        headers: {
          'User-Agent': 'JapanExpress/1.0',
          'Accept-Language': 'en'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return res.status(200).json({ suggestions: [] });
    }

    const data = await response.json();

    // Проверяем что data это массив
    if (!Array.isArray(data)) {
      console.error('Unexpected API response format');
      return res.status(200).json({ suggestions: [] });
    }

    // Фильтруем только города (исключаем улицы, здания и т.д.)
    const cities = data.filter((item: any) => {
      // Проверяем что это населенный пункт (город, деревня и т.д.)
      const hasCity = item.address.city || item.address.town || item.address.village || item.address.municipality || item.address.hamlet;

      // Или это место с типом административной границы (для городов)
      const isCityType = item.type === 'city' ||
                         item.type === 'town' ||
                         item.type === 'village' ||
                         item.type === 'municipality' ||
                         item.type === 'administrative' ||
                         item.class === 'place';

      // Исключаем улицы и здания
      const isNotStreet = !item.address.road && !item.address.house_number;

      // Если штат указан, проверяем соответствие (более мягкая проверка)
      let matchesState = true;
      if (state && typeof state === 'string' && item.address.state) {
        const itemState = item.address.state.toLowerCase();
        const searchState = state.toLowerCase();
        // Проверяем частичное совпадение в обе стороны
        matchesState = itemState.includes(searchState) || searchState.includes(itemState);
      }

      return (hasCity || isCityType) && isNotStreet && matchesState;
    });

    // Форматируем результаты
    const suggestions = cities.map((item: any) => {
      // Извлекаем название города из разных возможных полей
      const cityName = item.address.city ||
                       item.address.town ||
                       item.address.village ||
                       item.address.municipality ||
                       item.address.hamlet ||
                       item.name || // Используем имя из основного объекта
                       '';

      return {
        display_name: item.display_name,
        address: {
          road: '',
          house_number: '',
          city: cityName,
          state: item.address.state || item.address.county || '',
          postcode: item.address.postcode || '',
          country: item.address.country || ''
        },
        lat: item.lat,
        lon: item.lon
      };
    });

    const result = { suggestions };

    // Сохраняем в кэш
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Очищаем старые записи из кэша (простая чистка)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    res.status(200).json(result);

  } catch (error: any) {
    // Обрабатываем таймаут
    if (error.name === 'AbortError') {
      console.error('Address search timeout');
      return res.status(200).json({ suggestions: [] });
    }

    console.error('Address autocomplete error:', error.message);
    res.status(200).json({ suggestions: [] });
  }
}
