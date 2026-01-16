import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductLoadingOverlay from "@/components/ProductLoadingOverlay";

// Компонент анимации загрузки поиска
function SearchLoadingAnimation({ marketplace }: { marketplace: string }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    { icon: "🔍", text: "Connecting to Japanese marketplace...", tip: "We're searching through millions of products" },
    { icon: "📦", text: "Scanning product databases...", tip: "Finding the best deals for you" },
    { icon: "💎", text: "Analyzing prices and availability...", tip: "Quality products from trusted sellers" },
    { icon: "✨", text: "Preparing your results...", tip: "Almost there! Hang tight" }
  ];

  useEffect(() => {
    // Меняем стадию каждые 3 секунды
    const stageInterval = setInterval(() => {
      setStage(prev => (prev + 1) % stages.length);
    }, 3000);

    // Плавный прогресс бар
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95; // Максимум 95% пока не загрузится
        return prev + Math.random() * 5;
      });
    }, 200);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentStage = stages[stage];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Главная анимация */}
      <div className="relative mb-8">
        {/* Внешнее кольцо */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-32 h-32 border-4 border-green-200 rounded-full border-t-green-500"></div>
        </div>

        {/* Среднее кольцо */}
        <div className="absolute inset-2 animate-spin-reverse">
          <div className="w-28 h-28 border-4 border-blue-200 rounded-full border-r-blue-500"></div>
        </div>

        {/* Центральный значок */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="text-6xl animate-bounce-slow">
            {currentStage.icon}
          </div>
        </div>

        {/* Пульсирующие точки */}
        <div className="absolute -top-2 -right-2">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
        </div>
        <div className="absolute -bottom-2 -left-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Текущая стадия */}
      <div className="text-center max-w-md mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-fadeIn">
          {currentStage.text}
        </h3>
        <p className="text-sm text-gray-600 animate-fadeIn">
          {currentStage.tip}
        </p>
      </div>

      {/* Прогресс бар */}
      <div className="w-full max-w-md mb-8">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Информационные карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
          <div className="text-3xl mb-2">🚀</div>
          <p className="text-sm font-semibold text-gray-800">Fast Delivery</p>
          <p className="text-xs text-gray-600">From Japan</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
          <div className="text-3xl mb-2">🛡️</div>
          <p className="text-sm font-semibold text-gray-800">Secure Payment</p>
          <p className="text-xs text-gray-600">100% Protected</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-sm font-semibold text-gray-800">Best Prices</p>
          <p className="text-xs text-gray-600">Direct from sellers</p>
        </div>
      </div>

      {/* Индикаторы стадий */}
      <div className="flex gap-2 mt-8">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === stage
                ? 'w-8 bg-green-500'
                : index < stage
                ? 'w-2 bg-green-300'
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 4s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { query } = router.query;
  const { marketplace } = useMarketplace();
  const { formatPrice, currency, getCurrencySymbol, convertToJPY, convertPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState<{ [key: number]: any[] }>({});
  const [maxPageLoaded, setMaxPageLoaded] = useState(1);
  const [navigatingToProduct, setNavigatingToProduct] = useState(false);

  // Фильтры по цене
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>("");

  // Не используется (было для Yahoo фильтрации, но убрали)
  // const [loadingMore, setLoadingMore] = useState(false);
  // const [filteredPage, setFilteredPage] = useState(1);

  // Ref для отслеживания последнего выполненного запроса
  const lastSearchRef = useRef<string>("");

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

  // Функция для сохранения позиции скролла перед переходом на товар
  const handleProductClick = (product?: any) => (e: React.MouseEvent) => {
    e.preventDefault();

    // Показываем анимацию загрузки
    setNavigatingToProduct(true);

    sessionStorage.setItem(`scroll-search-${query}`, window.scrollY.toString());
    sessionStorage.setItem(`page-search-${query}`, currentPage.toString());
    sessionStorage.setItem(`data-search-${query}`, JSON.stringify(loadedPages));

    // Если это Yahoo товар, сохраняем его в sessionStorage
    if (product && product._source === 'yahoo') {
      const yahooProductKey = `yahoo-product-${product.itemCode}`;
      sessionStorage.setItem(yahooProductKey, JSON.stringify(product));
      console.log('[Search] Saved Yahoo product to sessionStorage:', product.itemCode);
    }

    const url = product.itemUrl
      ? `/product/${product.itemCode}?url=${encodeURIComponent(product.itemUrl)}`
      : `/product/${product.itemCode}`;
    router.push(url);
  };

  // Восстановление позиции скролла и данных
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(`scroll-search-${query}`);
    const savedPage = sessionStorage.getItem(`page-search-${query}`);
    const savedData = sessionStorage.getItem(`data-search-${query}`);

    if (savedScrollPosition && savedPage && savedData) {
      setIsRestoring(true);
      const pageNum = parseInt(savedPage);
      setCurrentPage(pageNum);

      try {
        const parsedData = JSON.parse(savedData);
        setLoadedPages(parsedData);
        setMaxPageLoaded(Math.max(...Object.keys(parsedData).map(Number)));

        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition));
          sessionStorage.removeItem(`scroll-search-${query}`);
          sessionStorage.removeItem(`page-search-${query}`);
          sessionStorage.removeItem(`data-search-${query}`);
          setIsRestoring(false);
        }, 100);
      } catch (e) {
        console.error('Error parsing saved data:', e);
        setIsRestoring(false);
      }
      return;
    }
  }, [query]);

  useEffect(() => {
    if (!query || typeof query !== "string") return;

    // Проверяем, есть ли сохраненные данные - если есть, не выполняем поиск
    const savedData = sessionStorage.getItem(`data-search-${query}`);
    if (savedData || isRestoring) {
      return; // Данные будут восстановлены в другом useEffect
    }

    const searchQuery = query.trim();

    // Предотвращаем дублирующие запросы
    const searchKey = `${searchQuery}:${marketplace}`;
    if (lastSearchRef.current === searchKey) {
      return;
    }
    lastSearchRef.current = searchKey;

    // Сбрасываем фильтры при новом поисковом запросе
    setMinPrice("");
    setMaxPrice("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");

    console.log('[Search] Query received:', searchQuery);

    // Проверяем, является ли это URL от Rakuten
    const rakutenUrlMatch = searchQuery.match(/item\.rakuten\.co\.jp\/[^\/]+\/([^\/\?]+)/);

    // Проверяем, является ли это URL от Yahoo Shopping (все варианты)
    const yahooUrlMatch = searchQuery.match(/shopping\.yahoo\.co\.jp|paypaymall\.yahoo\.co\.jp/);

    console.log('[Search] Rakuten URL match:', rakutenUrlMatch ? 'YES' : 'NO');
    console.log('[Search] Yahoo URL match:', yahooUrlMatch ? 'YES' : 'NO');

    if (rakutenUrlMatch) {
      // Это URL Rakuten - загружаем товар по URL
      console.log('[Search] Loading Rakuten product by URL');
      handleProductByUrl(searchQuery);
    } else if (yahooUrlMatch) {
      // Это URL Yahoo Shopping - загружаем товар по URL
      console.log('[Search] Loading Yahoo product by URL');
      handleProductByYahooUrl(searchQuery);
    } else {
      // Это обычный текстовый поиск
      console.log('[Search] Performing text search');
      handleSearch(searchQuery);
    }
  }, [query, isRestoring, marketplace]);

  // --- Сброс при смене маркетплейса ---
  useEffect(() => {
    const handleMarketplaceChange = () => {
      // Сбрасываем ref при смене маркетплейса
      lastSearchRef.current = "";

      if (query && typeof query === "string") {
        const searchQuery = query.trim();
        const rakutenUrlMatch = searchQuery.match(/item\.rakuten\.co\.jp\/[^\/]+\/([^\/\?]+)/);
        const yahooUrlMatch = searchQuery.match(/shopping\.yahoo\.co\.jp/);

        if (!rakutenUrlMatch && !yahooUrlMatch) {
          // Только для обычного поиска, не для URL
          handleSearch(searchQuery);
        }
      }
    };

    window.addEventListener('marketplaceChanged', handleMarketplaceChange);
    return () => window.removeEventListener('marketplaceChanged', handleMarketplaceChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // --- Сброс фильтра при смене валюты ---
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Очищаем фильтры при смене валюты
      setMinPrice("");
      setMaxPrice("");
      setAppliedMinPrice("");
      setAppliedMaxPrice("");

      // Перезагружаем без фильтров
      if (query && typeof query === "string" && !isRestoring) {
        setCurrentPage(1);
        setLoadedPages({});
        setMaxPageLoaded(1);
        handleSearch(query.trim(), 1, false);
      }
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isRestoring]);

  const handleProductByUrl = async (url: string) => {
    setLoading(true);
    setError("");

    try {
      // Используем API route для получения товара
      const res = await fetch(`/api/product/by-url?url=${encodeURIComponent(url)}`);

      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await res.json();

      if (data.success && data.product) {
        console.log("✅ Product found");
        // Показываем товар как карточку в результатах поиска
        setProducts([data.product]);
        setLoadedPages({ 1: [data.product] });
        setCurrentPage(1);
        setMaxPageLoaded(1);
      } else {
        throw new Error("Product not found");
      }
    } catch (err: any) {
      console.error("Product fetch error:", err);
      setError(err.message || "Failed to load product from URL. Please try searching by product name instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductByYahooUrl = async (url: string) => {
    setLoading(true);
    setError("");

    try {
      console.log("🔍 Fetching Yahoo product from URL:", url);

      // Используем новый endpoint для парсинга Yahoo страницы напрямую
      const res = await fetch(`/api/yahoo/product-by-url?url=${encodeURIComponent(url)}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch Yahoo product");
      }

      const data = await res.json();

      if (data.success && data.product && data.product.itemCode) {
        console.log("✅ Yahoo product found:", data.product.itemName);

        // Показываем товар как карточку в результатах поиска
        setProducts([data.product]);
        setLoadedPages({ 1: [data.product] });
        setCurrentPage(1);
        setMaxPageLoaded(1);
      } else {
        throw new Error("Yahoo product not found");
      }
    } catch (err: any) {
      console.error("Yahoo product fetch error:", err);
      setError(err.message || "Failed to load product from Yahoo URL. Please try searching by product name instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (
    searchTerm: string,
    pageNum: number = 1,
    isFilterLoading: boolean = false,
    filterMin?: string,
    filterMax?: string
  ) => {
    if (!isFilterLoading) {
      setLoading(true);
    }
    setError("");

    // Сбрасываем при новом поиске
    if (pageNum === 1 && !isFilterLoading) {
      setCurrentPage(1);
      setLoadedPages({});
      setMaxPageLoaded(1);
      if (!filterMin && !filterMax) {
        // Сбрасываем фильтры только если не передали новые
        setMinPrice("");
        setMaxPrice("");
      }
    }

    try {
      let endpoint = "";

      if (marketplace === "yahoo") {
        endpoint = `/api/yahoo/search?keyword=${encodeURIComponent(searchTerm)}&page=${pageNum}`;
      } else {
        // Базовый endpoint для Rakuten
        endpoint = `/api/search?query=${encodeURIComponent(searchTerm)}&page=${pageNum}`;

        // Используем переданные фильтры или текущие appliedMinPrice/appliedMaxPrice
        const minToUse = filterMin !== undefined ? filterMin : appliedMinPrice;
        const maxToUse = filterMax !== undefined ? filterMax : appliedMaxPrice;

        // Добавляем фильтры по цене через API (НОВАЯ СИСТЕМА)
        if (minToUse) {
          endpoint += `&minPrice=${encodeURIComponent(minToUse)}`;
        }
        if (maxToUse) {
          endpoint += `&maxPrice=${encodeURIComponent(maxToUse)}`;
        }
      }

      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      const results = data.products || data || [];

      setLoadedPages(prev => ({ ...prev, [pageNum]: results }));
      setCurrentPage(pageNum);
      setMaxPageLoaded(Math.max(maxPageLoaded, pageNum));
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search products");
    } finally {
      if (!isFilterLoading) {
        setLoading(false);
      }
    }
  };

  const fetchPage = async (pageNum: number) => {
    if (pageNum < 1 || !query || typeof query !== "string") return;

    // Если страница уже загружена, просто переключаемся
    if (loadedPages[pageNum] && loadedPages[pageNum].length > 0) {
      setCurrentPage(pageNum);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    await handleSearch(query.trim(), pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== ФИЛЬТРАЦИЯ (только Rakuten) =====

  // Получение всех загруженных товаров
  const getAllLoadedProducts = () => {
    const allProducts: any[] = [];
    for (let i = 1; i <= maxPageLoaded; i++) {
      if (loadedPages[i]) {
        allProducts.push(...loadedPages[i]);
      }
    }
    return allProducts;
  };

  // Получение отфильтрованных товаров (только для отображения статистики)
  const getFilteredProducts = () => {
    return getAllLoadedProducts();
  };

  // Получение товаров для текущей страницы
  const getCurrentPageProducts = () => {
    return loadedPages[currentPage] || [];
  };

  // Форматирование числа с пробелами (10000 -> 10 000)
  const formatNumberWithSpaces = (value: string): string => {
    // Убираем все пробелы и нечисловые символы
    const cleanValue = value.replace(/\s/g, '').replace(/[^\d]/g, '');
    if (!cleanValue) return '';

    // Добавляем пробелы каждые 3 цифры с конца
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Получение чистого числа из форматированной строки
  const getCleanNumber = (value: string): string => {
    return value.replace(/\s/g, '');
  };

  // Обработчик изменения минимальной цены
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithSpaces(e.target.value);
    setMinPrice(formatted);
  };

  // Обработчик изменения максимальной цены
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithSpaces(e.target.value);
    setMaxPrice(formatted);
  };

  // Применение фильтра (только Rakuten)
  const applyPriceFilter = async () => {
    const minInCurrentCurrency = getCleanNumber(minPrice);
    const maxInCurrentCurrency = getCleanNumber(maxPrice);

    // Конвертируем в JPY для API
    const minInJPY = minInCurrentCurrency ? String(convertToJPY(Number(minInCurrentCurrency))) : "";
    const maxInJPY = maxInCurrentCurrency ? String(convertToJPY(Number(maxInCurrentCurrency))) : "";

    setAppliedMinPrice(minInJPY);
    setAppliedMaxPrice(maxInJPY);

    // Rakuten: API фильтрация, перезагружаем
    setCurrentPage(1);
    setLoadedPages({});
    setMaxPageLoaded(1);

    if (query && typeof query === "string") {
      await handleSearch(query.trim(), 1, false, minInJPY, maxInJPY);
    }
  };

  // Сброс фильтра (только Rakuten)
  const clearPriceFilter = async () => {
    setMinPrice("");
    setMaxPrice("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");

    // Перезагружаем без фильтров
    setCurrentPage(1);
    setLoadedPages({});
    setMaxPageLoaded(1);

    if (query && typeof query === "string") {
      await handleSearch(query.trim(), 1, false);
    }
  };

  // Рендер пагинации
  const renderPagination = () => {
    // Обычная пагинация
    const visiblePages = 6;
    const start = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
    const end = start + visiblePages - 1;

    const pages: any[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchPage(i)}
          disabled={loading}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 text-sm sm:text-base font-semibold transition-all hover:scale-110 active:scale-95 touch-manipulation disabled:opacity-50 ${
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
          onClick={() => fetchPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 active:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95 touch-manipulation"
        >
          ←
        </button>
        {pages}
        <button
          onClick={() => fetchPage(currentPage + 1)}
          disabled={loading}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 active:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95 touch-manipulation"
        >
          →
        </button>
      </div>
    );
  };

  if (!query) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Enter a search query to find products</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-500 mb-6 space-x-1">
          <Link href="/" className="text-green-600 hover:underline font-medium">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Search Results</span>
        </div>

        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Search Results
        </h1>
        <p className="text-gray-600 mb-8">
          Showing results for: <span className="font-semibold text-gray-900">"{query}"</span>
        </p>

        {loading ? (
          <SearchLoadingAnimation marketplace={marketplace} />
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 text-lg font-medium mb-2">{error}</p>
            <p className="text-gray-500">Please try a different search term</p>
          </div>
        ) : loadedPages[currentPage]?.length === 0 || Object.keys(loadedPages).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-6">No products found for your search</p>
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </span>
            </Link>
          </div>
        ) : (
          <>
            {/* Price Filter - только для Rakuten */}
            {marketplace === "rakuten" && (
            <div className="mb-8 bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-lg">Price Filter</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="text"
                      placeholder={`Min ${getCurrencySymbol()}`}
                      value={minPrice}
                      onChange={handleMinPriceChange}
                      className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    />
                  </div>

                  <span className="text-gray-400 font-bold">—</span>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="text"
                      placeholder={`Max ${getCurrencySymbol()}`}
                      value={maxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={applyPriceFilter}
                    disabled={(!minPrice && !maxPrice) || loading}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    Apply Filter
                  </button>

                  {(appliedMinPrice || appliedMaxPrice) && !loading && (
                    <button
                      onClick={clearPriceFilter}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm border-2 border-red-200"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Показываем активные фильтры (только Rakuten) */}
              {(appliedMinPrice || appliedMaxPrice) && (
                <div className="mt-4 pt-4 border-t-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      <span className="text-xs text-green-700 font-medium">
                        Active filter: {appliedMinPrice ? formatPrice(Number(appliedMinPrice)) : `${getCurrencySymbol()}0`} - {appliedMaxPrice ? formatPrice(Number(appliedMaxPrice)) : '∞'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl mb-6 w-fit">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-semibold text-gray-900">{getCurrentPageProducts().length}</span>
              <span className="text-gray-600">products shown</span>
              {(appliedMinPrice || appliedMaxPrice) && (
                <span className="text-xs text-green-600 font-semibold ml-2">
                  (filtered by price)
                </span>
              )}
            </div>

            {(appliedMinPrice || appliedMaxPrice) && getFilteredProducts().length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl mb-6">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-900 text-xl font-bold mb-2">No products match your price filter</p>
                <p className="text-gray-600 mb-6">
                  Try adjusting your price range. We have {getAllLoadedProducts().length} products loaded.
                </p>
                <button
                  onClick={clearPriceFilter}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  Clear Price Filter
                </button>
              </div>
            ) : getCurrentPageProducts().length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {getCurrentPageProducts().map((product) => (
                <a
                  key={product.itemCode}
                  href={product.itemUrl ? `/product/${product.itemCode}?url=${encodeURIComponent(product.itemUrl)}` : `/product/${product.itemCode}`}
                  onClick={handleProductClick(product)}
                  className="group bg-white border-2 border-gray-100 rounded-2xl p-4 hover:shadow-2xl hover:border-green-300 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-50">
                    <img
                      src={product.imageUrl || product.mediumImageUrls?.[0]?.imageUrl || "/placeholder.png"}
                      alt={product.itemName}
                      className="w-full aspect-square object-contain group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 mb-3 group-hover:text-green-700 transition-colors">
                    {product.itemName}
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl px-3 py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-green-600 text-lg" suppressHydrationWarning>
                        {formatPrice(product.itemPrice)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
              </div>
            ) : null}

            {/* Pagination */}
            {getCurrentPageProducts().length > 0 && renderPagination()}
          </>
        )}
      </div>

      {/* Loading Overlay */}
      <ProductLoadingOverlay show={navigatingToProduct} />
    </main>
  );
}
