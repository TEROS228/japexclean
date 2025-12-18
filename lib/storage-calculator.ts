/**
 * Утилиты для расчета стоимости хранения
 *
 * Правила:
 * - 60 дней бесплатного хранения
 * - После 60 дней: ¥30/день
 * - Пользователь может оплачивать сколько угодно долго
 * - Если НЕ оплатит 10 дней подряд → утилизация
 */

const FREE_STORAGE_DAYS = 60; // 60 дней бесплатного хранения
const MAX_UNPAID_DAYS = 10; // Максимум дней без оплаты перед утилизацией
const STORAGE_FEE_PER_DAY = 30; // 30 иен за день

export interface StorageInfo {
  totalDays: number; // Всего дней с момента arrival
  freeDaysRemaining: number; // Осталось бесплатных дней (0-60)
  unpaidDays: number; // Неоплаченные дни после бесплатного периода
  daysUntilDisposal: number; // Дней до утилизации (если не оплатит)
  currentFee: number; // Текущая сумма за неоплаченные дни
  isExpired: boolean; // Прошло ли 10 дней без оплаты
  canShip: boolean; // Можно ли отправить
  status: 'free' | 'paid' | 'expired'; // Статус хранения
}

/**
 * Расчет информации о хранении для посылки
 * @param arrivedAt - Дата прибытия посылки
 * @param lastPaymentDate - Дата последней оплаты (или arrivedAt + 60 дней если еще не платил)
 */
export function calculateStorageInfo(
  arrivedAt: Date,
  lastPaymentDate: Date | null = null
): StorageInfo {
  const now = new Date();
  const totalDays = Math.floor((now.getTime() - arrivedAt.getTime()) / (1000 * 60 * 60 * 24));

  let freeDaysRemaining = 0;
  let unpaidDays = 0;
  let daysUntilDisposal = MAX_UNPAID_DAYS;
  let currentFee = 0;
  let status: 'free' | 'paid' | 'expired' = 'free';

  if (totalDays <= FREE_STORAGE_DAYS) {
    // Еще в пределах бесплатного хранения
    freeDaysRemaining = FREE_STORAGE_DAYS - totalDays;
    status = 'free';
  } else {
    // Платный период начался
    status = 'paid';

    // Определяем дату начала платного периода
    const paidPeriodStart = lastPaymentDate || new Date(arrivedAt.getTime() + FREE_STORAGE_DAYS * 24 * 60 * 60 * 1000);

    // Считаем неоплаченные дни с момента последней оплаты (или начала платного периода)
    unpaidDays = Math.floor((now.getTime() - paidPeriodStart.getTime()) / (1000 * 60 * 60 * 24));

    // Если unpaidDays отрицательное (последняя оплата была позже arrivedAt + 60), значит все оплачено
    if (unpaidDays < 0) {
      unpaidDays = 0;
    }

    currentFee = unpaidDays * STORAGE_FEE_PER_DAY;
    daysUntilDisposal = Math.max(0, MAX_UNPAID_DAYS - unpaidDays);

    // Если прошло 10+ дней без оплаты - утилизация
    if (unpaidDays >= MAX_UNPAID_DAYS) {
      status = 'expired';
    }
  }

  const isExpired = status === 'expired';
  const canShip = !isExpired && unpaidDays === 0;

  return {
    totalDays,
    freeDaysRemaining,
    unpaidDays,
    daysUntilDisposal,
    currentFee,
    isExpired,
    canShip,
    status
  };
}

/**
 * Форматирование оставшегося времени для отображения
 */
export function formatTimeRemaining(days: number): string {
  if (days <= 0) return '0 days';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Получить цвет статуса для UI
 */
export function getStorageStatusColor(status: 'free' | 'paid' | 'expired'): string {
  switch (status) {
    case 'free':
      return 'green';
    case 'paid':
      return 'orange';
    case 'expired':
      return 'red';
  }
}

/**
 * Получить текст статуса
 */
export function getStorageStatusText(info: StorageInfo): string {
  if (info.isExpired) {
    return 'Storage expired - 10 days without payment';
  }

  if (info.status === 'free') {
    return `${info.freeDaysRemaining} days of free storage remaining`;
  }

  if (info.unpaidDays === 0) {
    return 'Paid storage - all fees paid';
  }

  return `${info.unpaidDays} unpaid days (¥${info.currentFee}) - ${info.daysUntilDisposal} days until disposal`;
}
