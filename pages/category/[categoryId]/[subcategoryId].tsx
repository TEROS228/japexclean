import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { allCategories } from "@/data/categories";
import { getProductsByGenreId } from "@/lib/rakuten";
import { useProductsContext } from "@/context/ProductsContext";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductLoadingOverlay from "@/components/ProductLoadingOverlay";
import FavouriteButton from "@/components/FavouriteButton";

interface Props {
  products: any[];
  categoryName: string;
  subcategoryName: string;
  categoryId: string;
  subcategoryId: string;
  initialPage?: number;
  initialSort?: string;
}

const SubcategoryPage: NextPage<Props> = ({
  products: initialProducts,
  categoryName,
  subcategoryName,
  categoryId,
  subcategoryId,
  initialPage = 1,
  initialSort = "",
}) => {
  const router = useRouter();
  const { setProducts, getSubcategoryState, resetSubcategory } = useProductsContext();
  const { marketplace } = useMarketplace();
  const { formatPrice, getCurrencySymbol } = useCurrency();

  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>(subcategoryId);
  const [currentSubcategoryName, setCurrentSubcategoryName] = useState<string>(subcategoryName);
  const [products, setProductsState] = useState<any[]>(initialProducts || []);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [sortOrder, setSortOrder] = useState<string>(initialSort);
  const [loading, setLoading] = useState(false);
  const [navigatingToProduct, setNavigatingToProduct] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [priceMinInput, setPriceMinInput] = useState<string>("");
  const [priceMaxInput, setPriceMaxInput] = useState<string>("");

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  const category = allCategories.find((c) => c.id.toString() === categoryId);
  const subcategories = category?.subcategories || [];

  // Отслеживание завершения навигации
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      setNavigatingToProduct(false);
    };

    const handleRouteChangeError = () => {
      setNavigatingToProduct(false);
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  // Функция для сохранения Yahoo товара перед переходом
  const handleProductClick = (product: any) => (e: React.MouseEvent) => {
    e.preventDefault();

    // Показываем анимацию загрузки
    setNavigatingToProduct(true);

    // Сохраняем фильтры по цене
    sessionStorage.setItem(`priceMin-subcat-${activeSubcategoryId}`, priceMin);
    sessionStorage.setItem(`priceMax-subcat-${activeSubcategoryId}`, priceMax);

    // Для Yahoo товаров сохраняем данные товара
    if (product._source === 'yahoo') {
      console.log('[Subcategory] Saving Yahoo product to sessionStorage:', product.itemCode);
      sessionStorage.setItem(`yahoo-product-${product.itemCode}`, JSON.stringify(product));
    }

    router.push(`/product/${product.itemCode}?fromCategory=${categoryId}&fromSubcategory=${activeSubcategoryId}&fromPage=${currentPage}&sortOrder=${sortOrder}`);
  };

  // закрытие дропдаунов
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPage = async (pageNum: number, order?: string, subcatId?: string, minPrice?: string, maxPrice?: string) => {
    const usedOrder = order ?? sortOrder;
    const usedSubcatId = subcatId ?? activeSubcategoryId;
    const usedMinPrice = minPrice !== undefined ? minPrice : priceMin;
    const usedMaxPrice = maxPrice !== undefined ? maxPrice : priceMax;

    const savedState = getSubcategoryState(usedSubcatId);
    if (!minPrice && !maxPrice && savedState?.pagesCache?.[pageNum] && savedState.sortOrder === usedOrder) {
      setProductsState(savedState.pagesCache[pageNum]);
      setCurrentPage(pageNum);
      setSortOrder(usedOrder);
      // Safe scroll with fallback
      try {
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch (e) {
        console.error('Scroll error:', e);
      }

      router.replace(
        `/category/${categoryId}/${usedSubcatId}?page=${pageNum}&sort=${usedOrder}`,
        undefined,
        { scroll: false }
      );
      return;
    }

    setLoading(true);
    try {
      // Добавляем параметры фильтрации по цене только если они заполнены
      const minPriceValue = usedMinPrice?.trim();
      const maxPriceValue = usedMaxPrice?.trim();
      const minPriceParam = minPriceValue && minPriceValue !== '0' ? `&minPrice=${encodeURIComponent(minPriceValue)}` : '';
      const maxPriceParam = maxPriceValue && maxPriceValue !== '0' ? `&maxPrice=${encodeURIComponent(maxPriceValue)}` : '';

      const endpoint = marketplace === "yahoo"
        ? `/api/yahoo/products?categoryId=${encodeURIComponent(usedSubcatId)}&page=${pageNum}&sort=${encodeURIComponent(usedOrder)}`
        : `/api/products?genreId=${encodeURIComponent(usedSubcatId)}&page=${pageNum}&sort=${encodeURIComponent(usedOrder)}${minPriceParam}${maxPriceParam}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      // API уже возвращает отсортированные и отфильтрованные данные
      setProductsState(data);
      setCurrentPage(pageNum);
      setSortOrder(usedOrder);
      setProducts(usedSubcatId, data, pageNum, usedOrder);

      // Safe scroll with fallback
      try {
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch (e) {
        console.error('Scroll error:', e);
      }

      router.replace(
        `/category/${categoryId}/${usedSubcatId}?page=${pageNum}&sort=${usedOrder}`,
        undefined,
        { scroll: false }
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSortChange = (order: string) => {
    setSortOrder(order);
    fetchPage(1, order, activeSubcategoryId);
    setSortDropdownOpen(false);
  };

  const handleSubcategoryClick = (subcat: { id: number; name: string }) => {
    const id = String(subcat.id);
    setCategoriesDropdownOpen(false);
    // Сбрасываем фильтры перед переходом
    setPriceMin("");
    setPriceMax("");
    setPriceMinInput("");
    setPriceMaxInput("");
    // Навигация через router для обновления URL и триггера SSR
    router.push(`/category/${categoryId}/${id}`);
  };

  // Применить фильтр по цене
  const applyPriceFilter = () => {
    // Проверяем что значения не пустые и не нули
    const minValue = priceMinInput?.trim();
    const maxValue = priceMaxInput?.trim();
    const isMinValid = minValue && minValue !== '0';
    const isMaxValid = maxValue && maxValue !== '0';

    // Если оба пустые или нули - сбрасываем фильтр
    if (!isMinValid && !isMaxValid) {
      setPriceMin("");
      setPriceMax("");
      setPriceMinInput("");
      setPriceMaxInput("");

      // Загружаем без фильтров
      fetchPage(1, sortOrder, activeSubcategoryId, "", "");
      return;
    }

    setPriceMin(priceMinInput);
    setPriceMax(priceMaxInput);

    // Передаем значения напрямую, не ждем state update
    fetchPage(1, sortOrder, activeSubcategoryId, priceMinInput, priceMaxInput);
  };

  // Обновляем товары когда приходят новые данные от SSR
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductsState(initialProducts);
    }
  }, [initialProducts]);

  // ✅ фикс: правильно обновляем activeSubcategoryId при смене subcategoryId
  useEffect(() => {
    if (!subcategoryId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get("page") || "1", 10);
    const sort = urlParams.get("sort") || "";

    setActiveSubcategoryId(subcategoryId);
    setCurrentSubcategoryName(subcategoryName);
    setCurrentPage(page);
    setSortOrder(sort);

    // Восстанавливаем фильтры по цене
    const savedPriceMin = sessionStorage.getItem(`priceMin-subcat-${subcategoryId}`);
    const savedPriceMax = sessionStorage.getItem(`priceMax-subcat-${subcategoryId}`);

    if (savedPriceMin) {
      setPriceMin(savedPriceMin);
      setPriceMinInput(savedPriceMin);
      sessionStorage.removeItem(`priceMin-subcat-${subcategoryId}`);
    }
    if (savedPriceMax) {
      setPriceMax(savedPriceMax);
      setPriceMaxInput(savedPriceMax);
      sessionStorage.removeItem(`priceMax-subcat-${subcategoryId}`);
    }

    // Загружаем только если нет данных от SSR
    if (!initialProducts || initialProducts.length === 0) {
      setProductsState([]);
      fetchPage(page, sort, subcategoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId]);

  // --- Сброс при смене маркетплейса ---
  useEffect(() => {
    const handleMarketplaceChange = () => {
      resetSubcategory(activeSubcategoryId);
      setProductsState([]);
      setCurrentPage(1);
      setSortOrder("");
      fetchPage(1, "", activeSubcategoryId);
    };

    window.addEventListener('marketplaceChanged', handleMarketplaceChange);
    return () => window.removeEventListener('marketplaceChanged', handleMarketplaceChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubcategoryId]);

  const renderPagination = () => {
    const visiblePages = 6;
    const start = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
    const end = start + visiblePages - 1;

    const pages: any[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchPage(i, undefined, activeSubcategoryId)}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 text-sm sm:text-base font-semibold transition-all hover:scale-110 active:scale-95 touch-manipulation ${
            i === currentPage
              ? "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-lg"
              : "bg-white border-gray-200 text-gray-700 hover:border-green-300 active:border-green-300"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8 flex-wrap">
        <button
          onClick={() => currentPage > 1 && fetchPage(currentPage - 1, undefined, activeSubcategoryId)}
          disabled={currentPage === 1}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 active:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95 touch-manipulation"
        >
          ←
        </button>
        {pages}
        <button
          onClick={() => fetchPage(currentPage + 1, undefined, activeSubcategoryId)}
          disabled={products.length === 0}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 active:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95 touch-manipulation"
        >
          →
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
          <Link href="/" className="text-green-600 hover:underline active:underline font-medium whitespace-nowrap touch-manipulation">Home</Link>
          <span>/</span>
          <Link href={`/category/${categoryId}`} className="text-green-600 hover:underline active:underline font-medium whitespace-nowrap touch-manipulation">{categoryName}</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold whitespace-nowrap">{currentSubcategoryName}</span>
        </div>

        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3 sm:gap-4 flex-wrap">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {currentSubcategoryName}
          </h1>

          <div className="flex gap-2 sm:gap-3 flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="relative" style={{ zIndex: 9999 }} ref={categoriesDropdownRef}>
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="group relative px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:from-green-700 hover:to-green-800 active:from-green-700 active:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-xl overflow-hidden hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500"></span>
                <span className="relative flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden xs:inline">Categories</span>
                  <span className="xs:hidden">Cat</span>
                  <svg
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${categoriesDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {categoriesDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-96 overflow-auto bg-white border-2 border-gray-100 rounded-2xl shadow-2xl animate-scaleIn" style={{ zIndex: 99999 }}>
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat.id}
                      onClick={() => handleSubcategoryClick(subcat)}
                      className="block w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {subcat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" style={{ zIndex: 9999 }} ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="px-3 sm:px-5 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl bg-white text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 active:bg-gray-50 hover:border-gray-300 active:border-gray-300 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort
                <svg
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn" style={{ zIndex: 99999 }}>
                  <button
                    className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => handleSortChange("")}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Most Relevant
                    </div>
                  </button>
                  <button
                    className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "popular" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => handleSortChange("popular")}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Most Popular
                    </div>
                  </button>
                  <button
                    className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "rating" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => handleSortChange("rating")}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Highest Rated
                    </div>
                  </button>
                  <button
                    className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "lowest" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => handleSortChange("lowest")}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      Lowest Price
                    </div>
                  </button>
                  <button
                    className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors ${sortOrder === "highest" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                    onClick={() => handleSortChange("highest")}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Highest Price
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Price Filter */}
        <div className="mb-6 bg-white rounded-2xl border-2 border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">Price Filter</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="text"
                  placeholder={`Min ${getCurrencySymbol()}`}
                  value={priceMinInput}
                  onChange={(e) => setPriceMinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
                  className="w-28 sm:w-32 px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>

              <span className="text-gray-400 font-bold">—</span>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="text"
                  placeholder={`Max ${getCurrencySymbol()}`}
                  value={priceMaxInput}
                  onChange={(e) => setPriceMaxInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
                  className="w-28 sm:w-32 px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm"
                />
              </div>

              <button
                onClick={applyPriceFilter}
                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium text-sm shadow-sm"
              >
                Apply
              </button>

              {(priceMin || priceMax) && (
                <button
                  onClick={() => {
                    setPriceMin("");
                    setPriceMax("");
                    setPriceMinInput("");
                    setPriceMaxInput("");
                    fetchPage(1, sortOrder, activeSubcategoryId);
                  }}
                  className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm shadow-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-gray-100 rounded-xl">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{products.length}</span>
            <span className="text-gray-600 text-sm sm:text-base">items</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">{priceMin || priceMax ? "No products found in this price range. Try adjusting the filters." : "No products found in this subcategory."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {products.map((product) => (
              <a
                key={product.itemCode}
                href={`/product/${product.itemCode}?fromCategory=${categoryId}&fromSubcategory=${activeSubcategoryId}&fromPage=${currentPage}&sortOrder=${sortOrder}`}
                onClick={handleProductClick(product)}
                className="group bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:shadow-2xl active:shadow-2xl hover:border-green-300 active:border-green-300 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 active:-translate-y-1 cursor-pointer touch-manipulation"
              >
                <div className="relative mb-2 sm:mb-3 overflow-hidden rounded-lg sm:rounded-xl bg-gray-50">
                  <img
                    src={product.imageUrl || product.mediumImageUrls?.[0]?.imageUrl || ""}
                    alt={product.itemName}
                    className="w-full aspect-square object-contain group-hover:scale-110 group-active:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Favourite button */}
                  <div className="absolute top-2 right-2 z-10">
                    <FavouriteButton
                      item={{
                        itemCode: product.itemCode,
                        itemName: product.itemName,
                        itemPrice: product.itemPrice,
                        itemUrl: product.itemUrl,
                        imageUrl: product.imageUrl || product.mediumImageUrls?.[0]?.imageUrl,
                        _source: product._source,
                      }}
                      size="sm"
                    />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 flex-1 mb-2 sm:mb-3 group-hover:text-green-700 group-active:text-green-700 transition-colors">
                  {product.itemName}
                </h3>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-green-600 text-sm sm:text-base lg:text-lg">
                      {formatPrice(product.itemPrice)}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {!loading && products.length > 0 && renderPagination()}
      </div>

      {/* Loading Overlay */}
      <ProductLoadingOverlay show={navigatingToProduct} />

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const categoryId = context.params?.categoryId as string;
  const subcategoryId = context.params?.subcategoryId as string;
  const page = parseInt((context.query.page as string) || "1", 10);
  const sort = (context.query.sort as string) || "";

  const category = allCategories.find((c) => c.id.toString() === categoryId);
  if (!category) return { notFound: true };

  const subcategory = category.subcategories?.find((s) => s.id.toString() === subcategoryId);
  if (!subcategory) return { notFound: true };

  const products = (await getProductsByGenreId(Number(subcategoryId), page)) || [];

  return {
    props: {
      products,
      categoryName: category.name,
      subcategoryName: subcategory.name,
      categoryId,
      subcategoryId,
      initialPage: page,
      initialSort: sort,
    },
  };
};

export default SubcategoryPage;
