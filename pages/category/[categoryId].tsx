import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { allCategories } from "@/data/categories";
import { yahooCategories, getYahooSubcategoryWithParent } from "@/data/yahoo-categories";
import { getProductsByGenreId } from "@/lib/rakuten";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useCurrency } from "@/context/CurrencyContext";
import ProductLoadingOverlay from "@/components/ProductLoadingOverlay";
import FavouriteButton from "@/components/FavouriteButton";

interface Props {
  products: any[];
  categoryName: string;
  categoryId: string;
}

const CategoryPage: NextPage<Props> = ({ products: initialProducts, categoryName, categoryId }) => {
  const router = useRouter();
  const { marketplace, setMarketplace } = useMarketplace();
  const { formatPrice, getCurrencySymbol } = useCurrency();

  const [sortOrder, setSortOrder] = useState("");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [priceMinInput, setPriceMinInput] = useState<string>("");
  const [priceMaxInput, setPriceMaxInput] = useState<string>("");

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  // Для Yahoo категорий НЕ устанавливаем пустой массив в начальное значение
  const [loadedPages, setLoadedPages] = useState<{ [key: number]: any[] }>(
    initialProducts.length > 0 ? { 1: initialProducts } : {}
  );
  const [loading, setLoading] = useState(false);
  const [maxPageLoaded, setMaxPageLoaded] = useState(1);
  const [isRestoring, setIsRestoring] = useState(false);
  const hasLoadedRef = useRef(false);
  const [navigatingToProduct, setNavigatingToProduct] = useState(false);

  // Определяем, является ли это Yahoo категорией (главная или подкатегория)
  const isYahooMainCategory = yahooCategories.some((c) => c.id.toString() === categoryId);

  // Проверяем, является ли подкатегорией Yahoo
  const isYahooSubcategory = yahooCategories.some((c) =>
    c.subcategories?.some(sub => sub.id.toString() === categoryId)
  );

  const isYahooCategory = isYahooMainCategory || isYahooSubcategory;

  // Получаем категорию и подкатегории
  const category = allCategories.find((c) => c.id.toString() === categoryId);

  // Проверяем, является ли текущая категория подкатегорией Rakuten
  let rakutenParentCategory = null;
  let isRakutenSubcategory = false;

  for (const cat of allCategories) {
    const subcategory = cat.subcategories?.find((sub) => sub.id.toString() === categoryId);
    if (subcategory) {
      rakutenParentCategory = cat;
      isRakutenSubcategory = true;
      break;
    }
  }

  // Получаем подкатегории
  let subcategories: Array<{ id: number; name: string }> = [];

  // Получаем информацию о родительской категории для breadcrumbs
  let parentCategory: { id: number; name: string } | null = null;

  if (isYahooMainCategory) {
    // Yahoo главная категория - показываем её подкатегории
    const yahooCategory = yahooCategories.find((c) => c.id.toString() === categoryId);
    subcategories = (yahooCategory?.subcategories || []).map(sub => ({ id: sub.id, name: sub.name }));
  } else if (isYahooSubcategory) {
    // Yahoo подкатегория - показываем все подкатегории родительской категории (как в Rakuten)
    const parentInfo = getYahooSubcategoryWithParent(Number(categoryId));
    if (parentInfo) {
      subcategories = (parentInfo.parentCategory.subcategories || []).map(sub => ({ id: sub.id, name: sub.name }));
      parentCategory = { id: parentInfo.parentCategory.id, name: parentInfo.parentCategory.name };
    }
  } else if (isRakutenSubcategory && rakutenParentCategory) {
    // Rakuten подкатегория - показываем все подкатегории родительской категории
    subcategories = rakutenParentCategory.subcategories || [];
    parentCategory = { id: rakutenParentCategory.id, name: rakutenParentCategory.name };
  } else if (category) {
    // Rakuten главная категория - показываем её подкатегории
    subcategories = category.subcategories || [];
  }

  // Синхронизируем маркетплейс с типом категории (БЕЗ события marketplaceChanged)
  useEffect(() => {
    if (isYahooCategory && marketplace !== 'yahoo') {
      setMarketplace('yahoo', true); // silent = true
    } else if (!isYahooCategory && marketplace !== 'rakuten') {
      setMarketplace('rakuten', true); // silent = true
    }
  }, [isYahooCategory, marketplace, setMarketplace]);

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
  const handleProductClick = (product: any) => (e: React.MouseEvent) => {
    e.preventDefault();

    // Показываем анимацию загрузки
    setNavigatingToProduct(true);

    sessionStorage.setItem(`scroll-category-${categoryId}`, window.scrollY.toString());
    sessionStorage.setItem(`page-category-${categoryId}`, currentPage.toString());
    sessionStorage.setItem(`data-category-${categoryId}`, JSON.stringify(loadedPages));
    sessionStorage.setItem(`priceMin-category-${categoryId}`, priceMin);
    sessionStorage.setItem(`priceMax-category-${categoryId}`, priceMax);

    // Для Yahoo товаров сохраняем данные товара
    if (product._source === 'yahoo') {
      console.log('[Category] Saving Yahoo product to sessionStorage:', product.itemCode, 'price:', product.itemPrice);
      sessionStorage.setItem(`yahoo-product-${product.itemCode}`, JSON.stringify(product));
    }

    router.push(`/product/${product.itemCode}`);
  };

  // --- Восстановление позиции скролла и данных ---
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(`scroll-category-${categoryId}`);
    const savedPage = sessionStorage.getItem(`page-category-${categoryId}`);
    const savedData = sessionStorage.getItem(`data-category-${categoryId}`);
    const savedPriceMin = sessionStorage.getItem(`priceMin-category-${categoryId}`);
    const savedPriceMax = sessionStorage.getItem(`priceMax-category-${categoryId}`);

    if (savedScrollPosition && savedPage && savedData) {
      setIsRestoring(true);
      const pageNum = parseInt(savedPage);
      setCurrentPage(pageNum);

      // Восстанавливаем загруженные данные
      try {
        const parsedData = JSON.parse(savedData);
        setLoadedPages(parsedData);
        setMaxPageLoaded(Math.max(...Object.keys(parsedData).map(Number)));
      } catch (e) {
        console.error('Error parsing saved data:', e);
        setIsRestoring(false);
      }

      // Восстанавливаем фильтры по цене
      if (savedPriceMin) {
        setPriceMin(savedPriceMin);
        setPriceMinInput(savedPriceMin);
      }
      if (savedPriceMax) {
        setPriceMax(savedPriceMax);
        setPriceMaxInput(savedPriceMax);
      }

      // Восстанавливаем позицию после загрузки
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem(`scroll-category-${categoryId}`);
        sessionStorage.removeItem(`page-category-${categoryId}`);
        sessionStorage.removeItem(`data-category-${categoryId}`);
        sessionStorage.removeItem(`priceMin-category-${categoryId}`);
        sessionStorage.removeItem(`priceMax-category-${categoryId}`);
        setIsRestoring(false);
      }, 100);
    } else {
      setIsRestoring(false);
    }
  }, [categoryId]);

  // --- Обновление товаров при смене категории ---
  useEffect(() => {
    console.log('[CategoryPage] useEffect triggered', {
      categoryId,
      initialProductsLength: initialProducts?.length,
      isRestoring,
      loadedPagesKeys: Object.keys(loadedPages)
    });

    const savedData = sessionStorage.getItem(`data-category-${categoryId}`);

    // Если восстанавливаем из sessionStorage, ничего не делаем
    if (savedData || isRestoring) {
      console.log('[CategoryPage] Skipping - restoring from session');
      return;
    }

    // Показываем loading сразу при смене категории
    setLoading(true);

    // Сбрасываем состояние при смене категории
    console.log('[CategoryPage] Resetting state for new category');
    setCurrentPage(1);
    setMaxPageLoaded(1);
    setSortOrder("");
    setPriceMin("");
    setPriceMax("");
    setPriceMinInput("");
    setPriceMaxInput("");
    hasLoadedRef.current = false;

    // Если есть товары от SSR/клиентской навигации - используем их
    if (initialProducts && initialProducts.length > 0) {
      console.log('[CategoryPage] Using initialProducts:', initialProducts.length);
      setLoadedPages({ 1: initialProducts });
      // Небольшая задержка чтобы показать loading анимацию
      setTimeout(() => {
        setLoading(false);
      }, 300);
      hasLoadedRef.current = true;
    } else {
      // Иначе загружаем через API
      console.log('[CategoryPage] Loading via API');
      setLoadedPages({});
      setLoading(true);
      hasLoadedRef.current = true;
      const timer = setTimeout(() => {
        fetchPage(1);
      }, 10);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // --- Сброс при смене маркетплейса (ОТКЛЮЧЕНО для страницы категории) ---
  // Не нужно слушать событие marketplaceChanged потому что:
  // 1. Маркетплейс определяется автоматически по типу категории
  // 2. При смене категории все данные сбрасываются в другом useEffect
  // 3. Событие может конфликтовать с автоматическим переключением

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPage = async (pageNum: number, order?: string) => {
    if (pageNum < 1) return;
    const usedOrder = order ?? sortOrder;

    // Проверяем кеш только если сортировка и фильтры не изменились
    // Если передан параметр order, значит сортировка изменилась и кеш не валиден
    if (!order && loadedPages[pageNum] && loadedPages[pageNum].length > 0) {
      setCurrentPage(pageNum);
      return;
    }

    setLoading(true);
    try {
      // Добавляем параметры фильтрации по цене только если они заполнены
      const minPriceValue = priceMin?.trim();
      const maxPriceValue = priceMax?.trim();
      const minPriceParam = minPriceValue && minPriceValue !== '0' ? `&minPrice=${encodeURIComponent(minPriceValue)}` : '';
      const maxPriceParam = maxPriceValue && maxPriceValue !== '0' ? `&maxPrice=${encodeURIComponent(maxPriceValue)}` : '';

      // Используем isYahooCategory напрямую вместо marketplace для надежности
      const endpoint = isYahooCategory
        ? `/api/yahoo/products?categoryId=${encodeURIComponent(categoryId)}&page=${pageNum}&sort=${encodeURIComponent(usedOrder)}`
        : `/api/products?genreId=${encodeURIComponent(categoryId)}&page=${pageNum}&sort=${encodeURIComponent(usedOrder)}${minPriceParam}${maxPriceParam}`;

      console.log('[Category Page] Fetching:', { categoryId, pageNum, sort: usedOrder, minPrice: minPriceValue, maxPrice: maxPriceValue, endpoint });

      const res = await fetch(endpoint);
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('[Category Page] Received data:', { count: data?.length, isArray: Array.isArray(data), sort: usedOrder });

      if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        setLoadedPages((prev) => ({ ...prev, [pageNum]: [] }));
        setLoading(false);
        return;
      }

      if (data.length === 0) {
        console.warn('[Category Page] API returned empty array for:', { categoryId, pageNum, sort: usedOrder });
      }

      // API уже возвращает отсортированные и отфильтрованные данные
      setLoadedPages((prev) => ({ ...prev, [pageNum]: data }));
      setCurrentPage(pageNum);
      setMaxPageLoaded(Math.max(maxPageLoaded, pageNum));

      // Safe scroll with fallback
      try {
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch (e) {
        console.error('Scroll error:', e);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setLoadedPages((prev) => ({ ...prev, [pageNum]: [] }));
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = async (order: string) => {
    setSortOrder(order);
    setSortDropdownOpen(false);

    // Очищаем кеш и сбрасываем на первую страницу
    setLoadedPages({});
    setCurrentPage(1);
    setMaxPageLoaded(1);

    // Загружаем первую страницу с новой сортировкой (фильтры применятся автоматически)
    await fetchPage(1, order);
  };

  const handleSubcategoryClick = (subcategoryId: number) => {
    // Подкатегории открываются как обычные категории
    router.push(`/category/${subcategoryId}`);
  };

  // Применить фильтр по цене
  const applyPriceFilter = () => {
    setPriceMin(priceMinInput);
    setPriceMax(priceMaxInput);

    // Сбрасываем на первую страницу и перезагружаем с новыми фильтрами
    setLoadedPages({});
    setCurrentPage(1);
    setMaxPageLoaded(1);

    if (!isRestoring) {
      // Небольшая задержка чтобы state обновился
      setTimeout(() => fetchPage(1), 50);
    }
  };

  // Получить товары для текущей страницы (фильтрация происходит на сервере)
  const currentProducts = loadedPages[currentPage] || [];

  console.log(`[Category] 📄 Showing page ${currentPage}: ${currentProducts.length} products`);

  const renderPagination = () => {
    const visiblePages = 6;
    const start = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
    const end = start + visiblePages - 1;

    const pages: any[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchPage(i)}
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
          onClick={() => currentPage > 1 && fetchPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 active:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold text-gray-700 transition-all hover:scale-110 active:scale-95 touch-manipulation"
        >
          ←
        </button>
        {pages}
        <button
          onClick={() => fetchPage(currentPage + 1)}
          disabled={currentProducts.length === 0}
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
        {/* Хлебные крошки */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm mb-4 sm:mb-8 animate-fadeInUp overflow-x-auto">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-600 hover:text-green-600 active:text-green-600 transition-colors font-medium group whitespace-nowrap touch-manipulation"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 group-active:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {parentCategory ? (
            <>
              <Link
                href={`/category/${parentCategory.id}`}
                className="text-gray-600 hover:text-green-600 active:text-green-600 transition-colors font-medium whitespace-nowrap touch-manipulation"
              >
                {parentCategory.name}
              </Link>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-semibold whitespace-nowrap">{categoryName}</span>
            </>
          ) : (
            <span className="text-gray-900 font-semibold whitespace-nowrap">{categoryName}</span>
          )}
        </nav>

        {/* Заголовок категории */}
        <div className="mb-6 sm:mb-10 animate-fadeInUp delay-100">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2 sm:mb-3">
            {categoryName}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
            {currentProducts.length} products available
          </p>
        </div>

        <div className="flex justify-end items-center mb-4 sm:mb-8 gap-2 sm:gap-3 flex-wrap animate-fadeInUp delay-150" style={{ position: 'relative', zIndex: 1 }}>
          {/* Подкатегории */}
          <div className="relative" style={{ zIndex: 9999 }} ref={categoriesDropdownRef}>
            <button
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              className="group relative px-5 sm:px-7 py-2.5 sm:py-3.5 bg-white text-gray-900 text-sm sm:text-base font-semibold rounded-xl border-2 border-gray-900 hover:bg-gray-900 hover:text-white active:bg-gray-900 active:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:shadow-lg hover:-translate-y-0.5 active:-translate-y-0.5 flex items-center gap-2 sm:gap-3 touch-manipulation overflow-hidden"
            >
              {/* Анимированный фон при наведении */}
              <div className="absolute inset-0 bg-gray-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>

              <svg className="relative z-10 w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="relative z-10 tracking-wide">Subcategories</span>
              <svg className={`relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all duration-300 ${categoriesDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {categoriesDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-96 overflow-auto bg-white border-2 border-gray-200 rounded-2xl animate-scaleIn" style={{ zIndex: 99999, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}>
                {subcategories.length > 0 ? subcategories.map(subcat => (
                  <button
                    key={subcat.id}
                    onClick={() => handleSubcategoryClick(subcat.id)}
                    className="block w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {subcat.name}
                  </button>
                )) : <div className="p-5 text-gray-500 text-sm text-center">No subcategories</div>}
              </div>
            )}
          </div>

          {/* Сортировка */}
          <div className="relative" style={{ zIndex: 9999 }} ref={sortDropdownRef}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="group relative px-5 sm:px-7 py-2.5 sm:py-3.5 bg-white text-gray-900 text-sm sm:text-base font-semibold rounded-xl border-2 border-gray-900 hover:bg-gray-900 hover:text-white active:bg-gray-900 active:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:shadow-lg hover:-translate-y-0.5 active:-translate-y-0.5 flex items-center gap-2 sm:gap-3 touch-manipulation overflow-hidden"
            >
              {/* Анимированный фон при наведении */}
              <div className="absolute inset-0 bg-gray-900 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>

              <svg className="relative z-10 w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span className="relative z-10 tracking-wide">Sort by price</span>
              <svg className={`relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all duration-300 ${sortDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden animate-scaleIn" style={{ zIndex: 99999, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}>
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
                  className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "highest" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => handleSortChange("highest")}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Highest Price
                  </div>
                </button>
                <button
                  className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${sortOrder === "popular" || sortOrder === "" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => handleSortChange("popular")}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Most Popular
                  </div>
                </button>
                <button
                  className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors ${sortOrder === "rating" ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => handleSortChange("rating")}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Highest Rated
                  </div>
                </button>
              </div>
            )}
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
                    setLoadedPages({});
                    setCurrentPage(1);
                    setMaxPageLoaded(1);
                    fetchPage(1);
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
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{currentProducts.length}</span>
            <span className="text-gray-600 text-sm sm:text-base">items</span>
          </div>
        </div>

        {/* Товары */}
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
        ) : currentProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg mb-2">No products found</p>
            <p className="text-gray-400 text-sm">{priceMin || priceMax ? "Try adjusting the price range" : "Try selecting a different category"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 relative z-0">
            {currentProducts.map(product => (
              <a
                key={product.itemCode}
                href={`/product/${product.itemCode}`}
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
                    <span className="font-bold text-green-600 text-sm sm:text-base lg:text-lg" suppressHydrationWarning>
                      {formatPrice(product.itemPrice)}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/** Pagination */}
        {!loading && renderPagination()}
      </div>

      {/* Loading Overlay */}
      <ProductLoadingOverlay show={navigatingToProduct} />
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const categoryId = context.params?.categoryId as string;

  // Ищем в Rakuten категориях (главные категории)
  let category = allCategories.find((c) => c.id.toString() === categoryId);
  let categoryName = category?.name || '';
  let isRakutenCategory = !!category;

  // Если не нашли в главных категориях Rakuten, ищем в подкатегориях Rakuten
  if (!category) {
    for (const cat of allCategories) {
      const subcategory = cat.subcategories?.find((sub) => sub.id.toString() === categoryId);
      if (subcategory) {
        categoryName = subcategory.name;
        category = cat;
        isRakutenCategory = true;
        break;
      }
    }
  }

  // Если не нашли в Rakuten, ищем в Yahoo категориях и подкатегориях
  if (!category) {
    const { yahooCategories, getYahooCategoryById } = await import('@/data/yahoo-categories');

    // Проверяем главные категории Yahoo
    const yahooCategory = yahooCategories.find((c) => c.id.toString() === categoryId);
    if (yahooCategory) {
      categoryName = yahooCategory.name;
    } else {
      // Проверяем подкатегории Yahoo
      const yahooCat = getYahooCategoryById(Number(categoryId));
      if (yahooCat) {
        categoryName = yahooCat.name;
      } else {
        return { notFound: true };
      }
    }
  }

  // Загружаем товары на сервере
  let products: any[] = [];
  if (isRakutenCategory) {
    // Rakuten
    try {
      products = await getProductsByGenreId(Number(categoryId), 1) || [];
    } catch (error) {
      console.error('Error loading Rakuten products:', error);
    }
  } else {
    // Yahoo - загружаем и трансформируем в формат Rakuten
    try {
      const { getYahooProductsByCategory, searchYahooProducts, convertYahooToRakutenFormat } = await import('@/lib/yahoo-shopping');
      const { yahooCategories } = await import('@/data/yahoo-categories');

      // Проверяем является ли главной категорией
      const isMainCategory = yahooCategories.some((c) => c.id.toString() === categoryId);

      let yahooProducts: any[] = [];
      if (isMainCategory) {
        // Для главной категории используем поиск по японскому названию
        const category = yahooCategories.find((c) => c.id.toString() === categoryId);
        if (category) {
          yahooProducts = await searchYahooProducts(category.jpName, 1, 20, '-review') || [];
        }
      } else {
        // Для подкатегории используем genre_category_id
        yahooProducts = await getYahooProductsByCategory(Number(categoryId), 1, 20, '-review') || [];
      }

      // Трансформируем Yahoo товары в формат Rakuten с улучшенными фото
      products = yahooProducts.map((p: any) => convertYahooToRakutenFormat(p));
    } catch (error) {
      console.error('Error loading Yahoo products:', error);
    }
  }

  return {
    props: {
      products,
      categoryName,
      categoryId,
    },
  };
};

export default CategoryPage;
