import { createContext, useContext, useState, ReactNode } from "react";

export type CategoryState = {
  genreId: number | null;
  subgenreId: number | null;
  currentPage: number;
  sortOrder: string;
  lastCategoryUrl: string; // Сохраняем URL категории
};

export type CategoryContextType = {
  categoryState: CategoryState;
  setCategoryState: (state: CategoryState) => void;
};

const defaultState: CategoryState = {
  genreId: null,
  subgenreId: null,
  currentPage: 1,
  sortOrder: "",
  lastCategoryUrl: "/",
};

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categoryState, setCategoryState] = useState<CategoryState>(defaultState);

  return (
    <CategoryContext.Provider value={{ categoryState, setCategoryState }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error("useCategory must be used within CategoryProvider");
  return context;
};
