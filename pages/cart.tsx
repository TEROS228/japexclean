import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/router';
import { getCompatibleAuthToken, isAuthenticated } from '@/lib/auth';
import LoginModal from "@/components/LoginModal";
import SignUpModal from "@/components/SignUpModal";
import { useCurrency } from "@/context/CurrencyContext";

export default function CartPage() {
  const { cart, removeFromCart, clearCart, increaseQuantity, decreaseQuantity } = useCart();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [currencyKey, setCurrencyKey] = useState(0);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [displayAmount, setDisplayAmount] = useState("10 000");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card">("card");
  const [loading, setLoading] = useState(false);

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  const [serverBalance, setServerBalance] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [shippingPolicyAccepted, setShippingPolicyAccepted] = useState(false);
  const [preferredShippingCarrier, setPreferredShippingCarrier] = useState<'ems' | 'fedex' | ''>('');
  const [shippingCountry, setShippingCountry] = useState<string>('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [packages, setPackages] = useState<any[]>([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Service fee: ¥1000 за каждый уникальный товар
  // Уникальность определяется по rakutenId или базовому названию товара
  const getProductIdentifier = (item: any) => {
    // Используем rakutenId если есть, иначе базовое название
    if (item.rakutenId) return item.rakutenId;

    // Извлекаем базовое название (до вариантов)
    return item.title.split(/[\[\(（]/)[0].trim();
  };

  const uniqueProducts = new Set(cart.map(item => getProductIdentifier(item))).size;
  const serviceFee = uniqueProducts * 1000;

  const grandTotal = total + serviceFee;

  // Broadcast обновления между вкладками
  const broadcastUpdate = (type: string) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('japrix-sync');
        channel.postMessage({ type, timestamp: Date.now() });
        channel.close();
      } catch (error) {
        console.error('Broadcast error:', error);
      }
    }
  };

  // Получаем баланс с сервера
  const fetchServerBalance = async () => {
    const token = getCompatibleAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/balance/update', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServerBalance(data.balance);
        console.log('Cart balance updated:', data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Загружаем адреса доставки
  const fetchAddresses = async () => {
    const token = getCompatibleAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
          setSelectedAddressId(data.addresses[0].id);
          setShippingCountry(data.addresses[0].country);

          // Автоматически определяем предпочтительную службу доставки
          const country = data.addresses[0].country.toLowerCase();
          const emsRestricted = ['united states', 'usa', 'us', 'iceland', 'serbia', 'moldova', 'georgia'];
          if (emsRestricted.some(c => country.includes(c))) {
            setPreferredShippingCarrier('fedex');
          } else {
            setPreferredShippingCarrier('ems');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const fetchPackages = async () => {
    const token = getCompatibleAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/user/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  // Проверяем заблокирован ли адрес (есть ли активный shipping request на этот адрес)
  const isAddressLocked = (addressId: string) => {
    return packages.some(pkg =>
      pkg.shippingAddressId === addressId &&
      pkg.shippingRequested === true &&
      pkg.status !== 'shipped' &&
      pkg.status !== 'delivered'
    );
  };

  // Hide header when any modal is open
  useEffect(() => {
    const header = document.querySelector('header');
    if ((showTopUpModal || showOrderSuccess || showAddressModal) && header) {
      header.style.display = 'none';
    } else if (header) {
      header.style.display = '';
    }

    return () => {
      if (header) {
        header.style.display = '';
      }
    };
  }, [showTopUpModal, showOrderSuccess, showAddressModal]);

  useEffect(() => {
    setMounted(true);

    // Проверяем аутентификацию
    if (!isAuthenticated()) {
      return;
    }

    // Загружаем баланс, адреса доставки и посылки при монтировании
    fetchServerBalance();
    fetchAddresses();
    fetchPackages();

    // Listen for currency changes
    const handleCurrencyChange = (e: any) => {
      console.log('💱 [CartPage] Currency changed to:', e.detail, '- forcing re-render');
      setCurrencyKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);

    // Слушаем события обновления баланса
    const handleBalanceUpdate = () => {
      console.log('Balance update event received in cart');
      fetchServerBalance();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, []);

  // Отдельный эффект для обработки успешного пополнения
  useEffect(() => {
    // Проверяем параметр URL после успешного пополнения
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('topup') === 'success') {
      console.log('Topup success detected, refreshing balance...');

      // Даем время для обработки, затем обновляем баланс
      const timer = setTimeout(() => {
        fetchServerBalance();

        // Очищаем URL параметры
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Сбрасываем галочку TOS только при открытии модалки
  useEffect(() => {
    if (showTopUpModal) {
      setTosAccepted(false);
    }
  }, [showTopUpModal]);

  // Автоматически переключаем на FedEx для стран где EMS не доступен
  useEffect(() => {
    const emsRestrictedCountries = ['United States', 'USA', 'Iceland', 'Serbia', 'Moldova', 'Georgia'];
    if (emsRestrictedCountries.includes(shippingCountry) && preferredShippingCarrier === 'ems') {
      setPreferredShippingCarrier('fedex');
    }
  }, [shippingCountry, preferredShippingCarrier]);

  // Проверка наличия адреса
  const checkAddressBeforePayment = async () => {
    const token = getCompatibleAuthToken();
    if (!token) {
      alert("Please log in first");
      return false;
    }

    try {
      const response = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Проверяем наличие адреса из БД
        const hasAddress = data.addresses && data.addresses.length > 0;

        if (!hasAddress) {
          setShowAddressModal(true);
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking address:', error);
      return false;
    }
  };

  // Оплата с баланса
  const handlePayWithBalance = async () => {
    const token = getCompatibleAuthToken();
    if (!token) {
      alert("Please log in first");
      return;
    }

    // Проверяем адрес перед оплатой
    const hasAddress = await checkAddressBeforePayment();
    if (!hasAddress) return;

    if (serverBalance < grandTotal) {
      return alert("Not enough balance");
    }

    try {
      // Получаем страну доставки из адреса
      let shippingCountry = '';
      try {
        const addressResponse = await fetch('/api/user/addresses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (addressResponse.ok) {
          const addressData = await addressResponse.json();
          if (addressData.addresses && addressData.addresses.length > 0) {
            shippingCountry = addressData.addresses[0].country;
          }
        }
      } catch (e) {
        console.error('Error fetching addresses:', e);
      }

      // Списание через защищенный API
      const paymentResponse = await fetch('/api/balance/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: -grandTotal,
          description: 'Cart purchase'
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const paymentData = await paymentResponse.json();

      // Оформление заказа
      const orderResponse = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart,
          total: grandTotal,
          shippingCountry: shippingCountry || 'Unknown',
          preferredShippingCarrier: preferredShippingCarrier,
          addressId: selectedAddressId
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Order creation failed');
      }

      // Обновляем баланс на клиенте
      setServerBalance(paymentData.newBalance);

      // Отправляем событие для обновления всех компонентов
      window.dispatchEvent(new Event('balanceUpdated'));

      // Отправляем broadcast СРАЗУ для админки и других вкладок
      console.log('[CART] 📡 Broadcasting new order...');
      broadcastUpdate('orders');
      broadcastUpdate('admin-data');

      clearCart();
      setShowOrderSuccess(true);

    } catch (err: any) {
      console.error("Payment error:", err);
      alert("Payment failed: " + err.message);
    }
  };

  // Top Up через Stripe
  const handleTopUp = async () => {
    const token = getCompatibleAuthToken();
    if (!token) {
      alert("Please log in first");
      return;
    }

    if (selectedAmount < 100) return alert("Minimum top up is ¥100");

    try {
      setLoading(true);

      if (paymentMethod === "card") {
        // Stripe payment - отправляем чистую сумму
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: selectedAmount,
            successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/cart`
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, response: ${errorText}`);
        }

        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.sessionId) {
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
          const { error } = await stripe!.redirectToCheckout({
            sessionId: data.sessionId
          });

          if (error) {
            console.error('Stripe redirect error:', error);
            alert('Error redirecting to payment: ' + error.message);
          }
        }

      } else if (paymentMethod === "paypal") {
        alert("PayPal is temporarily unavailable. Please use credit card.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      alert("Error: " + (err.message || 'Please try again'));
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (!isAuthenticated()) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center p-6">
          <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Login Required</h1>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to be logged in to access your shopping cart and manage your orders.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full group relative px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden hover:scale-105 active:scale-95"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login Now
                </span>
              </button>

              <Link href="/">
                <button className="w-full px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-105 active:scale-95">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </main>

        {/* Модалки входа и регистрации */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignUp={() => {
            setIsLoginOpen(false);
            setIsSignUpOpen(true);
          }}
        />
        <SignUpModal
          isOpen={isSignUpOpen}
          onClose={() => setIsSignUpOpen(false)}
          onSwitchToLogin={() => {
            setIsSignUpOpen(false);
            setIsLoginOpen(true);
          }}
        />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 px-3 sm:px-6 pt-0 pb-6 notranslate">
      <div className="max-w-7xl mx-auto">
        {/* Навигация */}
        <div className="text-xs sm:text-sm text-gray-500 mb-1 space-x-1">
          <Link href="/" className="text-green-600 hover:underline font-medium">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Shopping cart</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Shopping Cart</h1>

        {/* Success Modal */}
        {showOrderSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl animate-scaleIn relative overflow-hidden">
              {/* Animated Background Circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/10 rounded-full -ml-16 -mb-16 animate-pulse delay-75"></div>

              {/* Success Icon with Animation */}
              <div className="relative mb-6 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-once">
                  <svg className="w-12 h-12 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8 relative">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully! 🎉</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Your order has been received and is being processed. You can track your order status in your profile.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 relative">
                <button
                  onClick={() => {
                    setShowOrderSuccess(false);
                    router.push('/profile?newOrder=true');
                  }}
                  className="group w-full relative px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden transform hover:scale-105 active:scale-95"
                >
                  <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Go to Profile
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowOrderSuccess(false);
                    router.push('/');
                  }}
                  className="w-full px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all transform hover:scale-105 active:scale-95"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Товары */}
          <div className="flex-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-base sm:text-lg mb-4 sm:mb-6">Your cart is empty</p>
                <Link href="/">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to catalog
                  </span>
                </Link>
              </div>
            ) : (
              <div key={`cart-items-${currencyKey}`} className="space-y-3 sm:space-y-4">
                {cart.map(({ id, title, price, quantity, image, size, color, options, marketplace }) => {
                  // Определяем маркетплейс из источника изображения если не указан явно
                  const itemMarketplace = marketplace ||
                    (image?.includes('yimg.jp') ? 'yahoo' : 'rakuten');

                  return (
                  <div key={id} className="bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-6 hover:shadow-xl active:shadow-xl hover:border-green-200 active:border-green-200 transition-all duration-300 group touch-manipulation">
                    <Link href={`/product/${id}`} className="relative cursor-pointer flex-shrink-0 mx-auto sm:mx-0">
                      <Image
                        src={image || "/no-image.png"}
                        width={120}
                        height={120}
                        alt={title}
                        className="rounded-lg sm:rounded-xl border-2 border-gray-100 object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-300 w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]"
                      />
                      {/* Бейдж маркетплейса */}
                      <div className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold shadow-lg ${
                        itemMarketplace === 'yahoo'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      }`}>
                        {itemMarketplace === 'yahoo' ? '💜 Yahoo' : '🛍️ Rakuten'}
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${id}`}>
                          <h3 className="text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base lg:text-lg hover:text-green-600 transition-colors cursor-pointer line-clamp-2">{title}</h3>
                        </Link>

                        {/* Варианты товара */}
                        {(size || color || (options && Object.keys(options).length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            {color && (
                              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-blue-700">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                {color}
                              </span>
                            )}
                            {size && (
                              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-purple-700">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                {size}
                              </span>
                            )}
                            {options && Object.entries(options).map(([key, value]) => (
                              <span key={key} className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium text-green-700">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-baseline gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <span className="text-green-600 font-bold text-lg sm:text-xl lg:text-2xl">{formatPrice(price)}</span>
                          <span className="text-gray-500 text-sm sm:text-base">× {quantity}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-[10px] sm:text-xs text-amber-700 font-medium">Additional delivery charges may apply at warehouse</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => decreaseQuantity(id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-50 hover:border-green-500 active:border-green-500 transition-all hover:scale-110 active:scale-95 font-semibold text-sm sm:text-base touch-manipulation"
                          >
                            −
                          </button>
                          <span className="font-semibold text-base sm:text-lg w-6 sm:w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => increaseQuantity(id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-50 hover:border-green-500 active:border-green-500 transition-all hover:scale-110 active:scale-95 font-semibold text-sm sm:text-base touch-manipulation"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(id)}
                          className="group/del flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-red-500 hover:bg-red-50 active:bg-red-50 rounded-lg transition-all hover:scale-105 active:scale-95 font-medium text-sm sm:text-base touch-manipulation"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden xs:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )})}

              </div>
            )}
          </div>

          {/* Итог и баланс */}
          <div className="w-full lg:w-96">
            {/* Shipping Calculator Link - compact on mobile, full on desktop */}
            <Link href="/shipping-calculator">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl lg:rounded-3xl p-3 lg:p-6 mb-3 lg:mb-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 group touch-manipulation">
                <div className="flex items-center gap-2 lg:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg lg:rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                    <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs lg:text-lg group-hover:text-blue-600 transition-colors truncate">Shipping Cost Calculator</h3>
                    <p className="text-[10px] lg:text-sm text-gray-600 hidden lg:block">Calculate approximate shipping costs to your country before ordering</p>
                  </div>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Баланс */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 shadow-lg">
              <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-500/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-green-500/10 rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12"></div>

                <div className="relative">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-green-700 uppercase tracking-wide">Balance</span>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 flex items-baseline gap-1">
                    {formatPrice(serverBalance)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTopUpModal(true)}
                className="group w-full relative px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-green-700 hover:to-green-800 active:from-green-700 active:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl active:shadow-xl overflow-hidden hover:scale-105 active:scale-95 touch-manipulation"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 group-active:translate-y-0 transition-transform duration-500"></span>
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Top Up Balance
                </span>
              </button>
            </div>

            {/* Итог */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900">Order Summary</h2>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Order Total</span>
                  <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Service Fee</span>
                  <span className="font-semibold text-gray-900">{formatPrice(serviceFee)}</span>
                </div>
                <div className="border-t-2 border-gray-100 pt-2 sm:pt-3 flex justify-between items-center">
                  <span className="font-bold text-base sm:text-lg text-gray-900">Total</span>
                  <span className="font-bold text-xl sm:text-2xl text-green-600">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Delivery Address Selection */}
              {mounted && addresses.length > 0 ? (
                <div className="mb-4 border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address *
                  </h3>
                  <div className="space-y-2">
                    {addresses.map((addr: any) => {
                      const locked = isAddressLocked(addr.id);
                      return (
                      <label key={addr.id} className={`flex items-start gap-3 p-3 border-2 rounded-lg transition-all ${
                        locked
                          ? 'border-red-300 bg-red-50 cursor-not-allowed opacity-60'
                          : 'border-gray-200 cursor-pointer hover:border-blue-400 hover:bg-white'
                      }`}>
                        <input
                          type="radio"
                          name="deliveryAddress"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          disabled={locked}
                          onChange={(e) => {
                            setSelectedAddressId(e.target.value);
                            setShippingCountry(addr.country);

                            // Автоопределение carrier при смене адреса
                            const country = addr.country.toLowerCase();
                            const emsRestricted = ['united states', 'usa', 'us', 'iceland', 'serbia', 'moldova', 'georgia'];
                            if (emsRestricted.some((c: string) => country.includes(c))) {
                              setPreferredShippingCarrier('fedex');
                            } else {
                              setPreferredShippingCarrier('ems');
                            }
                          }}
                          className={`mt-0.5 w-5 h-5 border-2 focus:ring-2 ${
                            locked
                              ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                              : 'text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer'
                          }`}
                        />
                        <div className="flex-1 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">{addr.name}</div>
                            {locked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                🔒 Locked
                              </span>
                            )}
                          </div>
                          {locked && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              ⚠️ Active shipment to this address - cannot be used for new orders
                            </div>
                          )}
                          <div className="text-gray-600 text-xs mt-1">
                            {addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </div>
                          <div className="text-gray-900 font-medium text-xs mt-1">
                            {addr.country}
                          </div>
                        </div>
                      </label>
                    )})}
                  </div>
                  <Link href="/profile?tab=addresses" target="_blank">
                    <button className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                      + Add or Edit Addresses
                    </button>
                  </Link>
                </div>
              ) : mounted ? (
                <div className="mb-4 border-2 border-red-200 bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-700 mb-3">⚠️ No delivery address found. Please add an address first.</p>
                  <Link href="/profile?tab=addresses" target="_blank">
                    <button className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                      Add Address
                    </button>
                  </Link>
                </div>
              ) : null}

              {/* Preferred International Shipping Carrier */}
              {mounted ? (
                <div className="mb-4 border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Preferred International Shipping Carrier *</h3>
                  <div className="space-y-3">
                    {/* Japan Post EMS - скрываем для стран где EMS не работает */}
                    {(() => {
                      const emsRestrictedCountries = ['United States', 'USA', 'Iceland', 'Serbia', 'Moldova', 'Georgia'];
                      const isEMSRestricted = emsRestrictedCountries.includes(shippingCountry);

                      return !isEMSRestricted && (
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="shippingCarrier"
                            value="ems"
                            checked={preferredShippingCarrier === 'ems'}
                            onChange={(e) => setPreferredShippingCarrier(e.target.value as 'ems')}
                            className="mt-0.5 w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">Japan Post EMS</span>
                            <p className="text-xs text-gray-500 mt-0.5">Express Mail Service - Standard international shipping</p>
                          </div>
                        </label>
                      );
                    })()}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="shippingCarrier"
                        value="fedex"
                        checked={preferredShippingCarrier === 'fedex'}
                        onChange={(e) => setPreferredShippingCarrier(e.target.value as 'fedex')}
                        className="mt-0.5 w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">FedEx International</span>
                        <p className="text-xs text-gray-500 mt-0.5">Fast and reliable international shipping</p>
                      </div>
                    </label>
                  </div>
                  {(() => {
                    const emsRestrictedCountries = ['United States', 'USA', 'Iceland', 'Serbia', 'Moldova', 'Georgia'];
                    const isEMSRestricted = emsRestrictedCountries.includes(shippingCountry);

                    return isEMSRestricted && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 font-medium">
                          ⚠️ Japan Post EMS is currently unavailable for shipments to {shippingCountry} due to service restrictions.
                        </p>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-gray-500 mt-2">
                    * This is your preference. Final shipping method will be determined based on destination and package specifications.
                  </p>
                </div>
              ) : (
                <div className="mb-4 border-2 border-gray-200 rounded-xl p-4">
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-3 w-1/2"></div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Policy Checkbox */}
              {mounted ? (
                <div className="mb-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={shippingPolicyAccepted}
                      onChange={(e) => setShippingPolicyAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      I agree to the{' '}
                      <Link href="/shipping-insurance-policy" target="_blank" className="text-red-600 font-semibold hover:text-red-700 hover:underline">
                        Shipping and Insurance Policy
                      </Link>
                    </span>
                  </label>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayWithBalance}
                className={`group w-full relative px-6 py-4 font-semibold rounded-xl transition-all duration-300 overflow-hidden ${
                  cart.length === 0 || serverBalance < grandTotal || !shippingPolicyAccepted || !preferredShippingCarrier
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
                disabled={cart.length === 0 || serverBalance < grandTotal || !shippingPolicyAccepted || !preferredShippingCarrier}
              >
                {cart.length === 0 || serverBalance >= grandTotal ? (
                  <>
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                    <span className="relative flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {serverBalance < grandTotal ? "Not enough balance" : "Pay with Balance"}
                    </span>
                  </>
                ) : (
                  "Not enough balance"
                )}
              </button>

              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="mt-4 w-full text-sm text-gray-500 hover:text-red-500 font-medium disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" key="topup-modal-v2">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl transform transition-all animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Up Balance</h2>
              <p className="text-gray-600">Add funds to your account</p>
            </div>

            {/* Input Amount */}
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Enter amount (min. ¥100)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={displayAmount}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    const num = parseInt(numericValue) || 0;
                    setSelectedAmount(num);
                    setDisplayAmount(formatNumber(num));
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
                  placeholder="10 000"
                />
              </div>
              {selectedAmount < 100 && (
                <p className="text-red-500 text-sm font-medium">Minimum top up is ¥100</p>
              )}
            </div>

            {/* Quick Amounts */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Quick select</label>
              <div className="grid grid-cols-3 gap-3">
                {/* Cart Cost Button - Special */}
                {cart.length > 0 && grandTotal > 0 && (() => {
                  const neededAmount = Math.max(0, grandTotal - serverBalance);

                  if (neededAmount === 0) {
                    return (
                      <div className="col-span-3 py-3 px-4 rounded-xl border-2 border-green-300 bg-green-50 text-green-700 font-semibold text-center">
                        ✅ Sufficient balance for cart (¥{formatNumber(grandTotal)})
                      </div>
                    );
                  }

                  return (
                    <button
                      className={`py-3 px-2 rounded-xl border-2 font-semibold transition-all hover:scale-105 active:scale-95 col-span-3 ${
                        selectedAmount === neededAmount
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg"
                          : "border-blue-300 hover:border-blue-400 text-blue-700 bg-blue-50/50"
                      }`}
                      onClick={() => {
                        setSelectedAmount(neededAmount);
                        setDisplayAmount(formatNumber(neededAmount));
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm">🛒 Cart:</span>
                        <span className="font-bold">¥{formatNumber(neededAmount)}</span>
                        <span className="text-xs text-blue-600/70">(¥{formatNumber(serverBalance)} + ¥{formatNumber(neededAmount)} = ¥{formatNumber(grandTotal)})</span>
                      </div>
                    </button>
                  );
                })()}

                {/* Standard amounts */}
                {[1000, 5000, 10000, 20000, 30000, 50000].map((amt) => (
                  <button
                    key={amt}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all hover:scale-105 active:scale-95 ${
                      selectedAmount === amt
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setDisplayAmount(formatNumber(amt));
                    }}
                  >
                    ¥{formatNumber(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Payment method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "card", name: "Credit Card", fee: 3.6, img: "/payments/stripe.png" },
                  { id: "paypal", name: "PayPal", fee: 4.1, img: "/payments/paypal.png" }
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as "paypal" | "card")}
                    className={`cursor-pointer flex flex-col items-center justify-center border-2 rounded-xl p-5 transition-all hover:scale-105 active:scale-95 ${
                      paymentMethod === method.id
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={method.img}
                      alt={method.name}
                      className="h-8 object-contain mb-2"
                    />
                    <p className="font-semibold text-gray-900">{method.name}</p>
                    <p className="text-xs text-gray-500">Fee {method.fee}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {selectedAmount >= 100 && (
              <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-600 mb-1">You will receive</div>
                  <div className="text-3xl font-bold text-green-600">
                    ¥{selectedAmount.toLocaleString("en-US")}
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-gray-300 pt-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Top up amount:</span>
                    <span className="font-semibold">¥{selectedAmount.toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Processing fee (3.6%):</span>
                    <span className="font-semibold">¥{Math.round(selectedAmount * 0.036).toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 font-bold text-gray-900 text-base">
                    <span>Total to pay:</span>
                    <span className="text-green-600">¥{Math.round(selectedAmount * 1.036).toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms of Service Checkbox */}
            {mounted ? (
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I have read, consent to, and agree to the{' '}
                    <Link href="/terms-of-service" target="_blank" className="text-green-600 font-semibold hover:text-green-700 hover:underline">
                      Japrix Terms of Service
                    </Link>
                  </span>
                </label>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTosAccepted(false);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={loading || selectedAmount < 100 || !tosAccepted}
                className="group flex-1 relative px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none overflow-hidden hover:scale-105 active:scale-95"
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay ¥${Math.round(selectedAmount * 1.036).toLocaleString("en-US")}`
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Required Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-[fadeIn_0.2s]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-[scaleIn_0.3s]">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delivery Address Required</h3>
              <p className="text-gray-600 leading-relaxed">
                Please add a delivery address before placing your order. We need to know where to ship your items!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  router.push('/profile?tab=addresses');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Add Delivery Address
              </button>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.05); }
        }
        @keyframes checkmark {
          0% {
            stroke-dasharray: 0, 100;
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dasharray: 100, 0;
            stroke-dashoffset: 0;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        .animate-checkmark {
          animation: checkmark 0.5s ease-out 0.2s forwards;
        }
        .delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </main>
  );
}
