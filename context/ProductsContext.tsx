"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SubcategoryState {
  products: any[];
  currentPage: number;
  sortOrder: string;
  pagesCache: Record<number, any[]>;
}

type AllSubcategoriesState = Record<string, SubcategoryState>;

interface ProductsContextType {
  productsBySubcategory: AllSubcategoriesState;
  setProducts: (
    subcategoryId: string,
    products: any[],
    page?: number,
    sortOrder?: string
  ) => void;
  getSubcategoryState: (subcategoryId: string) => SubcategoryState | undefined;
  resetSubcategory: (subcategoryId: string) => void; // 🔹 новый метод
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [productsBySubcategory, setProductsBySubcategory] = useState<AllSubcategoriesState>({});

  const setProducts = (
    subcategoryId: string,
    products: any[],
    page: number = 1,
    sortOrder: string = ""
  ) => {
    setProductsBySubcategory((prev) => {
      const prevState = prev[subcategoryId] || { products: [], currentPage: 1, sortOrder: "", pagesCache: {} };

      // Если сортировка изменилась, очищаем кеш
      const sortChanged = prevState.sortOrder !== sortOrder;
      const pagesCache = sortChanged ? { [page]: products } : { ...prevState.pagesCache, [page]: products };

      return {
        ...prev,
        [subcategoryId]: {
          products,
          currentPage: page,
          sortOrder,
          pagesCache,
        },
      };
    });
  };

  const getSubcategoryState = (subcategoryId: string) => {
    return productsBySubcategory[subcategoryId];
  };

  // 🔹 новый метод: сброс кэша и состояния подкатегории
  const resetSubcategory = (subcategoryId: string) => {
    setProductsBySubcategory((prev) => {
      const newState = { ...prev };
      delete newState[subcategoryId];
      return newState;
    });
  };

  return (
    <ProductsContext.Provider value={{ productsBySubcategory, setProducts, getSubcategoryState, resetSubcategory }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProductsContext = () => {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProductsContext must be used within a ProductsProvider");
  return context;
};
