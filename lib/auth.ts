// lib/auth.ts
import { generateToken } from './jwt';

export interface User {
  id: string;
  name: string;
  secondName: string;
  email: string;
  balance?: number;
}

// Константы для ключей localStorage
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_DATA_KEY = 'user_data';

// Миграция mock-токенов (только в браузере)
export const migrateMockToken = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (token && token.startsWith('mock-token-')) {
            
      const userDataStr = localStorage.getItem(USER_DATA_KEY);
      if (userDataStr) {
        const userData: User = JSON.parse(userDataStr);
        
        if (userData && userData.id && userData.email) {
          // Создаем настоящий JWT токен
          const realToken = generateToken({
            userId: userData.id,
            email: userData.email
          });
          
          // Сохраняем новый токен
          localStorage.setItem(AUTH_TOKEN_KEY, realToken);
                    return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('Error migrating mock token:', error);
    return false;
  }
};

// Сохраняем данные аутентификации
export const saveAuthData = (token: string, userData: User): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    const safeUserData: User = {
      id: userData.id,
      name: userData.name,
      secondName: userData.secondName,
      email: userData.email,
      balance: userData.balance || 0
    };
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(safeUserData));
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

// Получаем токен аутентификации
export const getAuthToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Получаем совместимый токен аутентификации
export const getCompatibleAuthToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting compatible auth token:', error);
    return null;
  }
};

// Упрощенная проверка токена
export const verifyAuthToken = (token: string): boolean => {
  try {
    return !!token && token.length > 0;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return false;
  }
};

// Получаем заголовок авторизации для API запросов
export const getAuthHeader = (): { Authorization: string } | null => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

// Проверяем аутентификацию
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

// Получаем данные пользователя
export const getUserData = (): User | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Очищаем данные аутентификации
export const clearAuthData = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Обновляем баланс пользователя
export const updateUserBalance = (newBalance: number): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const userData = getUserData();
    if (userData) {
      userData.balance = newBalance;
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      // Отправляем событие для обновления UI
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: { newBalance }
      }));
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
  }
};

// Синхронизируем баланс с сервером
export const syncBalanceFromServer = async (): Promise<number | null> => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch('/api/balance/update', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      updateUserBalance(data.balance);
      return data.balance;
    }
    return null;
  } catch (error) {
    console.error('Error syncing balance from server:', error);
    return null;
  }
};

// Получаем баланс с сервера
export const getServerBalance = async (): Promise<number | null> => {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch('/api/balance/update', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.balance;
    }
    return null;
  } catch (error) {
    console.error('Error getting server balance:', error);
    return null;
  }
};