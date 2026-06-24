import Link from "next/link";
import Image from "next/image";
import { useState, Fragment, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import useUserContext from "@/context/UserContext";
import { useRouter } from "next/router";
import { useMarketplace } from "@/context/MarketplaceContext";

import { allCategories as categories } from "@/data/categories";
import PrivacyNotice from '@/components/PrivacyNotice';
import Footer from '@/components/Footer';

// Hook для анимации при скролле
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true;
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, isVisible] as const;
}

// Hook для анимации чисел
function useCountUp(end: number, duration: number = 2000, shouldStart: boolean = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasAnimated.current) return;

    hasAnimated.current = true;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentCount = Math.floor(progress * end);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, shouldStart]);

  return count;
}

export default function Home() {
  const { user, login, signup, logout } = useUserContext();
  const router = useRouter();
  const { marketplace, setMarketplace } = useMarketplace();

  const [selectedCategory, setSelectedCategory] = useState<null | typeof categories[0]>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [showCategoryHint, setShowCategoryHint] = useState(false);
  const [hintPosition, setHintPosition] = useState({ top: 0, left: 0 });

  // Обновляем позицию подсказки при скролле
  useEffect(() => {
    if (!showCategoryHint) return;

    const updateHintPosition = () => {
      const categoriesBtn = document.getElementById('categories-button');
      if (categoriesBtn) {
        const rect = categoriesBtn.getBoundingClientRect();
        setHintPosition({
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2
        });
      }
    };

    // Обновляем позицию при скролле
    window.addEventListener('scroll', updateHintPosition);
    window.addEventListener('resize', updateHintPosition);

    return () => {
      window.removeEventListener('scroll', updateHintPosition);
      window.removeEventListener('resize', updateHintPosition);
    };
  }, [showCategoryHint]);

  // Hero slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      gradient: "from-slate-600 via-slate-500 to-gray-600",
      title: "Discover Japanese Excellence",
      subtitle: "Authentic products from Japan's top marketplaces",
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      highlight: "50,000+ Products"
    },
    {
      gradient: "from-blue-500 via-blue-400 to-cyan-500",
      title: "Shop from Rakuten",
      subtitle: "Japan's largest e-commerce platform with millions of products",
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      highlight: "50M+ Items Available"
    },
    {
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      title: "Fast Worldwide Shipping",
      subtitle: "Express delivery to 150+ countries with full tracking",
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      highlight: "EMS & FedEx Options"
    },
    {
      gradient: "from-emerald-500 via-teal-500 to-green-500",
      title: "Secure & Trusted",
      subtitle: "Safe payments, verified sellers, and 24/7 customer support",
      icon: (
        <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      highlight: "10,000+ Happy Customers"
    }
  ];

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  // Scroll animations
  const [heroRef, heroVisible] = useScrollAnimation();
  const [statsRef, statsVisible] = useScrollAnimation();
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation();

  // Анимированные числа для статистики
  const products = useCountUp(50000, 2000, statsVisible);
  const customers = useCountUp(10000, 2000, statsVisible);
  const countries = useCountUp(150, 2000, statsVisible);

  // Параллакс эффект
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isBonusEligible, setIsBonusEligible] = useState(false); // По умолчанию НЕ показываем, ждем проверки

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    secondName: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [searchQuery, setSearchQuery] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [categoryDropdownOpen]);

  // Проверка eligibility для бонуса
  useEffect(() => {
    if (user) {
      setIsBonusEligible(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        // Импортируем FingerprintJS динамически
        const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
        const fp = await FingerprintJS.load();
        const result = await fp.get();

        const response = await fetch('/api/check-bonus-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: result.visitorId }),
        });

        const data = await response.json();
        setIsBonusEligible(data.eligible);
      } catch (error) {
        console.error('[Bonus Check] Error:', error);
        setIsBonusEligible(false); // В случае ошибки НЕ показываем banner (безопасный подход)
      }
    };

    checkEligibility();
  }, [user]);

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup(signUpForm);
    setSignUpForm({ name: "", secondName: "", email: "", password: "" });
    setIsSignUpOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(loginForm.email, loginForm.password);
    if (success) setIsLoginOpen(false);
    setLoginForm({ email: "", password: "" });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen text-gray-900 font-sans antialiased" style={{ backgroundColor: '#faf9f6' }}>
      {/* Уведомление о приватности */}
      <PrivacyNotice />

      {/* Category Hint Arrow - показываем после выбора маркетплейса */}
      {showCategoryHint && hintPosition.top > 0 && (
        <div
          className="fixed z-50 pointer-events-none animate-fadeIn"
          style={{
            top: `${hintPosition.top}px`,
            left: `${hintPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="relative">
            {/* Glowing Arrow pointing up with pulse animation */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 animate-bounce">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-purple-400 blur-sm opacity-60"></div>
                {/* Arrow */}
                <div className="relative w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>
              </div>
            </div>

            {/* Beautiful gradient hint box */}
            <div className="relative animate-pulse-slow">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl blur-xl opacity-60"></div>

              {/* Main card */}
              <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-[2px] rounded-2xl shadow-2xl">
                <div className="bg-white rounded-[14px] px-5 sm:px-7 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    {/* Animated icon */}
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur opacity-40 animate-pulse"></div>
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Text content */}
                    <div className="flex-1">
                      <div className="font-black text-base sm:text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent leading-tight">
                        Choose a Category
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                        Start exploring products!
                      </div>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => setShowCategoryHint(false)}
                      className="pointer-events-auto flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Dark Modern */}
      <section ref={heroRef as React.RefObject<HTMLElement>} className="relative overflow-hidden bg-[#080808] min-h-screen flex items-center">

        {/* Big kanji background */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 lg:pr-24 pointer-events-none select-none overflow-hidden">
          <span
            className="text-[28vw] font-black text-white/[0.03] leading-none tracking-tighter"
            style={{ transform: `translateY(${scrollY * 0.08}px)` }}
          >
            日
          </span>
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px]" />

        {/* Green glow bottom-left */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
        {/* Subtle red glow top-right */}
        <div className="absolute -top-32 right-0 w-[400px] h-[400px] bg-red-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full">
          <div className="max-w-4xl">

            {/* Tag line */}
            <div className={`flex items-center gap-3 mb-8 ${heroVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
              <div className="h-px w-8 bg-green-500" />
              <span className="text-green-400 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase">Japan's finest — delivered worldwide</span>
            </div>

            {/* Main heading */}
            <h1 className={`text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white mb-8 ${heroVisible ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              Shop Japan.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                No borders.
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-gray-400 text-base sm:text-xl leading-relaxed max-w-xl mb-10 ${heroVisible ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
              Direct access to Rakuten & Yahoo Shopping. Authentic Japanese products, transparent pricing, fast international shipping.
            </p>

            {/* Bonus Banner */}
            {!user && isBonusEligible && (
              <div className={`relative w-full max-w-sm mb-10 p-5 rounded-2xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm overflow-hidden ${heroVisible ? 'animate-fadeInUp delay-250' : 'opacity-0'}`}>
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(34,197,94,0.1),transparent)] animate-spin-slow pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xl font-black text-green-400">¥</div>
                  <div>
                    <div className="text-white font-bold text-sm">Register & get ¥500 bonus</div>
                    <div className="text-gray-400 text-xs mt-0.5">Instant bonus added to your balance</div>
                  </div>
                  <button
                    onClick={() => window.dispatchEvent(new Event('openLeadMagnet'))}
                    className="ml-auto text-green-400 hover:text-green-300 transition-colors text-sm font-semibold whitespace-nowrap"
                  >
                    Claim →
                  </button>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-16 ${heroVisible ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
              <button
                onClick={() => router.push("/category/100371")}
                className="group relative px-8 py-4 bg-green-500 hover:bg-green-400 text-black text-base font-black rounded-xl transition-all hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center gap-2"
              >
                Start Shopping
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => router.push("/how-to-order")}
                className="px-8 py-4 bg-transparent text-white text-base font-bold rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all hover:scale-105 active:scale-95 touch-manipulation"
              >
                How It Works
              </button>
            </div>

            {/* Stats row */}
            <div className={`flex flex-wrap gap-8 sm:gap-12 border-t border-white/10 pt-8 ${heroVisible ? 'animate-fadeInUp delay-400' : 'opacity-0'}`}>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">50K+</div>
                <div className="text-gray-500 text-xs sm:text-sm mt-0.5">Products</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">150+</div>
                <div className="text-gray-500 text-xs sm:text-sm mt-0.5">Countries</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white">10K+</div>
                <div className="text-gray-500 text-xs sm:text-sm mt-0.5">Customers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white flex items-center gap-1">
                  <span className="text-green-400">●</span> Live
                </div>
                <div className="text-gray-500 text-xs sm:text-sm mt-0.5">Always online</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side — floating cards, desktop only */}
        <div className={`hidden lg:flex absolute right-0 top-0 h-full w-[44%] items-center justify-center pr-12 ${heroVisible ? 'animate-slideInRight delay-200' : 'opacity-0'}`}>
          <div className="relative w-full max-w-sm">

            {/* Central glow */}
            <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-3xl" />

            {/* Card 1 — top left */}
            <div className="absolute -top-8 -left-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl hover:bg-white/8 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-sm">🛍️</div>
              <div>
                <div className="text-white text-xs font-bold">Rakuten</div>
                <div className="text-gray-500 text-[10px]">50M+ products</div>
              </div>
            </div>

            {/* Card 2 — top right */}
            <div className="absolute -top-2 right-0 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl hover:bg-white/8 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm">🏪</div>
              <div>
                <div className="text-white text-xs font-bold">Yahoo Shopping</div>
                <div className="text-gray-500 text-[10px]">Best deals</div>
              </div>
            </div>

            {/* Main center card */}
            <div className="relative z-10 mt-16 bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Latest order</span>
                <span className="text-green-400 text-xs font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>Shipped</span>
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl">👟</div>
                <div>
                  <div className="text-white font-bold text-sm">Nike Air Force 1</div>
                  <div className="text-gray-400 text-xs mt-0.5">Size: 27cm · White</div>
                  <div className="text-green-400 text-sm font-black mt-1">¥12,800</div>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full w-[72%]" />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Tokyo warehouse</span>
                <span>72% — In transit</span>
              </div>
            </div>

            {/* Card 3 — bottom left */}
            <div className="absolute -bottom-6 -left-4 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl hover:bg-white/8 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-sm">✈️</div>
              <div>
                <div className="text-white text-xs font-bold">EMS Express</div>
                <div className="text-gray-500 text-[10px]">3–7 days worldwide</div>
              </div>
            </div>

            {/* Card 4 — bottom right */}
            <div className="absolute -bottom-2 right-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl hover:bg-white/8 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-sm">⭐</div>
              <div>
                <div className="text-white text-xs font-bold">4.9 / 5.0</div>
                <div className="text-gray-500 text-[10px]">10K+ reviews</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Anime Figures Banner */}
      <section className="relative overflow-hidden bg-[#0d0d14] py-14 sm:py-20 border-b border-white/5" style={{display:'block'}}>
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(236,72,153,0.1),transparent_60%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <span className="text-2xl">🎌</span>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400">Exclusive Category</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                Anime{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Figures
                </span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
                Authentic Japanese anime figures — Nendoroids, Figma, S.H.Figuarts and more. Sourced directly from Japan's top collectors' shops.
              </p>
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                {['ねんどろいど', 'figma', 'S.H.Figuarts', '限定品', 'プライズ'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => router.push('/anime')}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-base rounded-xl transition-all hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:scale-105 active:scale-95"
              >
                <span>Shop Anime Figures</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Right — decorative cards */}
            <div className="relative flex-shrink-0 w-full max-w-xs sm:max-w-sm lg:max-w-md">
              <div className="relative grid grid-cols-2 gap-3">
                {/* Glow */}
                <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />

                {[
                  { emoji: '🗡️', name: 'Demon Slayer', price: '¥12,800', tag: 'Nendoroid' },
                  { emoji: '🍥', name: 'Naruto', price: '¥8,500', tag: 'figma' },
                  { emoji: '⚡', name: 'Dragon Ball', price: '¥15,200', tag: 'S.H.Figuarts' },
                  { emoji: '🌸', name: 'Sailor Moon', price: '¥9,900', tag: 'Limited' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/8 hover:border-purple-500/30 transition-all hover:-translate-y-1"
                  >
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <div className="text-white text-xs font-bold mb-0.5">{item.name}</div>
                    <div className="text-gray-500 text-[10px] mb-2">{item.tag}</div>
                    <div className="text-purple-400 text-sm font-black">{item.price}</div>
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Marketplace Selection Section */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 sm:py-16 lg:py-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Choose Your Marketplace
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Shop from Japan's leading e-commerce platforms
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Rakuten Card */}
            <button
              onClick={() => {
                setMarketplace("rakuten");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Показываем подсказку через 1 секунду после скролла
                setTimeout(() => {
                  // Получаем позицию кнопки Categories
                  const categoriesBtn = document.getElementById('categories-button');
                  if (categoriesBtn) {
                    const rect = categoriesBtn.getBoundingClientRect();
                    setHintPosition({
                      top: rect.bottom + 10,
                      left: rect.left + rect.width / 2
                    });
                                      } else {
                                      }
                  setShowCategoryHint(true);
                  // Автоматически скрываем через 8 секунд
                  setTimeout(() => setShowCategoryHint(false), 8000);
                }, 1000);
              }}
              className={`group relative bg-white rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 ${
                marketplace === "rakuten"
                  ? "border-red-500 shadow-xl shadow-red-100"
                  : "border-gray-200 hover:border-red-300"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Rakuten Icon */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all ${
                  marketplace === "rakuten" ? "bg-red-500" : "bg-red-100 group-hover:bg-red-500"
                }`}>
                  <svg className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                    marketplace === "rakuten" ? "text-white" : "text-red-500 group-hover:text-white"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Rakuten</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Japan's largest marketplace with 50M+ products
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 w-full pt-2">
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Wide product selection</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Verified sellers</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Best for variety</span>
                  </div>
                </div>

                {/* Selected Badge */}
                {marketplace === "rakuten" && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
            </button>

            {/* Yahoo Shopping Card */}
            <button
              onClick={() => {
                setMarketplace("yahoo");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Показываем подсказку через 1 секунду после скролла
                setTimeout(() => {
                  // Получаем позицию кнопки Categories
                  const categoriesBtn = document.getElementById('categories-button');
                  if (categoriesBtn) {
                    const rect = categoriesBtn.getBoundingClientRect();
                    setHintPosition({
                      top: rect.bottom + 10,
                      left: rect.left + rect.width / 2
                    });
                                      } else {
                                      }
                  setShowCategoryHint(true);
                  // Автоматически скрываем через 8 секунд
                  setTimeout(() => setShowCategoryHint(false), 8000);
                }, 1000);
              }}
              className={`group relative bg-white rounded-2xl p-6 sm:p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 ${
                marketplace === "yahoo"
                  ? "border-purple-500 shadow-xl shadow-purple-100"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Yahoo Icon */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all ${
                  marketplace === "yahoo" ? "bg-purple-500" : "bg-purple-100 group-hover:bg-purple-500"
                }`}>
                  <svg className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                    marketplace === "yahoo" ? "text-white" : "text-purple-500 group-hover:text-white"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Yahoo Shopping</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Popular platform with competitive prices
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 w-full pt-2">
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Great deals</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Trusted brands</span>
                  </div>
                  <div className="flex items-center gap-2 text-left">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">Best for value</span>
                  </div>
                </div>

                {/* Selected Badge */}
                {marketplace === "yahoo" && (
                  <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section - NEW! */}
      <section ref={statsRef as React.RefObject<HTMLElement>} className="bg-white py-12 sm:py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className={`text-center transition-all duration-700 ${statsVisible ? 'animate-fadeInScale opacity-100' : 'opacity-0'}`}>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
                {products > 0 ? products.toLocaleString() : '50,000'}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">Products Available</div>
            </div>
            <div className={`text-center transition-all duration-700 ${statsVisible ? 'animate-fadeInScale delay-100 opacity-100' : 'opacity-0'}`}>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
                {customers > 0 ? customers.toLocaleString() : '10,000'}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">Happy Customers</div>
            </div>
            <div className={`text-center transition-all duration-700 ${statsVisible ? 'animate-fadeInScale delay-200 opacity-100' : 'opacity-0'}`}>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
                {countries > 0 ? countries : '150'}+
              </div>
              <div className="text-sm sm:text-base text-gray-600 font-medium">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef as React.RefObject<HTMLElement>} className="bg-white py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-12 sm:mb-16 lg:mb-20 ${howItWorksVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-full mb-4 sm:mb-6">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto px-4">
              Four simple steps from browsing to delivery
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className={`relative group ${howItWorksVisible ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
              <div className="card-3d bg-white border border-gray-100 rounded-xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 mb-1 sm:mb-2">STEP 01</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Browse & Select</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Choose from thousands of authentic Japanese products on Rakuten and Yahoo Shopping
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden lg:block absolute top-12 left-full w-12 h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 2 */}
            <div className={`relative group ${howItWorksVisible ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
              <div className="card-3d bg-white border border-gray-100 rounded-xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 mb-1 sm:mb-2">STEP 02</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Place Order</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Complete your order and we'll purchase the item for you from the Japanese marketplace
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden lg:block absolute top-12 left-full w-12 h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 3 */}
            <div className={`relative group ${howItWorksVisible ? 'animate-fadeInUp delay-300' : 'opacity-0'}`}>
              <div className="card-3d bg-white border border-gray-100 rounded-xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 mb-1 sm:mb-2">STEP 03</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Warehouse Processing</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Item arrives at our warehouse. Choose extra services: package photos, double protection, consolidation
                </p>
              </div>
              {/* Connector line */}
              <div className="hidden lg:block absolute top-12 left-full w-12 h-0.5 bg-gray-200"></div>
            </div>

            {/* Step 4 */}
            <div className={`relative group ${howItWorksVisible ? 'animate-fadeInUp delay-400' : 'opacity-0'}`}>
              <div className="card-3d bg-white border border-gray-100 rounded-xl p-6 sm:p-8 text-center transition-all duration-300 hover:shadow-lg hover:border-gray-200">
                <div className="mb-4 sm:mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-900 rounded-lg mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 mb-1 sm:mb-2">STEP 04</div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Shipping & Delivery</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  Pay the shipping invoice and receive your package safely at your doorstep
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Feature Section - Right Side Large Image */}
      <section className="relative bg-white py-12 sm:py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-4 sm:space-y-6 lg:pr-12">
              <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 border border-green-100 rounded-full">
                <span className="text-[10px] sm:text-xs font-semibold text-green-700 uppercase tracking-wide">Why Choose Japrix</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Your trusted partner for Japanese shopping
              </h2>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                We connect you with authentic Japanese products from trusted marketplaces, handling everything from purchase to international delivery.
              </p>

              <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">100% Authentic Products</h3>
                    <p className="text-sm sm:text-base text-gray-600">Direct from official Japanese retailers - Rakuten and Yahoo Shopping</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Transparent Pricing</h3>
                    <p className="text-sm sm:text-base text-gray-600">No hidden fees - see exact costs before you order</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Worldwide Delivery</h3>
                    <p className="text-sm sm:text-base text-gray-600">Safe and secure shipping to 150+ countries</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 sm:pt-4">
                <button
                  onClick={() => router.push("/how-to-order")}
                  className="group inline-flex items-center gap-2 bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 active:bg-gray-800 hover:shadow-lg active:shadow-lg transition-all hover:scale-105 active:scale-95 touch-manipulation"
                >
                  Learn More
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-active:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Image - Hidden on mobile, visible from lg */}
            <div className="hidden lg:block lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-[45%] lg:h-[600px]">
              <div className="relative h-full overflow-hidden rounded-2xl group">
                <Image
                  src="/feature-image.jpg"
                  alt="Japanese Shopping Experience"
                  fill
                  sizes="50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Модалка регистрации */}
      <Transition appear show={isSignUpOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsSignUpOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">Sign Up</Dialog.Title>
                  <form onSubmit={handleSignUpSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Name"
                      required
                      value={signUpForm.name}
                      onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <input
                      type="text"
                      placeholder="Second Name"
                      required
                      value={signUpForm.secondName}
                      onChange={(e) => setSignUpForm({ ...signUpForm, secondName: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#10B981] text-white py-2 rounded-lg hover:bg-[#0f9c6e] transition"
                    >
                      Submit
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Модалка входа */}
      <Transition appear show={isLoginOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsLoginOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">Log In</Dialog.Title>
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#10B981] text-white py-2 rounded-lg hover:bg-[#0f9c6e] transition"
                    >
                      Log In
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Модалка с информацией о пользователе */}
      <Transition appear show={isInfoOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsInfoOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">My Info</Dialog.Title>
                  {user ? (
                    <div className="space-y-2">
                      <p>
                        <b>Name:</b> {user.name} {user.secondName}
                      </p>
                      <p>
                        <b>Email:</b> {user.email}
                      </p>
                    </div>
                  ) : (
                    <p>You are not logged in.</p>
                  )}
                  <button
                    className="mt-6 w-full bg-[#10B981] text-white py-2 rounded-lg hover:bg-[#0f9c6e] transition"
                    onClick={() => setIsInfoOpen(false)}
                  >
                    Close
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <Footer />
    </main>
  );
}
