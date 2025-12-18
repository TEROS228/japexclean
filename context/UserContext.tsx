"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserType = {
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

  // Загрузка данных из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const storedUsers = localStorage.getItem("registeredUsers");
    if (storedUsers) setRegisteredUsers(JSON.parse(storedUsers));
  }, []);

  // Сохраняем текущего пользователя при изменениях
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
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

  const logout = () => setUser(null);

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
      console.log("User data refreshed:", updatedUser);
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