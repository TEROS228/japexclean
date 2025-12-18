"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type MarketplaceType = "rakuten" | "yahoo";

type MarketplaceContextType = {
  marketplace: MarketplaceType;
  setMarketplace: (marketplace: MarketplaceType, silent?: boolean) => void;
};

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider = ({ children }: { children: ReactNode }) => {
  const [marketplace, setMarketplaceState] = useState<MarketplaceType>("rakuten");

  // Загружаем выбор из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("selectedMarketplace");
    if (saved === "rakuten" || saved === "yahoo") {
      setMarketplaceState(saved);
    }
  }, []);

  // Сохраняем выбор в localStorage при изменении
  const setMarketplace = (newMarketplace: MarketplaceType, silent: boolean = false) => {
    setMarketplaceState(newMarketplace);
    localStorage.setItem("selectedMarketplace", newMarketplace);

    // Отправляем событие для обновления других компонентов (если не silent)
    if (!silent) {
      window.dispatchEvent(new CustomEvent('marketplaceChanged', {
        detail: { marketplace: newMarketplace }
      }));
    }
  };

  return (
    <MarketplaceContext.Provider value={{ marketplace, setMarketplace }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error("useMarketplace must be used within MarketplaceProvider");
  }
  return context;
};
