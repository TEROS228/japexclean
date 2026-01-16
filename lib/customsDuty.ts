// Расчет таможенной пошлины для разных стран (обновлено 2025-2026)

interface CustomsDutyResult {
  dutyAmount: number; // сумма пошлины в JPY
  dutyRate: number; // процентная ставка
  taxFreeThreshold: number; // порог беспошлинного ввоза в JPY
  isTaxFree: boolean; // освобожден ли от пошлины
  description: string; // описание
}

/**
 * Рассчитывает таможенную пошлину на основе страны назначения и стоимости товара
 * Обновлено: январь 2026 с актуальными ставками и порогами
 */
export function calculateCustomsDuty(
  countryCode: string,
  itemValueJPY: number
): CustomsDutyResult {
  const usdToJpy = 150; // Примерный курс
  const eurToJpy = 165; // Примерный курс
  const cadToJpy = 110; // Примерный курс CAD/JPY
  const audToJpy = 100; // Примерный курс AUD/JPY

  // США - ВАЖНО: С 29 августа 2025 отменен порог $800!
  // Все коммерческие посылки из Японии теперь облагаются пошлиной
  if (countryCode === 'US') {
    // Базовая ставка тарифа на японские товары: 15% (U.S.-Japan framework)
    // Специальный тариф (с августа 2025): 25%
    // Используем 25% как текущую ставку
    const dutyRate = 0.25; // 25%
    return {
      dutyAmount: Math.round(itemValueJPY * dutyRate),
      dutyRate: dutyRate * 100,
      taxFreeThreshold: 0, // Порога больше нет
      isTaxFree: false,
      description: 'U.S. Import Tariff on Japan (25%)'
    };
  }

  // Европейские страны
  // До 1 июля 2026: порог €150
  // После 1 июля 2026: €3 фиксированная пошлина за товар + VAT
  const euCountries = [
    'GB', 'DE', 'FR', 'AT', 'IE', 'ES', 'PT', 'IT', 'NO', 'SE', 'FI', 'IS',
    'PL', 'CZ', 'HU', 'SK', 'LT', 'LV', 'EE', 'RO', 'BG', 'HR', 'GR'
  ];
  if (euCountries.includes(countryCode)) {
    const threshold = 150 * eurToJpy; // €150

    // Сейчас январь 2026, порог €150 еще действует до 1 июля 2026
    if (itemValueJPY <= threshold) {
      return {
        dutyAmount: 0,
        dutyRate: 0,
        taxFreeThreshold: threshold,
        isTaxFree: true,
        description: 'Duty-free until July 1, 2026 (under €150)'
      };
    }

    // Для товаров свыше €150: VAT 20% + Duty ~4%
    const dutyRate = 0.24; // 24% (VAT + Duty)
    return {
      dutyAmount: Math.round(itemValueJPY * dutyRate),
      dutyRate: dutyRate * 100,
      taxFreeThreshold: threshold,
      isTaxFree: false,
      description: 'VAT + Import duty (24%)'
    };
  }

  // Канада
  // ВАЖНО: Канада и Япония в CPTPP - ~99% товаров duty-free
  // Но GST 5% все равно применяется для товаров свыше CAD $20
  if (countryCode === 'CA') {
    const threshold = 20 * cadToJpy; // CAD $20
    if (itemValueJPY <= threshold) {
      return {
        dutyAmount: 0,
        dutyRate: 0,
        taxFreeThreshold: threshold,
        isTaxFree: true,
        description: 'Tax-free (under CAD $20)'
      };
    }
    // По CPTPP пошлина 0%, но GST 5% обязателен
    const gstRate = 0.05; // 5% GST
    return {
      dutyAmount: Math.round(itemValueJPY * gstRate),
      dutyRate: gstRate * 100,
      taxFreeThreshold: threshold,
      isTaxFree: false,
      description: 'GST only (5%) - CPTPP duty-free'
    };
  }

  // Австралия
  // Порог для пошлины: AUD $1,000
  // GST 10% применяется ко ВСЕМ импортам (порог убран с 29 августа 2025)
  if (countryCode === 'AU') {
    const dutyThreshold = 1000 * audToJpy; // AUD $1,000 для пошлины

    if (itemValueJPY <= dutyThreshold) {
      // Ниже AUD $1,000: только GST 10%, без пошлины
      const gstRate = 0.10; // 10% GST
      return {
        dutyAmount: Math.round(itemValueJPY * gstRate),
        dutyRate: gstRate * 100,
        taxFreeThreshold: dutyThreshold,
        isTaxFree: false,
        description: 'GST only (10%)'
      };
    }

    // Свыше AUD $1,000: GST 10% + Duty ~5%
    const totalRate = 0.15; // 15% (10% GST + 5% Duty)
    return {
      dutyAmount: Math.round(itemValueJPY * totalRate),
      dutyRate: totalRate * 100,
      taxFreeThreshold: dutyThreshold,
      isTaxFree: false,
      description: 'GST + Import duty (15%)'
    };
  }

  // Новая Зеландия
  // CPTPP член - duty-free для большинства товаров из Японии
  // GST 15% применяется к импорту
  if (countryCode === 'NZ') {
    const threshold = 1000 * 95; // NZD $1,000
    if (itemValueJPY <= threshold) {
      return {
        dutyAmount: 0,
        dutyRate: 0,
        taxFreeThreshold: threshold,
        isTaxFree: true,
        description: 'Tax-free (under NZD $1,000)'
      };
    }
    // GST 15% (пошлина обычно 0% по CPTPP)
    const gstRate = 0.15; // 15% GST
    return {
      dutyAmount: Math.round(itemValueJPY * gstRate),
      dutyRate: gstRate * 100,
      taxFreeThreshold: threshold,
      isTaxFree: false,
      description: 'GST (15%) - CPTPP duty-free'
    };
  }

  // Азиатские страны
  const asianCountries = ['SG', 'KR', 'TH', 'MY', 'PH', 'VN', 'ID', 'CN'];
  if (asianCountries.includes(countryCode)) {
    const threshold = 20000; // ~¥20,000
    if (itemValueJPY <= threshold) {
      return {
        dutyAmount: 0,
        dutyRate: 0,
        taxFreeThreshold: threshold,
        isTaxFree: true,
        description: 'Tax-free (low value)'
      };
    }
    // VAT/GST varies, average ~10%
    const dutyRate = 0.10; // 10%
    return {
      dutyAmount: Math.round(itemValueJPY * dutyRate),
      dutyRate: dutyRate * 100,
      taxFreeThreshold: threshold,
      isTaxFree: false,
      description: 'Import tax (10%)'
    };
  }

  // Другие страны - средняя ставка
  const threshold = 15000; // ~¥15,000
  if (itemValueJPY <= threshold) {
    return {
      dutyAmount: 0,
      dutyRate: 0,
      taxFreeThreshold: threshold,
      isTaxFree: true,
      description: 'Tax-free (low value)'
    };
  }
  const dutyRate = 0.15; // 15%
  return {
    dutyAmount: Math.round(itemValueJPY * dutyRate),
    dutyRate: dutyRate * 100,
    taxFreeThreshold: threshold,
    isTaxFree: false,
    description: 'Import duty (15%)'
  };
}
