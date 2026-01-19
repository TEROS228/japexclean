"use client";

import React, { useState, useRef, useEffect, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Search } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { clearAuthData } from "@/lib/auth";
import { useMarketplace } from "@/context/MarketplaceContext";
import { useCart } from "@/context/CartContext";
import useUserContext from "@/context/UserContext";
import { yahooCategories, YahooCategory } from "@/data/yahoo-categories";
import SignUpModal from "./SignUpModal";
import LoginModal from "./LoginModal";
import UserInfoModal from "./UserInfoModal";
import ClientOnly from "./ClientOnly";
import CurrencySelector from "./CurrencySelector";
import LanguageSelector from "./LanguageSelector";

interface Category {
  id: number;
  name: string;
  subcategories?: Category[];
}

export default function Header({ categories, onCategoryMenuRequest }: { categories?: Category[], onCategoryMenuRequest?: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { marketplace, setMarketplace } = useMarketplace();
  const { cart } = useCart();
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [showHowToOrder, setShowHowToOrder] = useState(false);
  const howToOrderRef = useRef<HTMLDivElement>(null);

  // Закрытие мобильного меню при клике вне его
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Функция переключения маркетплейса с редиректом на главную
  const handleMarketplaceChange = (newMarketplace: 'rakuten' | 'yahoo') => {
    if (marketplace === newMarketplace) return;

    // Проверяем текущий путь
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/';
    const isCartPage = currentPath === '/cart';

    // Если на главной или в корзине, просто меняем маркетплейс
    if (isHomePage || isCartPage) {
      setMarketplace(newMarketplace);
      return;
    }

    // Для остальных страниц - переходим на главную, затем меняем маркетплейс
    router.push('/');
    setTimeout(() => {
      setMarketplace(newMarketplace);
    }, 100);
  };

  // Выбираем категории в зависимости от маркетплейса
  const displayCategories = marketplace === "yahoo"
    ? yahooCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        subcategories: cat.subcategories?.map(sub => ({
          id: sub.id,
          name: sub.name
        }))
      }))
    : categories;

  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Модалки
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Получаем данные пользователя из UserContext
  const { user, logout: userLogout } = useUserContext();

  useEffect(() => {
    setMounted(true);

    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }

    // Check for category menu flag
    const checkInterval = setInterval(() => {
      const shouldOpen = sessionStorage.getItem('openCategoryMenu');
      if (shouldOpen === 'true') {
        sessionStorage.removeItem('openCategoryMenu');
        setCategoryDropdownOpen(true);
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node) && !searchInputRef.current?.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
      if (howToOrderRef.current && !howToOrderRef.current.contains(event.target as Node)) {
        setShowHowToOrder(false);
      }
    }
    if (categoryDropdownOpen || showSearchHistory || showHowToOrder) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [categoryDropdownOpen, showSearchHistory, showHowToOrder]);

  // Сбрасываем выбранную категорию при смене маркетплейса
  useEffect(() => {
    setSelectedCategory(null);
  }, [marketplace]);

  const onSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setCategoryDropdownOpen(false);
    router.push(`/category/${cat.id}`);
  };

  const saveToHistory = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Add to history, avoiding duplicates and keeping max 10 items
    const newHistory = [
      trimmedQuery,
      ...searchHistory.filter(item => item !== trimmedQuery)
    ].slice(0, 10);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveToHistory(searchTerm);
      router.push(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
      setShowSearchHistory(false);
      searchInputRef.current?.blur();
    }
  };

  const handleHistoryClick = (query: string) => {
    setSearchTerm(query);
    setShowSearchHistory(false);
    router.push(`/search?query=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await userLogout(); // Используем logout из UserContext (выходит из NextAuth если нужно)
    clearAuthData();
    window.location.href = "/";
  };

  if (!mounted) {
    return (
      <>
        <header className="bg-white border-b border-gray-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Image
                src="/logo.jpg"
                alt="Japrix"
                width={200}
                height={67}
                className="object-contain h-[67px] w-auto"
              />
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-white shadow-sm">
                  <ShoppingCart size={22} className="text-gray-400" />
                </div>
                <div className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-white shadow-sm">
                  <User size={22} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200/50 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            {/* Mobile Menu Button - показывается только на мобильных */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-50 transition-all touch-manipulation flex-shrink-0"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <div
              className="cursor-pointer group flex-shrink-0 flex-grow md:flex-grow-0"
              onClick={() => router.push("/")}
            >
              <Image
                src="/logo.jpg"
                alt="Japrix"
                width={200}
                height={67}
                className="object-contain transition-all group-hover:scale-105 active:scale-95 h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px] w-auto"
              />
            </div>

            {/* Marketplace Switcher + How to Order - скрыт на мобильных, показывается в меню */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative flex items-center gap-0 p-0.5 bg-white rounded-full border-2 border-gray-200 shadow-sm">
                {/* Sliding background indicator */}
                <div
                  className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-gradient-to-br rounded-full transition-all duration-300 ease-out shadow-md ${
                    marketplace === "rakuten"
                      ? "left-0.5 from-green-500 to-emerald-600"
                      : "left-[calc(50%+0px)] from-red-500 to-red-600"
                  }`}
                />

                <button
                  onClick={() => handleMarketplaceChange("rakuten")}
                  className={`relative z-10 px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 touch-manipulation ${
                    marketplace === "rakuten"
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700 active:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="hidden xs:inline sm:inline">Rakuten</span>
                  </span>
                </button>

                <button
                  onClick={() => handleMarketplaceChange("yahoo")}
                  className={`relative z-10 px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 touch-manipulation ${
                    marketplace === "yahoo"
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-700 active:text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="hidden xs:inline sm:inline">Yahoo</span>
                  </span>
                </button>
              </div>

              {/* How to Order Button */}
              <div className="relative" ref={howToOrderRef}>
                <button
                  onClick={() => setShowHowToOrder(!showHowToOrder)}
                  className="group w-9 h-9 rounded-full border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 active:border-blue-500 active:bg-blue-50 transition-all flex items-center justify-center shadow-sm hover:shadow-md touch-manipulation"
                  title="How to order from marketplaces"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 group-active:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showHowToOrder && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl z-50 animate-scaleIn overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How to Order
                      </h3>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Instructions */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 font-medium">
                          Find products on Japanese marketplaces:
                        </p>
                        <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                          <li>Visit Rakuten or Yahoo marketplace</li>
                          <li>Find the product you want</li>
                          <li>Copy the product URL</li>
                          <li>Paste it in our search bar above</li>
                          <li>Click "Search" to order</li>
                        </ol>
                      </div>

                      {/* Marketplace Links */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-700">Visit Marketplaces:</p>
                        <div className="flex flex-col gap-2">
                          <a
                            href="https://www.rakuten.co.jp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-2 bg-green-50 hover:bg-green-100 active:bg-green-100 border border-green-200 rounded-lg transition-colors group"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">Rakuten</span>
                            </span>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <a
                            href="https://shopping.yahoo.co.jp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-100 border border-red-200 rounded-lg transition-colors group"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700">Yahoo Shopping</span>
                            </span>
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              {/* Currency and Language selectors - скрыты на мобильных */}
              <div className="hidden md:flex items-center gap-1 sm:gap-2">
                <CurrencySelector />
                <LanguageSelector />
              </div>

              <Link href="/cart">
                <div className="group relative w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white hover:border-green-500 active:border-green-500 hover:bg-green-50 active:bg-green-50 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm hover:shadow-md active:shadow-md touch-manipulation">
                  <ShoppingCart size={18} className="sm:w-5 sm:h-5 text-gray-600 group-hover:text-green-600 group-active:text-green-600 transition-colors" />
                  {cart.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-lg">
                      {cart.length}
                    </div>
                  )}
                </div>
              </Link>

              <Menu as="div" className="relative">
                <Menu.Button className="group w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white hover:border-green-500 active:border-green-500 hover:bg-green-50 active:bg-green-50 transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-sm hover:shadow-md active:shadow-md touch-manipulation">
                  <User size={18} className="sm:w-5 sm:h-5 text-gray-600 group-hover:text-green-600 group-active:text-green-600 transition-colors" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-44 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl z-10 overflow-hidden">
                    <div className="py-1">
                      {user ? (
                        <>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={`block w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                                  active ? "bg-green-50 text-green-700" : "text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  My Profile
                                </div>
                              </Link>
                            )}
                          </Menu.Item>
                          <div className="border-t border-gray-100"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                                  active ? "bg-red-50 text-red-600" : "text-red-500"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                  Log out
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        </>
                      ) : (
                        <>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setIsLoginOpen(true)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                                  active ? "bg-green-50 text-green-700" : "text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  Log In
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setIsSignUpOpen(true)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                                  active ? "bg-green-50 text-green-700" : "text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                  </svg>
                                  Sign Up
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        </>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>

          {/* Bottom Row - Search */}
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Category selector - скрыт на мобильных, показывается в меню */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              {/* Gradient border wrapper */}
              <div id="categories-button" className="relative p-[3px] rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-[length:200%_auto] animate-gradient shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="group relative overflow-hidden px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-[10px] bg-white text-sm sm:text-base font-black hover:bg-gray-50 active:bg-gray-50 transition-colors flex items-center gap-2 sm:gap-3 whitespace-nowrap w-full"
                >
                  {/* Icon */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>

                  {/* Gradient animated text */}
                  <span className="hidden sm:inline bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent font-black tracking-wide bg-[length:200%_auto] animate-gradient">
                    {selectedCategory ? selectedCategory.name : "Categories"}
                  </span>

                  {/* Dropdown arrow */}
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 text-gray-700 ${
                      categoryDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {categoryDropdownOpen && (
                <div className="absolute mt-2 w-64 max-h-96 overflow-auto bg-white border-2 border-gray-100 rounded-2xl shadow-2xl z-50 animate-scaleIn">
                  {displayCategories && displayCategories.length > 0 ? (
                    displayCategories.map((cat) => (
                      <div key={cat.id} className="relative group">
                        <button
                          onClick={() => onSelectCategory(cat)}
                          onMouseEnter={() => setHoveredCategory(cat.id)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={`block w-full text-left px-5 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-0 flex items-center justify-between ${
                            marketplace === "yahoo"
                              ? "text-gray-700 hover:bg-red-50 hover:text-red-700"
                              : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                          }`}
                        >
                          <span className="flex-1">{cat.name}</span>
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span>{cat.subcategories.length}</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          )}
                        </button>

                        {/* Подкатегории */}
                        {hoveredCategory === cat.id &&
                         cat.subcategories &&
                         cat.subcategories.length > 0 && (
                          <div
                            className="absolute left-full top-0 ml-1 w-72 max-h-96 overflow-auto bg-white border-2 border-gray-100 rounded-2xl shadow-2xl"
                            style={{ zIndex: 9999 }}
                            onMouseEnter={() => setHoveredCategory(cat.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          >
                            {cat.subcategories.map((subcat) => (
                              <button
                                key={subcat.id}
                                onClick={() => {
                                  onSelectCategory(subcat);
                                  setHoveredCategory(null);
                                }}
                                className={`block w-full text-left px-4 py-2 text-xs font-medium transition-colors border-b border-gray-50 last:border-0 ${
                                  marketplace === "yahoo"
                                    ? "text-gray-600 hover:bg-red-50 hover:text-red-700"
                                    : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                                }`}
                              >
                                {subcat.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-gray-500 text-sm text-center">No categories</div>
                  )}
                </div>
              )}
            </div>

            {/* Search box */}
            <div className="flex-1 relative">
              <form
                onSubmit={onSearchSubmit}
                className="relative group w-full"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search or paste link"
                  className="w-full rounded-full border-2 border-gray-200 bg-white pl-8 sm:pl-12 pr-16 sm:pr-28 text-sm sm:text-base font-medium text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all shadow-sm focus:shadow-md"
                  style={{ height: '48px', lineHeight: '48px', paddingTop: '0', paddingBottom: '0' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (searchHistory.length > 0 && !searchTerm) {
                      setShowSearchHistory(true);
                    }
                  }}
                  onBlur={() => {
                    // Save to history when user exits search with text
                    if (searchTerm.trim()) {
                      saveToHistory(searchTerm);
                    }
                  }}
                />
                <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={16} className="sm:w-[19px] sm:h-[19px] text-gray-400 group-focus-within:text-green-600 transition-colors" />
                </div>
                <button
                  type="submit"
                  className="shimmer bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm sm:text-base rounded-full hover:from-green-700 hover:to-emerald-700 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '8px 20px', height: 'auto' }}
                >
                  <span className="hidden sm:inline">Search</span>
                  <Search size={16} className="sm:hidden" />
                </button>
              </form>

              {/* Search History Dropdown */}
              {showSearchHistory && searchHistory.length > 0 && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden z-50 animate-fadeIn"
                >
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                      <button
                        onClick={() => {
                          setSearchHistory([]);
                          localStorage.removeItem('searchHistory');
                          setShowSearchHistory(false);
                        }}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {searchHistory.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistoryClick(query)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                      >
                        <Search size={16} className="text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium truncate">
                          {query}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Marketplace Switcher */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Marketplace
              </label>
              <div className="relative flex items-center gap-0 p-0.5 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div
                  className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-gradient-to-br rounded-lg transition-all duration-300 ease-out shadow-md ${
                    marketplace === "rakuten"
                      ? "left-0.5 from-green-500 to-emerald-600"
                      : "left-[calc(50%+0px)] from-red-500 to-red-600"
                  }`}
                />
                <button
                  onClick={() => {
                    handleMarketplaceChange("rakuten");
                    setMobileMenuOpen(false);
                  }}
                  className={`relative z-10 flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 touch-manipulation ${
                    marketplace === "rakuten"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Rakuten
                  </span>
                </button>
                <button
                  onClick={() => {
                    handleMarketplaceChange("yahoo");
                    setMobileMenuOpen(false);
                  }}
                  className={`relative z-10 flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 touch-manipulation ${
                    marketplace === "yahoo"
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Yahoo
                  </span>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Categories
              </label>
              <button
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-100 rounded-xl border-2 border-gray-200 transition-colors touch-manipulation"
              >
                <span className="flex items-center gap-2 font-medium text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Browse All Categories
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${mobileCategoriesOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Categories List */}
              {mobileCategoriesOpen && displayCategories && displayCategories.length > 0 && (
                <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
                  {displayCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        router.push(`/category/${cat.id}`);
                        setMobileMenuOpen(false);
                        setMobileCategoriesOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-lg ml-2 border-l-2 touch-manipulation ${
                        marketplace === "yahoo"
                          ? "text-gray-700 hover:bg-red-50 active:bg-red-50 border-red-200"
                          : "text-gray-700 hover:bg-green-50 active:bg-green-50 border-green-200"
                      }`}
                    >
                      <span className="text-left flex-1">{cat.name}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency & Language */}
            <div className="mb-6 space-y-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Settings
              </label>
              <div className="space-y-2">
                <CurrencySelector />
                <div className="w-full">
                  <LanguageSelector />
                </div>
              </div>
            </div>

            {/* How to Order Info */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                How to Order
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-gray-700 font-medium">Find products on marketplaces:</p>
                <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                  <li>Visit Rakuten or Yahoo</li>
                  <li>Copy product URL</li>
                  <li>Paste in search bar</li>
                  <li>Click "Search" to order</li>
                </ol>
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href="https://www.rakuten.co.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 bg-green-50 hover:bg-green-100 active:bg-green-100 border border-green-200 rounded-lg transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Rakuten</span>
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="https://shopping.yahoo.co.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-100 border border-red-200 rounded-lg transition-colors touch-manipulation"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Yahoo</span>
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Links
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium text-gray-700">Profile</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/cart');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="font-medium text-gray-700">Shopping Cart</span>
                  {cart.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Модальные окна */}
      <ClientOnly>
        <SignUpModal
          isOpen={isSignUpOpen}
          onClose={() => setIsSignUpOpen(false)}
          onSwitchToLogin={() => {
            setIsSignUpOpen(false);
            setIsLoginOpen(true);
          }}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignUp={() => {
            setIsLoginOpen(false);
            setIsSignUpOpen(true);
          }}
        />
        {isInfoOpen && <UserInfoModal onClose={() => setIsInfoOpen(false)} />}
      </ClientOnly>

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </>
  );
}
