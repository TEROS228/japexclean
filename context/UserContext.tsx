"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut } from "next-auth/react";
import { USER_DATA_KEY, AUTH_TOKEN_KEY } from "@/lib/auth";

type UserType = {
  id?: string;
  name: string;
  secondName: string;
  email: string;
  balance: number;
} | null;

type RegisteredUser = {
  name: string;
  secondName: string;
  email: string;
  password: string;
  balance: number;
};

type UserContextType = {
  user: UserType;
  login: (email: string, password: string) => boolean;
  signup: (data: Omit<RegisteredUser, "balance">) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
  setBalance: (newBalance: number) => void;
  refreshUser: () => void; // Добавляем refreshUser
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const { data: session, status } = useSession();

  // Синхронизация с NextAuth сессией
  useEffect(() => {
    if (status === "loading") return; // Ждем пока загрузится сессия

    if (status === "authenticated" && session?.user) {
      const googleUser = session.user as any;

      // Получаем JWT токен для Google пользователя
      const syncGoogleUser = async () => {
        try {
          const response = await fetch('/api/auth/google-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.ok) {
            const data = await response.json();

            // Сохраняем токен в localStorage
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);

            // Создаем объект пользователя
            const newUser: UserType = {
              name: data.user.name,
              secondName: data.user.secondName,
              email: data.user.email,
              balance: data.user.balance
            };

            // Добавляем в список зарегистрированных если нужно
            const storedUsers = localStorage.getItem("registeredUsers");
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            const existingUserIndex = users.findIndex((u: RegisteredUser) => u.email === googleUser.email);

            const registeredUser: RegisteredUser = {
              ...newUser,
              password: "" // Google пользователям не нужен пароль
            };

            if (existingUserIndex >= 0) {
              users[existingUserIndex] = registeredUser;
            } else {
              users.push(registeredUser);
            }

            localStorage.setItem("registeredUsers", JSON.stringify(users));
            setRegisteredUsers(users);
            setUser(newUser);
          }
        } catch (error) {
          console.error('[UserContext] Failed to sync Google user:', error);
        }
      };

      syncGoogleUser();
    }
    // Если status === "unauthenticated", ничего не делаем
    // потому что пользователь уже загружен из localStorage при монтировании
  }, [session, status]);

  // Загрузка данных из localStorage при монтировании
  useEffect(() => {
    const storedUsers = localStorage.getItem("registeredUsers");
    if (storedUsers) setRegisteredUsers(JSON.parse(storedUsers));

    // Загружаем текущего пользователя если он есть
    const storedUser = localStorage.getItem(USER_DATA_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('[UserContext] Failed to parse user data:', error);
      }
    }
  }, []);

  // Сохраняем текущего пользователя при изменениях
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_DATA_KEY);
    }
  }, [user]);

  // Сохраняем список зарегистрированных пользователей
  useEffect(() => {
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const signup = (data: Omit<RegisteredUser, "balance">) => {
    if (registeredUsers.find((u) => u.email === data.email)) {
      alert("This email is already registered");
      return;
    }
    const newUser: RegisteredUser = { ...data, balance: 0 };
    setRegisteredUsers((prev) => [...prev, newUser]);
    setUser({ ...newUser });
  };

  const login = (email: string, password: string) => {
    const foundUser = registeredUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (foundUser) {
      setUser({ ...foundUser });
      return true;
    }
    alert("Invalid email or password");
    return false;
  };

  const logout = async () => {
    setUser(null);
    // Очищаем токен из localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    // Выходим также из NextAuth если залогинены через Google
    if (status === "authenticated") {
      await signOut({ redirect: false });
    }
  };

  // Добавляет или списывает баланс
  const updateBalance = (amount: number) => {
    if (!user) return;
    const newBalance = user.balance + amount;
    setUser((prev) => prev && { ...prev, balance: newBalance });
    setRegisteredUsers((users) =>
      users.map((u) => (u.email === user.email ? { ...u, balance: newBalance } : u))
    );
  };

  // Прямое обновление баланса
  const setBalance = (newBalance: number) => {
    if (!user) return;
    setUser((prev) => prev && { ...prev, balance: newBalance });
    setRegisteredUsers((users) =>
      users.map((u) => (u.email === user.email ? { ...u, balance: newBalance } : u))
    );
  };

  // Новая функция: обновление данных пользователя
  const refreshUser = () => {
    if (!user) return;

    // Обновляем пользователя из registeredUsers (актуальные данные)
    const updatedUser = registeredUsers.find(u => u.email === user.email);
    if (updatedUser) {
      setUser({ ...updatedUser });
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      updateBalance, 
      setBalance,
      refreshUser // Добавляем в контекст
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Хук для использования
export default function useUserContext() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within UserProvider");
  return context;
}