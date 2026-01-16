// Генерация уникального session ID для браузера (живет 24 часа)
export function getOrCreateSessionId(): string {
  const SESSION_KEY = 'visitor_session_id';
  const TIMESTAMP_KEY = 'visitor_session_timestamp';
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

  // Проверяем localStorage (сохраняется между сессиями браузера)
  const sessionId = localStorage.getItem(SESSION_KEY);
  const timestamp = localStorage.getItem(TIMESTAMP_KEY);

  const now = Date.now();

  // Если sessionId существует и не истек (прошло меньше 24 часов)
  if (sessionId && timestamp) {
    const elapsed = now - parseInt(timestamp);
    if (elapsed < SESSION_DURATION) {
      return sessionId; // Возвращаем существующий sessionId
    }
  }

  // Создаем новый session ID (если его нет или прошло 24 часа)
  const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(SESSION_KEY, newSessionId);
  localStorage.setItem(TIMESTAMP_KEY, now.toString());

  return newSessionId;
}

// Простой browser fingerprint (не 100% уникален, но достаточен для базовой дедупликации)
export function getBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL(),
  ].join('|');

  // Простой хеш
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

// Tracking визита (вызывается один раз при загрузке приложения)
export async function trackVisit() {
  // Проверяем последний отправленный session ID
  const LAST_TRACKED_SESSION_KEY = 'last_tracked_session_id';

  const sessionId = getOrCreateSessionId();
  const lastTrackedSessionId = localStorage.getItem(LAST_TRACKED_SESSION_KEY);

  if (lastTrackedSessionId === sessionId) {
    // Уже отправили визит для этого sessionId
    return;
  }

  try {
    const fingerprint = getBrowserFingerprint();
    const landingPage = window.location.pathname + window.location.search;
    const referrer = document.referrer;

    const response = await fetch('/api/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        fingerprint,
        landingPage,
        referrer,
      }),
    });

    if (response.ok) {
      // Сохраняем sessionId как последний отправленный
      localStorage.setItem(LAST_TRACKED_SESSION_KEY, sessionId);
    }
  } catch (error) {
    console.error('Failed to track visit:', error);
  }
}
