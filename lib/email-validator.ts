import disposableDomains from './disposable-email-domains.json';

/**
 * Проверяет, является ли email временным/одноразовым
 * Использует список из https://github.com/disposable/disposable-email-domains
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Извлекаем домен из email
  const domain = email.toLowerCase().split('@')[1];

  if (!domain) {
    return false;
  }

  // Проверяем есть ли домен в списке одноразовых
  return disposableDomains.includes(domain);
}

/**
 * Нормализует email для проверки дубликатов
 * Gmail и Google Mail игнорируют точки и всё после +
 * test+1@gmail.com и t.e.s.t@gmail.com → test@gmail.com
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return email;
  }

  const [local, domain] = email.toLowerCase().split('@');

  if (!domain) {
    return email.toLowerCase();
  }

  // Gmail и GoogleMail игнорируют точки и плюсы
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Убираем все точки и всё после +
    const cleanLocal = local.replace(/\./g, '').split('+')[0];
    return `${cleanLocal}@${domain}`;
  }

  return email.toLowerCase();
}

/**
 * Валидирует email для регистрации с бонусом
 */
export function validateEmailForBonus(email: string): { valid: boolean; error?: string; normalizedEmail?: string } {
  // Базовая валидация формата
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Проверка на временный email
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: 'Temporary email addresses are not allowed. Please use a real email address to receive your bonus.'
    };
  }

  // Нормализуем email для проверки дубликатов
  const normalizedEmail = normalizeEmail(email);

  return { valid: true, normalizedEmail };
}
