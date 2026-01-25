"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { allCategories } from "@/data/categories";

interface Props {
  initialProducts: any[];
  categoryId: string;
}

const CategoryControls = ({ initialProducts, categoryId }: Props) => {
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState<string>("");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState<{ [key: number]: any[] }>({ 1: initialProducts });
  const [loading, setLoading] = useState(false);
  const [maxPageLoaded, setMaxPageLoaded] = useState(1);
  const [navigating, setNavigating] = useState(false);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  const category = allCategories.find(c => c.id.toString() === categoryId);
  const subcategories = category?.subcategories || [];

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(e.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Сбрасываем состояние загрузки при изменении роута
  useEffect(() => {
    // Сбрасываем загрузку когда pathname меняется
    setNavigating(false);
  }, [router.pathname]);

  const applySortToArray = (order: string, items: any[]) => {
    if (!order) return items;
    const arr = [...items];
    if (order === "lowest") arr.sort((a, b) => a.itemPrice - b.itemPrice);
    if (order === "highest") arr.sort((a, b) => b.itemPrice - a.itemPrice);
    return arr;
  };

  const fetchPage = async (pageNum: number, order?: string) => {
    if (pageNum < 1) return;
    const usedOrder = order ?? sortOrder;

    if (loadedPages[pageNum]) {
      setCurrentPage(pageNum);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/products?genreId=${encodeURIComponent(categoryId)}&page=${pageNum}&sort=${encodeURIComponent(usedOrder)}`
      );
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const sorted = applySortToArray(usedOrder, data);

      setLoadedPages(prev => ({ ...prev, [pageNum]: sorted }));
      setCurrentPage(pageNum);
      setMaxPageLoaded(Math.max(maxPageLoaded, pageNum));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSortChange = (order: string) => {
    setSortOrder(order);
    const firstPageSorted = applySortToArray(order, loadedPages[1] || []);
    setLoadedPages({ 1: firstPageSorted });
    setCurrentPage(1);
    setMaxPageLoaded(1);
    setSortDropdownOpen(false);
  };

  const handleSubcategoryClick = (subcategoryId: number) => {
    setNavigating(true);
    router.push(`/category/${categoryId}/${subcategoryId}`);
  };

  const renderPagination = () => {
    const visiblePages = 6;
    let start = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
    let end = start + visiblePages - 1;

    if (end > maxPageLoaded) {
      end = maxPageLoaded;
      start = Math.max(end - visiblePages + 1, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchPage(i)}
          className={`px-4 py-2 rounded-full border text-base font-medium transition ${
            i === currentPage ? "bg-green-500 text-white border-green-500" : "bg-white border-gray-300 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
        <button
          onClick={() => currentPage > 1 && fetchPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-full border bg-white border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-base font-medium"
        >
          ←
        </button>
        {pages}
        <button
          onClick={() => fetchPage(currentPage + 1)}
          disabled={loadedPages[currentPage]?.length === 0}
          className="px-4 py-2 rounded-full border bg-white border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-base font-medium"
        >
          →
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-bold text-gray-800">Loading...</p>
          </div>
        </div>
      )}

      {/* Подкатегории */}
      <div className="relative mb-4" ref={categoriesDropdownRef}>
        <button
          onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
          className="border border-green-600 rounded px-4 py-2 bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          Categories
        </button>
        {categoriesDropdownOpen && (
          <div className="absolute mt-1 w-56 max-h-64 overflow-auto bg-white border border-gray-300 rounded shadow-lg z-10">
            {subcategories.length > 0 ? subcategories.map(subcat => (
              <button
                key={subcat.id}
                onClick={() => handleSubcategoryClick(subcat.id)}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-green-100"
              >
                {subcat.name}
              </button>
            )) : <div className="p-4 text-gray-500 text-sm">No subcategories</div>}
          </div>
        )}
      </div>

      {/* Сортировка */}
      <div className="relative mb-4" ref={sortDropdownRef}>
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="border border-gray-300 rounded px-4 py-2 bg-white text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          Sort by price
        </button>
        {sortDropdownOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-300 rounded shadow-lg z-10">
            <button className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === "lowest" ? "bg-orange-100" : "hover:bg-gray-100"}`} onClick={() => handleSortChange("lowest")}>Lowest Price</button>
            <button className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === "highest" ? "bg-orange-100" : "hover:bg-gray-100"}`} onClick={() => handleSortChange("highest")}>Highest Price</button>
            <button className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === "" ? "bg-orange-100" : "hover:bg-gray-100"}`} onClick={() => handleSortChange("")}>Clear Sorting</button>
          </div>
        )}
      </div>

      {/* Товары */}
      <p className="text-gray-600 text-sm mb-4">{loadedPages[currentPage]?.length || 0} items</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loading && <p className="col-span-full text-center text-gray-500">Loading...</p>}
        {loadedPages[currentPage]?.map(product => (
          <Link key={product.itemCode} href={`/product/${product.itemCode}`} className="border rounded-lg p-3 hover:shadow-lg hover:border-orange-500 transition duration-300 ease-in-out flex flex-col h-full">
            <img
              src={product.mediumImageUrls?.[0]?.imageUrl || ""}
              alt={product.itemName}
              className="w-full aspect-[3/4] object-contain mb-2"
              style={{ maxHeight: 180 }}
            />
            <h3 className="text-sm font-medium line-clamp-2 flex-1">{product.itemName}</h3>
            <div className="mt-2 bg-orange-100 rounded-md px-3 py-1 self-start">
              <span className="font-bold text-orange-700 text-lg">¥{String(product.itemPrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
          </Link>
        ))}
      </div>

      {renderPagination()}
    </>
  );
};

export default CategoryControls;