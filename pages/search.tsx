import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductLoadingOverlay from "@/components/ProductLoadingOverlay";

export default function SearchPage() {
  const router = useRouter();
  const { query } = router.query;
  const { marketplace } = useMarketplace();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState<{ [key: number]: any[] }>({});
  const [maxPageLoaded, setMaxPageLoaded] = useState(1);
  const [navigatingToProduct, setNavigatingToProduct] = useState(false);

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

  const handleSearch = async (searchTerm: string, pageNum: number = 1) => {
    setLoading(true);
    setError("");

    // Сбрасываем при новом поиске
    if (pageNum === 1) {
      setCurrentPage(1);
      setLoadedPages({});
      setMaxPageLoaded(1);
    }

    try {
      const endpoint = marketplace === "yahoo"
        ? `/api/yahoo/search?keyword=${encodeURIComponent(searchTerm)}&page=${pageNum}`
        : `/api/search?query=${encodeURIComponent(searchTerm)}&page=${pageNum}`;

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
      setLoading(false);
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
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 font-medium">Searching products...</p>
            </div>
          </div>
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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-semibold text-gray-900">{loadedPages[currentPage]?.length || 0}</span>
                <span className="text-gray-600">products on page {currentPage}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {loadedPages[currentPage]?.map((product) => (
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

            {/* Пагинация */}
            <div className="flex justify-center items-center gap-3 mt-8 flex-wrap">
              <button
                onClick={() => currentPage > 1 && fetchPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95"
              >
                ←
              </button>

              {Array.from({ length: 6 }, (_, i) => {
                const pageNum = Math.max(currentPage - 3, 1) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchPage(pageNum)}
                    className={`w-10 h-10 rounded-xl border-2 font-semibold transition-all hover:scale-110 active:scale-95 ${
                      pageNum === currentPage
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-500 shadow-lg"
                        : "border-gray-200 bg-white hover:border-green-300 text-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => fetchPage(currentPage + 1)}
                disabled={loadedPages[currentPage]?.length === 0}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay */}
      <ProductLoadingOverlay show={navigatingToProduct} />
    </main>
  );
}
