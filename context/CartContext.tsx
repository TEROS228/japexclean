"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;

  size?: string;
  color?: string;
  options?: { [key: string]: string }; // 🔹 универсальные варианты

  itemUrl?: string;
  rakutenId?: string;
  description?: string;
  marketplace?: 'rakuten' | 'yahoo'; // 🔹 маркетплейс товара
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  syncCartWithServer: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find(
        (i) =>
          i.id === item.id &&
          JSON.stringify(i.options || {}) === JSON.stringify(item.options || {}) &&
          i.size === item.size &&
          i.color === item.color
      );
      if (existing) {
        return prevCart.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        return [...prevCart, item];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const increaseQuantity = useCallback((id: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((id: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  }, []);

  const syncCartWithServer = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in");

      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to sync cart");
      }
    } catch (err: any) {
      console.error("Cart sync error:", err.message);
    }
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        increaseQuantity,
        decreaseQuantity,
        syncCartWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
