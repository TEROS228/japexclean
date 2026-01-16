import React, { useState, useEffect, useRef, useReducer } from "react";
import { useRouter } from "next/router";
import useUserContext from "@/context/UserContext";
import { Package, CreditCard, Truck, MapPin, ShoppingBag, MessageCircle, HelpCircle, AlertCircle, Heart, Tag } from "lucide-react";
import Head from "next/head";
import OrderProgressBar from "@/components/OrderProgressBar";
import JapanPostTracker from "@/components/JapanPostTracker";
import { useCurrency } from "@/context/CurrencyContext";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { broadcastUpdate } from "@/lib/sync";
import { useFavourites } from "@/context/FavouritesContext";
import StorageTimer from "@/components/StorageTimer";
import { useStorage } from "@/hooks/useStorage";

type TabType = "orders" | "transactions" | "packages" | "addresses" | "messages" | "disputes" | "favourites" | "coupons";

function BalanceDisplay({ balance }: { balance: number }) {
  const { formatPrice, currency } = useCurrency();
  return <p className="text-gray-600">Balance: {formatPrice(balance)}</p>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [mounted, setMounted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currencyKey, setCurrencyKey] = useState(0);

  // Force re-render all sections when currency changes
  useEffect(() => {
    const handleCurrencyChange = (e: any) => {
      console.log('💱 [ProfilePage] Currency changed to:', e.detail, '- forcing all sections to re-render');
      setCurrencyKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange);
  }, []);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.messages.filter((m: any) => m.senderType === 'admin' && !m.read).length;
        setUnreadMessagesCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Даём время на hydration Context'ов (особенно CurrencyContext)
    setTimeout(() => setHydrated(true), 0);

    if (!user) {
      router.push("/");
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Проверяем URL параметр tab
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['orders', 'transactions', 'packages', 'addresses', 'coupons', 'favourites', 'disputes', 'messages'].includes(tab)) {
      setActiveTab(tab as TabType);
    }

    // Если пришли с новым заказом, принудительно переключаемся на вкладку orders
    const newOrder = params.get('newOrder');
    if (newOrder === 'true') {
      console.log('[PROFILE] 🆕 New order detected, switching to orders tab');
      setActiveTab('orders');
      // Очищаем параметр из URL
      router.replace('/profile', undefined, { shallow: true });
    }
  }, [router, user]);

  // Handle ESC key to close photo modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedPhoto]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "orders" as TabType, label: "Orders", icon: ShoppingBag },
    { id: "transactions" as TabType, label: "Transactions", icon: CreditCard },
    { id: "packages" as TabType, label: "Packages", icon: Truck },
    { id: "favourites" as TabType, label: "Favourites", icon: Heart },
    { id: "coupons" as TabType, label: "Coupons", icon: Tag },
    { id: "addresses" as TabType, label: "Address", icon: MapPin },
    { id: "disputes" as TabType, label: "Disputes", icon: AlertCircle },
    { id: "messages" as TabType, label: "Help", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 notranslate">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Profile Info */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-bold flex-shrink-0 shadow-lg border-2 border-white/30">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg truncate mb-1">
                  {user.email}
                </h1>
                {hydrated ? (
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: currency }).format(user.balance || 0)}
                    </span>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm sm:text-base">Loading balance...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 sm:p-4">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const showBadge = tab.id === 'messages' && unreadMessagesCount > 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 relative ${
                      activeTab === tab.id
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" strokeWidth={2.5} />
                    <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                    <span className="sm:hidden text-[10px] font-medium mt-0.5">{tab.label}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-pink-600 text-white text-[10px] sm:text-xs rounded-full min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 px-1.5 flex items-center justify-center font-bold border-2 border-white">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 lg:p-6 min-h-[400px]">
            {hydrated ? (
              <>
                <div style={{ display: activeTab === "orders" ? "block" : "none" }} className="animate-fadeIn">
                  <OrdersSection key={`orders-${currencyKey}`} />
                </div>
                <div style={{ display: activeTab === "transactions" ? "block" : "none" }} className="animate-fadeIn">
                  <TransactionsSection key={`transactions-${currencyKey}`} />
                </div>
                <div style={{ display: activeTab === "packages" ? "block" : "none" }} className="animate-fadeIn">
                  <PackagesSection key={`packages-${currencyKey}`} setSelectedPhoto={setSelectedPhoto} />
                </div>
                <div style={{ display: activeTab === "favourites" ? "block" : "none" }} className="animate-fadeIn">
                  <FavouritesSection key={`favourites-${currencyKey}`} />
                </div>
                <div style={{ display: activeTab === "coupons" ? "block" : "none" }} className="animate-fadeIn">
                  <CouponsSection key={`coupons-${currencyKey}`} />
                </div>
                <div style={{ display: activeTab === "addresses" ? "block" : "none" }} className="animate-fadeIn">
                  <AddressesSection key="addresses" />
                </div>
                <div style={{ display: activeTab === "disputes" ? "block" : "none" }} className="animate-fadeIn">
                  <DisputesSection key="disputes" />
                </div>
                <div style={{ display: activeTab === "messages" ? "block" : "none" }} className="animate-fadeIn">
                  <MessagesSection key="messages" onMessagesRead={fetchUnreadCount} />
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all backdrop-blur-sm z-10"
              title="Close (ESC)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Download Button */}
            <a
              href={selectedPhoto}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all backdrop-blur-sm z-10"
              title="Download photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>

            {/* Image Container with zoom capability */}
            <div className="relative max-h-[90vh] max-w-full overflow-auto">
              <img
                src={selectedPhoto}
                alt="Package photo"
                className="max-h-[90vh] w-auto max-w-full h-auto object-contain rounded-lg shadow-2xl cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle between fit and actual size
                  const img = e.currentTarget;
                  if (img.style.maxHeight === 'none') {
                    img.style.maxHeight = '90vh';
                    img.style.cursor = 'zoom-in';
                  } else {
                    img.style.maxHeight = 'none';
                    img.style.cursor = 'zoom-out';
                  }
                }}
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
              Click image to zoom • Press ESC or click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersSection() {
  const { formatPrice, currency } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Force re-render when currency changes
  useEffect(() => {
    console.log('💱 [OrdersSection] Currency changed to:', currency, '- forcing re-render');
    forceUpdate();
  }, [currency]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('[ORDERS] 🔄 Fetching orders...');
      const response = await fetch(`/api/user/orders?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      console.log('[ORDERS] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[ORDERS] ✅ Orders fetched:', data.orders.length, 'orders');
        setOrders(data.orders);
      } else {
        const errorData = await response.json();
        console.error('[ORDERS] Error response:', errorData);
      }
    } catch (error) {
      console.error('[ORDERS] Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Listen for broadcast updates
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('japrix-sync');

      channel.onmessage = (event) => {
        console.log('[ORDERS] 📡 Broadcast received:', event.data.type);
        if (event.data.type === 'orders' || event.data.type === 'admin-data') {
          console.log('[ORDERS] 🔄 Refreshing orders...');
          fetchOrders();
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Your Orders</h2>
          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
            <p className="text-sm font-semibold text-green-700">0 Orders</p>
          </div>
        </div>
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4">
            <ShoppingBag className="text-green-600" size={32} strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">No orders yet</p>
          <p className="text-sm text-gray-600 max-w-md mx-auto">Start shopping and your orders will appear here. Browse our collection to find amazing Japanese products!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Your Orders</h2>
        <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
          <p className="text-sm font-semibold text-green-700">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</p>
        </div>
      </div>

      {/* Информационное сообщение */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900 mb-1">📦 Order Tracking Information</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              When your items arrive at our warehouse in Japan, they will automatically appear in the <span className="font-bold">Packages</span> tab. You can then arrange international shipping from there.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="group relative bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-green-200 hover:shadow-xl transition-all duration-300">
            {/* Decorative gradient background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-0"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <ShoppingBag className="text-white" size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-900">Order #{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {order.preferredShippingCarrier && (
                        <p className="text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded font-medium ${
                            order.preferredShippingCarrier === 'ems'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            📮 Preferred: {order.preferredShippingCarrier.toUpperCase()}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl shadow-md mb-2">
                    <p className="font-bold text-lg text-white">{formatPrice(order.total)}</p>
                  </div>
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Progress Bar */}
              <div className="mb-4">
                <OrderProgressBar order={order} />
              </div>

              <div className="border-t-2 border-gray-100 pt-4 space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-transparent hover:from-green-50 transition-colors">
                    {item.image && item.image !== '/no-image.png' && (
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {item.quantity > 1 && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                            {item.quantity}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-white rounded-md font-medium border border-gray-200">
                          {item.marketplace === 'yahoo' ? '💜 Yahoo' : '🛍️ Rakuten'}
                        </span>
                        <span className="px-2 py-1 bg-white rounded-md font-medium border border-gray-200">
                          Qty: {item.quantity}
                        </span>
                        <span className="px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md font-bold text-green-700 border border-green-200">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoServiceSuccessMessage() {
  const { formatPrice, currency } = useCurrency();
  return (
    <p className="text-gray-700">
      <span className="font-semibold text-green-600">{formatPrice(500)}</span> has been deducted from your balance.
    </p>
  );
}

function ReinforcementSuccessMessage() {
  const { formatPrice, currency } = useCurrency();
  return (
    <p className="text-gray-700">
      <span className="font-semibold text-green-600">{formatPrice(1000)}</span> has been deducted from your balance.
    </p>
  );
}

function TransactionsSection() {
  const { formatPrice, currency } = useCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Force re-render when currency changes
  useEffect(() => {
    forceUpdate();
  }, [currency]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('/api/user/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const toggleTransaction = (id: string) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'deposit') return '💳';
    if (transaction.type === 'service') return '🛠️';
    if (transaction.type === 'purchase') return '🛍️';
    if (transaction.type === 'shipping') return '📦';
    if (transaction.type === 'refund') return '↩️';
    return '💰';
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Transaction History</h2>
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
            <CreditCard className="text-gray-400" size={24} />
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-700">No transactions yet</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Your top-up history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Transaction History</h2>
      <div className="space-y-2 sm:space-y-3">
        {transactions.map((transaction) => {
          const isExpanded = expandedTransaction === transaction.id;
          return (
            <div
              key={transaction.id}
              className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-md active:shadow-md transition-all bg-white"
            >
              {/* Main transaction row - clickable */}
              <div
                onClick={() => toggleTransaction(transaction.id)}
                className="p-3 sm:p-4 cursor-pointer touch-manipulation active:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <CreditCard className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{transaction.description || 'Balance Update'}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold text-sm sm:text-lg ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
                      </p>
                      <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    {/* Chevron indicator */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 sm:p-5 space-y-3 animate-slideUp">
                  {/* Transaction ID */}
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Transaction ID</span>
                    <span className="text-xs text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{transaction.id.slice(0, 12)}...</span>
                  </div>

                  {/* Transaction Type */}
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Type</span>
                    <span className="text-xs text-gray-900 font-semibold flex items-center gap-1">
                      <span>{getTransactionIcon(transaction)}</span>
                      <span className="capitalize">{transaction.type || 'Other'}</span>
                    </span>
                  </div>

                  {/* Full Date & Time */}
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Date & Time</span>
                    <span className="text-xs text-gray-900 text-right">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      <br />
                      <span className="text-gray-600">
                        {new Date(transaction.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </span>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="flex justify-between items-start pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">Amount</span>
                    <div className="text-right">
                      <p className={`text-lg font-black ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {transaction.amount > 0 ? 'Credit' : 'Debit'}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-500 font-medium">Status</span>
                    <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {transaction.status === 'completed' ? '✓ ' : transaction.status === 'pending' ? '⏳ ' : ''}
                      {transaction.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Full Description */}
                  {transaction.description && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500 font-medium block mb-1">Description</span>
                      <p className="text-xs text-gray-900 bg-blue-50 border border-blue-100 rounded-lg p-3 leading-relaxed">
                        {transaction.description}
                      </p>
                    </div>
                  )}

                  {/* Security notice */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Secured transaction processed by Japrix
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PackagesSection({ setSelectedPhoto }: any) {
  const { formatPrice, currency } = useCurrency();
  const { user } = useUserContext();
  console.log('🎨 [PackagesSection] Rendering with currency:', currency);

  const [packages, setPackages] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [damagedRequests, setDamagedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderKey, forceRerender] = useReducer(x => x + 1, 0);
  const { payStorageFees, loading: payingStorage } = useStorage();

  // Track last update time to prevent polling conflicts
  const lastUpdateTimeRef = useRef<number>(0);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showPhotoServiceSuccess, setShowPhotoServiceSuccess] = useState(false);
  const [showReinforcementSuccess, setShowReinforcementSuccess] = useState(false);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<any>(null);
  const [showDamagedItemModal, setShowDamagedItemModal] = useState(false);
  const [selectedDamagedPackage, setSelectedDamagedPackage] = useState<any>(null);
  const [showDamagedRefundModal, setShowDamagedRefundModal] = useState(false);
  const [selectedDamagedRefundRequest, setSelectedDamagedRefundRequest] = useState<any>(null);
  const [showDomesticShippingModal, setShowDomesticShippingModal] = useState(false);
  const [selectedDomesticPackage, setSelectedDomesticPackage] = useState<any>(null);
  const [showAdditionalShippingModal, setShowAdditionalShippingModal] = useState(false);
  const [selectedAdditionalPackage, setSelectedAdditionalPackage] = useState<any>(null);
  const [deliveryOptions, setDeliveryOptions] = useState({
    shippingMethod: 'ems',
    consolidation: false,
    photoService: false,
    reinforcement: false,
    cancelReturn: false
  });


  // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ при любых изменениях
  useEffect(() => {
    const forceUpdate = (e?: any) => {
      console.log('🔄 [PackagesSection] Force update triggered:', e?.type || 'unknown');
      forceRerender();
      // Перезагружаем данные при любом обновлении
      if (e?.type === 'packagesUpdated' || e?.type === 'dataUpdated') {
        fetchPackages();
      }
    };

    // Слушаем ВСЕ события обновлений
    window.addEventListener('currencyChanged', forceUpdate);
    window.addEventListener('packagesUpdated', forceUpdate);
    window.addEventListener('dataUpdated', forceUpdate);

    return () => {
      window.removeEventListener('currencyChanged', forceUpdate);
      window.removeEventListener('packagesUpdated', forceUpdate);
      window.removeEventListener('dataUpdated', forceUpdate);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      console.log('[PROFILE] 🔄 Fetching packages...');
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Загружаем пакеты (с timestamp чтобы обойти кэш)
      const response = await fetch(`/api/user/packages?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store' // Всегда получаем свежие данные
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[PROFILE] ✅ Packages fetched:', data.packages.length, 'packages');
        console.log('[PROFILE] 📊 Package statuses:', data.packages.map((p: any) => ({ id: p.id.slice(0, 8), status: p.status })));

        // DEBUG: Логируем consolidateWith для автоконсолидированных пакетов
        const autoConsolidatedPackages = data.packages.filter((p: any) => p.autoConsolidated);
        if (autoConsolidatedPackages.length > 0) {
          console.log('[PROFILE] 🎁 Auto-consolidated packages:', autoConsolidatedPackages.map((p: any) => ({
            id: p.id.slice(0, 8),
            consolidation: p.consolidation,
            consolidateWith: p.consolidateWith,
            consolidated: p.consolidated
          })));
        }

        setPackages(data.packages);
      }

      // Загружаем адреса
      const addressesResponse = await fetch('/api/user/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();
        setAddresses(addressesData.addresses || []);
      }

      // Загружаем damaged requests
      const damagedResponse = await fetch('/api/user/damaged-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (damagedResponse.ok) {
        const damagedData = await damagedResponse.json();
        setDamagedRequests(damagedData.requests || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch packages on mount
  useEffect(() => {
    console.log('📦 [PackagesSection] Mounted - fetching packages...');
    fetchPackages();
  }, []);

  // Cross-tab sync only (no polling to save resources)
  const { notifyUpdate } = useAutoRefresh({
    enabled: true,
    onRefresh: fetchPackages,
    broadcastType: 'packages'
  });

  // Также слушаем обновления от админки
  useAutoRefresh({
    enabled: true,
    onRefresh: fetchPackages,
    broadcastType: 'admin-data'
  });

  const handlePayStorage = async (packageId: string) => {
    try {
      await payStorageFees(packageId);
      await fetchPackages();
      window.dispatchEvent(new CustomEvent('packagesUpdated'));
    } catch (error: any) {
      alert(error.message || 'Failed to pay storage fees');
    }
  };

  const handleCancellationPayment = async () => {
    if (!selectedPackageForPayment) return;

    try {
      // Устанавливаем timestamp ДО запроса
      lastUpdateTimeRef.current = Date.now();

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/packages/${selectedPackageForPayment.id}/pay-cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // ПРИНУДИТЕЛЬНО перезагружаем ВСЕ данные с сервера
        await fetchPackages();

        // Отправляем событие обновления для принудительного ререндера
        window.dispatchEvent(new CustomEvent('packagesUpdated'));
        window.dispatchEvent(new CustomEvent('dataUpdated'));

        // Success screen is now handled inside PaymentConfirmModal

        // Уведомляем другие вкладки об обновлении
        console.log('[PROFILE] 📡 Broadcasting cancel purchase payment...');
        broadcastUpdate('packages');
        broadcastUpdate('admin-data');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process payment');
    }
  };

  const handlePayAdditionalShipping = (pkg: any) => {
    setSelectedAdditionalPackage(pkg);
    setShowAdditionalShippingModal(true);
  };

  const handleConfirmAdditionalPayment = async () => {
    if (!selectedAdditionalPackage) return;

    if (!user) return;

    // Check if user has enough balance
    const userBalance = user.balance || 0;
    if (userBalance < selectedAdditionalPackage.additionalShippingCost) {
      alert(`Insufficient balance. You need ¥${selectedAdditionalPackage.additionalShippingCost.toLocaleString()} but have ¥${userBalance.toLocaleString()}`);
      return;
    }

    try {
      lastUpdateTimeRef.current = Date.now();

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/packages/${selectedAdditionalPackage.id}/pay-additional-shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Close modal
        setShowAdditionalShippingModal(false);
        setSelectedAdditionalPackage(null);

        // ПРИНУДИТЕЛЬНО перезагружаем ВСЕ данные с сервера
        await fetchPackages();

        // Отправляем событие обновления для принудительного ререндера
        window.dispatchEvent(new CustomEvent('packagesUpdated'));
        window.dispatchEvent(new CustomEvent('dataUpdated'));

        // Уведомляем другие вкладки об обновлении
        console.log('[PROFILE] 📡 Broadcasting additional shipping payment...');
        broadcastUpdate('packages');
        broadcastUpdate('admin-data');

        alert('Additional shipping cost paid successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process payment');
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Обновляем selectedPackage когда packages обновляются
  useEffect(() => {
    if (selectedPackage && packages.length > 0) {
      const updatedPackage = packages.find(p => p.id === selectedPackage.id);
      if (updatedPackage) {
        console.log('[PROFILE] 🔄 Updating selectedPackage with fresh data');
        setSelectedPackage(updatedPackage);
      }
    }
  }, [packages]);

  console.log('🎨 [RENDER] PackagesSection rendering, packages count:', packages.length, 'renderKey:', renderKey, 'loading:', loading);

  return (
    <>
      {/* Japan Post Tracker Widget - всегда показываем */}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Your Packages</h2>
      <div className="mb-4 sm:mb-6">
        <JapanPostTracker />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
      )}

      {/* No Packages State */}
      {!loading && packages.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
            <Truck className="text-gray-400" size={24} />
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-700">No packages ready</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Packages ready for shipping will appear here</p>
        </div>
      )}

      {/* Packages List */}
      {!loading && packages.length > 0 && (

      <div key={renderKey} className="space-y-3 sm:space-y-4">
        {packages.filter(pkg => {
          // Скрываем пакеты со статусом 'consolidated'
          if (pkg.status === 'consolidated') return false;

          // Скрываем пакеты которые были консолидированы в другой пакет (consolidatedInto не null)
          if (pkg.consolidatedInto) return false;

          return true;
        }).map((pkg) => {
          console.log('🎨 [RENDER] Package:', pkg.id.substring(0, 8), 'reinforcement:', pkg.reinforcement, 'paid:', pkg.reinforcementPaid, 'status:', pkg.status, 'reinforcementStatus:', pkg.reinforcementStatus);
          // Проверяем, не является ли этот пакет частью чужой консолидации
          const isPartOfConsolidation = packages.some(p => {
            if (!p.consolidateWith || p.id === pkg.id) return false;
            try {
              const consolidateIds = JSON.parse(p.consolidateWith);
              return consolidateIds.includes(pkg.id);
            } catch {
              return false;
            }
          });

          // Также проверяем если сам пакет имеет consolidateWith
          // Автоконсолидированные пакеты могут иметь consolidated:true, но при этом consolidateWith для других пакетов
          const hasOwnConsolidation = pkg.consolidateWith ? true : false;

          const isInConsolidation = pkg.consolidation || isPartOfConsolidation || hasOwnConsolidation;

          // DEBUG: Выводим информацию о консолидации
          if (pkg.autoConsolidated) {
            console.log('🔍 [DEBUG] Auto-consolidated package:', {
              id: pkg.id.substring(0, 8),
              consolidation: pkg.consolidation,
              consolidateWith: pkg.consolidateWith,
              consolidated: pkg.consolidated,
              isPartOfConsolidation,
              hasOwnConsolidation,
              isInConsolidation
            });
          }

          return (
          <div key={`${pkg.id}-${pkg.reinforcement}-${pkg.reinforcementPaid}-${pkg.reinforcementStatus}-${pkg.photoService}-${pkg.photoServicePaid}-${pkg.photoServiceStatus}-${pkg.consolidateWith}-${pkg.consolidation}`} className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-5 hover:shadow-md transition-all bg-white">
            {/* Для консолидированных пакетов показываем список товаров */}
            {pkg.consolidated && !pkg.autoConsolidated && pkg.consolidatedPackages && pkg.consolidatedPackages.length > 0 ? (
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    📦 Consolidated Package ({pkg.consolidatedPackages.length} items)
                  </span>
                  <p className="text-xs text-purple-600 font-mono font-bold">
                    ID: {pkg.id}
                  </p>
                </div>
                <div className="space-y-2">
                  {pkg.consolidatedPackages.map((consolidatedPkg: any, idx: number) => (
                    <div key={idx} className="flex gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {consolidatedPkg.orderItem?.image && (
                        <img src={consolidatedPkg.orderItem.image} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {consolidatedPkg.orderItem?.title || 'Item'}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {consolidatedPkg.orderItem?.quantity || 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Arrived: {new Date(pkg.arrivedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                {pkg.orderItem?.image && (
                  <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{pkg.orderItem?.title || 'Package'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Qty: {pkg.orderItem?.quantity || 1} • Arrived: {new Date(pkg.arrivedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-purple-600 font-mono font-bold mt-1 truncate">
                    Package ID: {pkg.id}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-1 min-w-0"></div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${
                  pkg.consolidated && (pkg.status === 'ready' || pkg.status === 'pending_shipping') ? 'bg-green-100 text-green-700' :
                  isInConsolidation && (pkg.status === 'ready' || pkg.status === 'pending_shipping') ? 'bg-amber-100 text-amber-700' :
                  pkg.shippingRequested ? 'bg-amber-100 text-amber-700' :
                  pkg.status === 'ready' || pkg.status === 'pending_shipping' ? 'bg-blue-100 text-blue-700' :
                  pkg.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                  pkg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {pkg.consolidated && (pkg.status === 'ready' || pkg.status === 'pending_shipping') ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Consolidated
                    </>
                  ) : isInConsolidation && (pkg.status === 'ready' || pkg.status === 'pending_shipping') ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Consolidation in Progress
                    </>
                  ) : pkg.shippingRequested ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </>
                  ) : pkg.status === 'ready' || pkg.status === 'pending_shipping' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Ready
                    </>
                  ) : pkg.status === 'shipped' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      Shipped
                    </>
                  ) : pkg.status === 'delivered' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Delivered
                    </>
                  ) : pkg.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              {/* Tracking Number - более заметный */}
              {pkg.trackingNumber && (
                <div className="p-2 sm:p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="text-purple-700 font-semibold text-xs">TRACKING NUMBER</span>
                  </div>
                  <span className="font-mono font-bold text-purple-900 text-sm sm:text-base break-all">{pkg.trackingNumber}</span>
                </div>
              )}

              {/* Invoice Download Button */}
              {pkg.invoice && pkg.status === 'shipped' && (
                <a
                  href={pkg.invoice}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:border-green-300 active:border-green-300 hover:shadow-sm active:shadow-sm transition-colors group touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-700 text-xs sm:text-sm">📄 Download Invoice</span>
                    </div>
                    <p className="text-xs text-green-600">Click to download your shipping invoice</p>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 group-hover:translate-x-0.5 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              )}

              {pkg.weight && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-gray-500">{pkg.consolidated ? 'Combined' : ''} Weight:</span>
                  <span className="font-medium text-gray-900">{pkg.weight} kg</span>
                </div>
              )}

              {(pkg.shippingCost > 0 || pkg.domesticShippingCost > 0) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-500">{pkg.consolidated ? 'Combined' : ''} Shipping Cost:</span>
                    <span className="font-semibold text-blue-600">{formatPrice((pkg.shippingCost || 0) + (pkg.domesticShippingCost || 0))}</span>
                  </div>
                  {(pkg.domesticShippingCost > 0 || pkg.shippingCost > 0) && (
                    <div className="ml-6 sm:ml-7 text-xs text-gray-500 space-y-0.5">
                      {pkg.domesticShippingCost > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>Domestic shipping: {formatPrice(pkg.domesticShippingCost)}</span>
                        </div>
                      )}
                      {pkg.shippingCost > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>International shipping: {formatPrice(pkg.shippingCost)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Additional Shipping Costs */}
              {pkg.additionalShippingCost > 0 && !pkg.additionalShippingPaid && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 sm:p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-bold text-yellow-900 text-sm sm:text-base">Additional Shipping Payment Required</h4>
                      <p className="text-xs sm:text-sm text-yellow-800 mt-1">{pkg.additionalShippingReason}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-yellow-300">
                    <span className="text-sm font-semibold text-yellow-900">Amount Due:</span>
                    <span className="text-xl font-bold text-yellow-700">{formatPrice(pkg.additionalShippingCost)}</span>
                  </div>
                  <button
                    onClick={() => handlePayAdditionalShipping(pkg)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 active:from-yellow-600 active:to-orange-700 transform-none"
                  >
                    <span className="flex-shrink-0">💳</span>
                    <span>Pay Additional Shipping</span>
                  </button>
                </div>
              )}

              {/* Package Photo */}
              {pkg.packagePhoto && (
                <div className="mt-2 sm:mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 font-medium text-xs sm:text-sm">Package Photo</span>
                  </div>
                  <div
                    onClick={() => setSelectedPhoto(pkg.packagePhoto)}
                    className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 group-hover:border-green-400 group-active:border-green-400 transition-all touch-manipulation"
                  >
                    <img
                      src={pkg.packagePhoto}
                      alt="Package exterior"
                      className="w-full h-40 sm:h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-active:bg-black/30 transition-all flex items-center justify-center">
                      <div className="transform scale-0 group-hover:scale-100 group-active:scale-100 transition-transform">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <p className="text-white text-xs sm:text-sm font-medium mt-2 drop-shadow-lg">Click to view full size</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Информация о консолидации */}
              {pkg.consolidated && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-700 font-medium text-xs">
                      {pkg.autoConsolidated ? 'Auto-Consolidated Package' : 'Packages Consolidated'}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mb-2 sm:mb-3">
                    {pkg.autoConsolidated
                      ? `This package contains ${(pkg.originalItems?.length || 0)} variants of the same item. You can still consolidate it with other packages.`
                      : 'The following packages have been combined into one. Total shipping cost is shown above.'
                    }
                  </p>

                  {/* Список объединенных товаров */}
                  <div className="space-y-2">
                    {/* Для автоконсолидированных - показываем originalItems */}
                    {pkg.autoConsolidated && pkg.originalItems && pkg.originalItems.length > 0 ? (
                      <>
                        {pkg.originalItems.map((item: any, idx: number) => {
                          // Парсим опции для получения варианта
                          let options = {};
                          try {
                            options = item.options ? JSON.parse(item.options) : {};
                          } catch (e) {
                            console.error('Error parsing options:', e);
                          }

                          return (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity || 1}
                                </p>
                                {/* Показываем варианты товара */}
                                {Object.keys(options).length > 0 && (
                                  <div className="text-xs text-blue-600 mt-0.5">
                                    {Object.entries(options).map(([key, value]: [string, any]) => (
                                      <span key={key} className="mr-2">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {/* Для обычной консолидации - показываем только консолидированные пакеты */}
                        {pkg.consolidatedPackages && pkg.consolidatedPackages.length > 0 && (
                          <>
                            {pkg.consolidatedPackages.map((consolidatedPkg: any) => (
                              <div key={consolidatedPkg.id} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                                {consolidatedPkg.orderItem?.image && (
                                  <img
                                    src={consolidatedPkg.orderItem.image}
                                    alt={consolidatedPkg.orderItem.title}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {consolidatedPkg.orderItem?.title || 'Package'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Qty: {consolidatedPkg.orderItem?.quantity || 1}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Service Status */}
              {pkg.photoService && pkg.photoServicePaid && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-purple-700 font-medium text-xs">Photo Service</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pkg.photoServiceStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      pkg.photoServiceStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {pkg.photoServiceStatus === 'pending' ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </span>
                      ) : pkg.photoServiceStatus === 'completed' ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Ready
                        </span>
                      ) : pkg.photoServiceStatus}
                    </span>
                  </div>

                  {/* Display Photos if uploaded */}
                  {pkg.photos && pkg.photoServiceStatus === 'completed' && (() => {
                    try {
                      const photoUrls = JSON.parse(pkg.photos);
                      return (
                        <>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {photoUrls.map((url: string, index: number) => (
                              <div
                                key={index}
                                onClick={() => setSelectedPhoto(url)}
                                className="relative group cursor-pointer touch-manipulation"
                              >
                                <img
                                  src={url}
                                  alt={`Package photo ${index + 1}`}
                                  className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-purple-200 group-hover:border-purple-400 group-active:border-purple-400 transition-all"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.png';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-active:bg-black/30 rounded-lg transition-all flex items-center justify-center">
                                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Damaged Item Button */}
                          {!pkg.shippingRequested && !(pkg.photoService && pkg.status === 'shipped') && (() => {
                            const damagedRequest = damagedRequests.find((req: any) => req.packageId === pkg.id);

                            if (damagedRequest) {
                              return (
                                <div className="mt-2 space-y-2">
                                  <div className={`w-full px-3 py-2 border-2 rounded-lg font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm ${
                                    damagedRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                                    damagedRequest.status === 'approved' ? 'bg-green-50 border-green-300 text-green-700' :
                                    'bg-red-50 border-red-300 text-red-700'
                                  }`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {damagedRequest.status === 'pending' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      )}
                                      {damagedRequest.status === 'approved' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      )}
                                      {damagedRequest.status === 'rejected' && (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      )}
                                    </svg>
                                    {damagedRequest.status === 'pending' && 'Damage Report Under Review'}
                                    {damagedRequest.status === 'approved' && 'Damage Report Approved'}
                                    {damagedRequest.status === 'rejected' && 'Damage Report Rejected'}
                                  </div>
                                  {damagedRequest.adminNotes && (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-blue-900 mb-1">Admin Response:</p>
                                      <p className="text-xs text-blue-800">{damagedRequest.adminNotes}</p>
                                    </div>
                                  )}

                                  {/* Refund Button - only show if approved and not yet refunded */}
                                  {damagedRequest.status === 'approved' && !damagedRequest.refundRequested && (
                                    <button
                                      onClick={() => {
                                        setSelectedDamagedRefundRequest(damagedRequest);
                                        setShowDamagedRefundModal(true);
                                      }}
                                      className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm hover:opacity-90 active:opacity-75 transition-opacity duration-150"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                      </svg>
                                      Request Refund
                                    </button>
                                  )}

                                  {/* Refund Requested Status */}
                                  {damagedRequest.refundRequested && (
                                    <div className={`border-2 rounded-lg p-3 ${
                                      damagedRequest.refundProcessed ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                                    }`}>
                                      <p className={`text-xs font-semibold mb-1 ${
                                        damagedRequest.refundProcessed ? 'text-green-900' : 'text-purple-900'
                                      }`}>
                                        {damagedRequest.refundProcessed ? '✅ Refund Approved' : '⏳ Refund Processing'}
                                      </p>
                                      <p className={`text-xs mb-1 ${
                                        damagedRequest.refundProcessed ? 'text-green-700' : 'text-purple-700'
                                      }`}>
                                        Method: {damagedRequest.refundMethod === 'balance' ? 'Account Balance' :
                                                damagedRequest.refundMethod === 'stripe' ? 'Stripe Card' :
                                                damagedRequest.refundMethod === 'paypal' ? 'PayPal' : 'Item Replacement'}
                                      </p>
                                      {damagedRequest.refundProcessed && damagedRequest.refundMethod === 'replace' && (
                                        <div className="mt-2 pt-2 border-t border-green-300">
                                          <p className="text-xs text-green-800 font-medium">
                                            🔄 Replacement order created!
                                          </p>
                                          <p className="text-xs text-green-600 mt-1">
                                            We've created a new order for the same item. Check your Orders tab to track it!
                                          </p>
                                        </div>
                                      )}
                                      {damagedRequest.refundProcessed && (damagedRequest.refundMethod === 'stripe' || damagedRequest.refundMethod === 'paypal') && (
                                        <div className="mt-2 pt-2 border-t border-green-300">
                                          <p className="text-xs text-green-800 font-medium">
                                            ⏱️ Expected processing time: 5-10 business days
                                          </p>
                                          <p className="text-xs text-green-600 mt-1">
                                            Your refund has been approved and will be processed to your {damagedRequest.refundMethod === 'stripe' ? 'card' : 'PayPal account'} within 5-10 business days.
                                          </p>
                                        </div>
                                      )}
                                      {damagedRequest.refundProcessed && damagedRequest.refundMethod === 'balance' && (
                                        <p className="text-xs text-green-600 mt-1">
                                          ✨ Refund has been added to your account balance!
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => {
                                  setSelectedDamagedPackage(pkg);
                                  setShowDamagedItemModal(true);
                                }}
                                className="mt-2 w-full px-3 py-2 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-100 active:bg-red-100 transition-all flex items-center justify-center gap-2 touch-manipulation text-xs sm:text-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                My Item is Damaged
                              </button>
                            );
                          })()}
                        </>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              )}

              {/* Reinforcement Service Status */}
              {(() => {
                const shouldShow = pkg.reinforcement && pkg.reinforcementPaid;
                console.log('🎨 [CONDITION] Package', pkg.id.substring(0, 8), 'shouldShow reinforcement block:', shouldShow, 'reinforcement:', pkg.reinforcement, 'paid:', pkg.reinforcementPaid);
                return shouldShow;
              })() && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-amber-700 font-medium text-xs">Package Reinforcement</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pkg.reinforcementStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      pkg.reinforcementStatus === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {pkg.reinforcementStatus === 'pending' ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing
                        </span>
                      ) : pkg.reinforcementStatus === 'completed' ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Completed
                        </span>
                      ) : pkg.reinforcementStatus}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Your package will be reinforced with strengthened corners and bubble wrap for fragile items.
                  </p>
                </div>
              )}

              {/* Insurance Coverage Info */}
              {pkg.additionalInsurance > 0 && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-green-700 font-medium text-xs">🛡️ Insurance Coverage: ¥{(20000 + pkg.additionalInsurance).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Cancel Purchase Status on Card */}
              {pkg.cancelPurchase && (
                <div className={`mt-3 p-3 border rounded-lg ${
                  pkg.cancelPurchaseStatus === 'pending' ? 'bg-amber-50 border-amber-200' :
                  pkg.cancelPurchaseStatus === 'awaiting_payment' ? 'bg-blue-50 border-blue-200' :
                  pkg.cancelPurchaseStatus === 'paid' ? 'bg-green-50 border-green-200' :
                  pkg.cancelPurchaseStatus === 'approved' ? 'bg-green-50 border-green-200' :
                  pkg.cancelPurchaseStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className={`w-4 h-4 ${
                      pkg.cancelPurchaseStatus === 'pending' ? 'text-amber-600' :
                      pkg.cancelPurchaseStatus === 'awaiting_payment' ? 'text-blue-600' :
                      pkg.cancelPurchaseStatus === 'paid' ? 'text-green-600' :
                      pkg.cancelPurchaseStatus === 'approved' ? 'text-green-600' :
                      pkg.cancelPurchaseStatus === 'rejected' ? 'text-red-600' :
                      'text-gray-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className={`font-medium text-xs ${
                      pkg.cancelPurchaseStatus === 'pending' ? 'text-amber-700' :
                      pkg.cancelPurchaseStatus === 'awaiting_payment' ? 'text-blue-700' :
                      pkg.cancelPurchaseStatus === 'paid' ? 'text-green-700' :
                      pkg.cancelPurchaseStatus === 'approved' ? 'text-green-700' :
                      pkg.cancelPurchaseStatus === 'rejected' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>❌ Purchase Cancellation</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pkg.cancelPurchaseStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      pkg.cancelPurchaseStatus === 'awaiting_payment' ? 'bg-blue-100 text-blue-700' :
                      pkg.cancelPurchaseStatus === 'paid' ? 'bg-green-100 text-green-700' :
                      pkg.cancelPurchaseStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      pkg.cancelPurchaseStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {pkg.cancelPurchaseStatus === 'pending' ? 'Contacting Seller' :
                       pkg.cancelPurchaseStatus === 'awaiting_payment' ? 'Payment Required' :
                       pkg.cancelPurchaseStatus === 'paid' ? 'Payment Received' :
                       pkg.cancelPurchaseStatus === 'approved' ? 'Completed' :
                       pkg.cancelPurchaseStatus === 'rejected' ? 'Rejected' :
                       pkg.cancelPurchaseStatus}
                    </span>
                  </div>

                  {pkg.cancelPurchaseStatus === 'awaiting_payment' && (
                    <button
                      onClick={() => {
                        setSelectedPackageForPayment(pkg);
                        setShowPaymentConfirmModal(true);
                      }}
                      className="mt-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Pay {formatPrice(900)} Now
                    </button>
                  )}

                  {pkg.cancelPurchaseStatus === 'pending' && (
                    <p className="text-xs text-amber-600 mt-1">We are contacting the seller to request cancellation...</p>
                  )}

                  {pkg.cancelPurchaseStatus === 'paid' && (
                    <p className="text-xs text-green-600 mt-1">Payment confirmed. Completing cancellation with seller...</p>
                  )}

                  {pkg.cancelPurchaseStatus === 'approved' && (
                    <p className="text-xs text-green-600 mt-1">Your purchase has been successfully cancelled.</p>
                  )}

                  {pkg.cancelPurchaseStatus === 'rejected' && (
                    <p className="text-xs text-red-600 mt-1">The seller did not approve cancellation.</p>
                  )}
                </div>
              )}

              {/* Disposal Service Status */}
              {(pkg.disposalRequested && !pkg.disposed) && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-orange-700 font-medium text-xs">♻️ Disposal Service</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">Cost: {formatPrice(pkg.disposalCost)} (paid)</p>
                </div>
              )}

              {pkg.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500 text-xs">Notes:</span>
                  <p className="text-gray-700 mt-1">{pkg.notes}</p>
                </div>
              )}

              {pkg.shippedAt && (
                <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-700 font-semibold text-xs">SHIPPED ON</span>
                  </div>
                  <span className="font-semibold text-green-900 text-base">
                    {new Date(pkg.shippedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}

              {pkg.deliveredAt && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  Delivered: {new Date(pkg.deliveredAt).toLocaleDateString()}
                </div>
              )}

              {/* Storage Timer */}
              {pkg.storageInfo && (pkg.status === 'ready' || pkg.status === 'pending_shipping') && !pkg.disposed && (
                <StorageTimer
                  storageInfo={pkg.storageInfo}
                  onPayFees={() => handlePayStorage(pkg.id)}
                  isPayingFees={payingStorage}
                />
              )}
            </div>

            {/* Кнопки для готовых посылок */}
            {(pkg.status === 'ready' || pkg.status === 'pending_shipping') && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2">
                {/* Блокировка если не оплачена domestic shipping */}
                {pkg.domesticShippingCost > 0 && !pkg.domesticShippingPaid ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">Payment Required</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Please pay domestic shipping fee before configuring services or requesting shipping.
                          </p>
                          {pkg.sharedDomesticShippingGroup && (() => {
                            const groupPackages = packages.filter(p => p.sharedDomesticShippingGroup === pkg.sharedDomesticShippingGroup);
                            if (groupPackages.length > 1) {
                              return (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs font-semibold text-blue-800">
                                    📦 Shared Group: {groupPackages.length} packages
                                  </p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    Paying once will unlock all {groupPackages.length} packages in this group!
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 mt-3">
                        <span className="text-sm font-medium text-gray-700">Domestic Shipping:</span>
                        <span className="text-lg font-bold text-amber-600">{formatPrice(pkg.domesticShippingCost)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDomesticPackage(pkg);
                        setShowDomesticShippingModal(true);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Pay Domestic Shipping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Кнопка настроек */}
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setDeliveryOptions({
                          shippingMethod: pkg.shippingMethod || 'ems',
                          consolidation: pkg.consolidation || false,
                          photoService: pkg.photoService || false,
                          reinforcement: pkg.reinforcement || false,
                          cancelReturn: pkg.cancelReturn || false
                        });
                        setShowOptionsModal(true);
                      }}
                  disabled={(() => {
                    const hasPendingDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'pending');
                    const hasApprovedDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'approved');
                    // Блокируем если посылка в консолидации (включая автоконсолидированные)
                    const shouldBlockForConsolidation = isInConsolidation;
                    return shouldBlockForConsolidation || (pkg.disposalRequested && !pkg.disposed) || (pkg.cancelPurchase && pkg.cancelPurchaseStatus !== 'rejected') || pkg.shippingRequested || (pkg.photoService && pkg.photoServiceStatus === 'pending') || (pkg.reinforcement && pkg.reinforcementStatus === 'pending') || hasPendingDamagedRequest || hasApprovedDamagedRequest;
                  })()}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all font-medium shadow-sm flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base ${
                    (() => {
                      const hasPendingDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'pending');
                      const hasApprovedDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'approved');
                      const shouldBlockForConsolidation = isInConsolidation;
                      return shouldBlockForConsolidation || (pkg.disposalRequested && !pkg.disposed) || (pkg.cancelPurchase && pkg.cancelPurchaseStatus !== 'rejected') || pkg.shippingRequested || (pkg.photoService && pkg.photoServiceStatus === 'pending') || (pkg.reinforcement && pkg.reinforcementStatus === 'pending') || hasPendingDamagedRequest || hasApprovedDamagedRequest;
                    })()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:from-green-600 active:to-green-700 hover:shadow-md active:shadow-md'
                  }`}
                >
                  {(pkg.disposalRequested && !pkg.disposed) ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : pkg.shippingRequested ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Shipping Requested
                    </>
                  ) : (() => {
                    const hasPendingDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'pending');
                    if (hasPendingDamagedRequest) {
                      return (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Damage Report Processing
                        </>
                      );
                    }
                    return (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isInConsolidation ? 'Options Locked (Consolidation)' : 'Configure Shipping Options'}
                      </>
                    );
                  })()}
                </button>

                {/* Кнопка отправки посылки */}
                {(() => {
                  // Проверяем есть ли активные сервисы в обработке
                  const hasPhotoProcessing = pkg.photoService && pkg.photoServiceStatus === 'pending';
                  const hasReinforcementProcessing = pkg.reinforcement && pkg.reinforcementStatus === 'pending';
                  const hasDisposalProcessing = pkg.disposalRequested && !pkg.disposed;
                  // Блокируем если консолидация в процессе (включая автоконсолидированные)
                  const hasConsolidation = isInConsolidation;
                  const hasCancelPurchaseProcessing = pkg.cancelPurchase && pkg.cancelPurchaseStatus !== 'rejected';
                  const hasPendingDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'pending');
                  const hasApprovedDamagedRequest = damagedRequests.some((req: any) => req.packageId === pkg.id && req.status === 'approved');
                  const isBlocked = hasPhotoProcessing || hasReinforcementProcessing || hasConsolidation || hasDisposalProcessing || hasCancelPurchaseProcessing || hasPendingDamagedRequest || hasApprovedDamagedRequest;
                  const isShippingRequested = pkg.shippingRequested;

                  if (isShippingRequested) {
                    return (
                      <button
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 bg-gray-300 text-gray-600 cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Payment Completed - Processing...
                      </button>
                    );
                  }

                  // Проверяем если адрес USA
                  const isUSADestination = addresses.length > 0 && addresses[0].country === 'United States';

                  return (
                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowShippingModal(true);
                      }}
                      disabled={isBlocked}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base ${
                        isBlocked
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-600 active:to-blue-700 hover:shadow-md active:shadow-md'
                      }`}
                    >
                      {hasDisposalProcessing ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          {isBlocked ? 'Processing Services...' : (pkg.shippingMethod === 'fedex' ? 'Get Shipping Rates' : 'Request Shipping')}
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* Подсказка если есть активные сервисы */}
                {(pkg.photoService && pkg.photoServiceStatus === 'pending') && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 px-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Waiting for photo service to complete
                  </p>
                )}
                {(pkg.reinforcement && pkg.reinforcementStatus === 'pending') && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 px-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Waiting for package reinforcement to complete
                  </p>
                )}
                {isInConsolidation && !pkg.consolidated && (
                  <p className="text-xs text-amber-600 flex items-center gap-1 px-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Package consolidation in progress
                  </p>
                )}
                {(pkg.disposalRequested && !pkg.disposed) && (
                  <p className="text-xs text-orange-600 flex items-center gap-1 px-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Waiting for disposal to complete
                  </p>
                )}

                {pkg.disposalDeclineReason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Disposal Request Declined
                    </p>
                    <p className="text-xs text-red-600">
                      <span className="font-medium">Reason:</span> {pkg.disposalDeclineReason}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Your payment has been refunded to your balance.
                    </p>
                  </div>
                )}
                  </>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>
      )}

      {/* Modal для настройки доставки */}
      {showOptionsModal && selectedPackage && (
        <DeliveryOptionsModal
          package={selectedPackage}
          options={deliveryOptions}
          addresses={addresses}
          lastUpdateTimeRef={lastUpdateTimeRef}
          onRefresh={async () => {
            // Обновляем данные после disposal
            await fetchPackages();
            // Отправляем событие обновления
            window.dispatchEvent(new CustomEvent('packagesUpdated'));
            window.dispatchEvent(new CustomEvent('dataUpdated'));
          }}
          onPackageUpdate={(updatedPkg: any) => {
            // Обновляем selectedPackage напрямую
            setSelectedPackage(updatedPkg);
            // Также обновляем в списке packages
            setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
          }}
          onClose={() => {
            setShowOptionsModal(false);
            setSelectedPackage(null);
          }}
          onSave={async (options: any, skipModalClose = false) => {
            // Сохранение настроек доставки
            try {
              const token = localStorage.getItem('auth_token');

              // Checking balance is now handled inside PaymentConfirmModal - no pre-check needed

              // Устанавливаем timestamp ДО запроса чтобы предотвратить polling конфликт
              lastUpdateTimeRef.current = Date.now();

              const response = await fetch(`/api/user/packages/${selectedPackage.id}/options`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(options)
              });

              if (response.ok) {
                const result = await response.json();

                // Если skipModalClose=true (вызов из PaymentConfirmModal), не закрываем главную модалку
                if (!skipModalClose) {
                  // Закрываем модал
                  setShowOptionsModal(false);
                  setSelectedPackage(null);
                }

                // ПРИНУДИТЕЛЬНО перезагружаем ВСЕ данные с сервера
                await fetchPackages();

                // Отправляем событие обновления для принудительного ререндера
                window.dispatchEvent(new CustomEvent('packagesUpdated'));
                window.dispatchEvent(new CustomEvent('dataUpdated'));

                // Уведомляем другие вкладки об обновлении
                broadcastUpdate('packages');

                // Показываем success модалку только если НЕ через PaymentConfirmModal
                if (!skipModalClose) {
                  const photoOrdered = options.photoService && !selectedPackage.photoServicePaid;
                  const reinforcementOrdered = options.reinforcement && !selectedPackage.reinforcementPaid;

                  if (photoOrdered) {
                    setShowPhotoServiceSuccess(true);
                    setTimeout(() => setShowPhotoServiceSuccess(false), 3000);
                  }
                  if (reinforcementOrdered) {
                    setShowReinforcementSuccess(true);
                    setTimeout(() => setShowReinforcementSuccess(false), 3000);
                  }
                }
              } else {
                const error = await response.json();
                alert('Error: ' + error.error);
              }
            } catch (error) {
              console.error('Error saving options:', error);
              alert('Failed to save options');
            }
          }}
        />
      )}

      {/* Shipping Confirmation Modal */}
      {showShippingModal && selectedPackage && (
        <ShippingConfirmationModal
          package={selectedPackage}
          addresses={addresses}
          packages={packages}
          onClose={() => {
            setShowShippingModal(false);
            setSelectedPackage(null);
          }}
          onConfirm={async () => {
            try {
              // Устанавливаем timestamp ДО запроса
              lastUpdateTimeRef.current = Date.now();

              // ПРИНУДИТЕЛЬНО перезагружаем ВСЕ данные с сервера
              await fetchPackages();

              // Отправляем событие обновления для принудительного ререндера
              window.dispatchEvent(new CustomEvent('packagesUpdated'));
              window.dispatchEvent(new CustomEvent('dataUpdated'));

              // Уведомляем другие вкладки (в том числе админку)
              broadcastUpdate('packages');
            } catch (error) {
              console.error('Error refreshing data:', error);
            }
          }}
        />
      )}

      {/* Domestic Shipping Payment Modal */}
      {showDomesticShippingModal && selectedDomesticPackage && (
        <DomesticShippingPaymentModal
          package={selectedDomesticPackage}
          onClose={() => {
            setShowDomesticShippingModal(false);
            setSelectedDomesticPackage(null);
          }}
          onConfirm={async () => {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/user/packages/${selectedDomesticPackage.id}/pay-domestic-shipping`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Payment failed');
            }
          }}
          onSuccess={async () => {
            // Обновляем packages СРАЗУ после успешной оплаты
            await fetchPackages();
            // Уведомляем другие вкладки (в том числе админку)
            broadcastUpdate('packages');
          }}
        />
      )}

      {/* Additional Shipping Payment Modal */}
      {showAdditionalShippingModal && selectedAdditionalPackage && (
        <AdditionalShippingPaymentModal
          package={selectedAdditionalPackage}
          onClose={() => {
            setShowAdditionalShippingModal(false);
            setSelectedAdditionalPackage(null);
          }}
          onConfirm={handleConfirmAdditionalPayment}
        />
      )}

      {/* Photo Service Success Modal */}
      {showPhotoServiceSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 animate-fadeIn overflow-hidden">
          {/* Confetti */}
          <div className="confetti confetti-1"></div>
          <div className="confetti confetti-2"></div>
          <div className="confetti confetti-3"></div>
          <div className="confetti confetti-4"></div>
          <div className="confetti confetti-5"></div>
          <div className="confetti confetti-6"></div>
          <div className="confetti confetti-7"></div>
          <div className="confetti confetti-8"></div>
          <div className="confetti confetti-9"></div>
          <div className="confetti confetti-10"></div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleIn relative z-10">
            <div className="text-center">
              {/* Success Icon with animation */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 mb-3 sm:mb-4 animate-bounce">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-slideUp">
                Photo Service Activated! 📸
              </h3>

              {/* Message */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <PhotoServiceSuccessMessage />
                <p className="text-sm sm:text-base text-gray-600">
                  Our administrators will upload photos of your package soon. You'll be notified when they're ready!
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowPhotoServiceSuccess(false)}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:from-green-700 active:to-green-800 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:shadow-xl animate-slideUp touch-manipulation text-sm sm:text-base"
                style={{ animationDelay: '0.2s' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reinforcement Service Success Modal */}
      {showReinforcementSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 animate-fadeIn overflow-hidden">
          {/* Confetti */}
          <div className="confetti confetti-1"></div>
          <div className="confetti confetti-2"></div>
          <div className="confetti confetti-3"></div>
          <div className="confetti confetti-4"></div>
          <div className="confetti confetti-5"></div>
          <div className="confetti confetti-6"></div>
          <div className="confetti confetti-7"></div>
          <div className="confetti confetti-8"></div>
          <div className="confetti confetti-9"></div>
          <div className="confetti confetti-10"></div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleIn relative z-10">
            <div className="text-center">
              {/* Success Icon with animation */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 mb-3 sm:mb-4 animate-bounce">
                <svg className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-slideUp">
                Package Reinforcement Activated! 📦
              </h3>

              {/* Message */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                <ReinforcementSuccessMessage />
                <p className="text-sm sm:text-base text-gray-600">
                  Your package will be reinforced with strengthened corners and bubble wrap for fragile items. You'll be notified when it's ready!
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowReinforcementSuccess(false)}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:from-green-700 active:to-green-800 text-white rounded-lg sm:rounded-xl font-medium transition-all shadow-lg hover:shadow-xl active:shadow-xl animate-slideUp touch-manipulation text-sm sm:text-base"
                style={{ animationDelay: '0.2s' }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <PaymentConfirmModal
        show={showPaymentConfirmModal}
        onClose={() => {
          setShowPaymentConfirmModal(false);
          setSelectedPackageForPayment(null);
        }}
        onConfirm={handleCancellationPayment}
        amount={900}
        serviceName="Purchase Cancellation"
      />

      {/* Damaged Item Modal */}
      <DamagedItemModal
        show={showDamagedItemModal}
        selectedPackage={selectedDamagedPackage}
        onClose={() => {
          setShowDamagedItemModal(false);
          setSelectedDamagedPackage(null);
        }}
        fetchPackages={fetchPackages}
      />

      {/* Damaged Refund Modal */}
      <DamagedRefundModal
        show={showDamagedRefundModal}
        damagedRequest={selectedDamagedRefundRequest}
        onClose={() => {
          setShowDamagedRefundModal(false);
          setSelectedDamagedRefundRequest(null);
        }}
        fetchPackages={fetchPackages}
      />
    </>
  );
}

// Модальное окно подтверждения отправки
function ShippingConfirmationModal({ package: pkg, addresses, packages, onClose, onConfirm }: any) {
  const { formatPrice, currency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fedexOptions, setFedexOptions] = useState<any[]>([]);
  const [selectedFedexService, setSelectedFedexService] = useState<string>('');
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Инициализация selectedAddressId:
  // 1. Если уже был shipping request - используем shippingAddressId
  // 2. Иначе используем addressId из заказа (Order.addressId)
  // 3. Иначе первый доступный адрес
  const initialAddressId = pkg.shippingAddressId || pkg.orderItem?.order?.addressId || (addresses.length > 0 ? addresses[0].id : '');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(initialAddressId);
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  const selectedAddress = addresses.find((addr: any) => addr.id === selectedAddressId) || addresses[0];
  const isUSADestination = selectedAddress?.country === 'United States';
  const isFedExShipping = pkg.shippingMethod === 'fedex';

  // Проверяем заблокирован ли выбранный адрес
  const isSelectedAddressLocked = Array.isArray(packages) && packages.some(p => {
    return p.shippingAddressId === selectedAddress?.id &&
           p.shippingRequested === true &&
           p.status !== 'shipped' &&
           p.status !== 'delivered';
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ balance: data.balance });
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    // Автоматически загружаем FedEx опции для всех FedEx отправлений
    if (isFedExShipping) {
      fetchFedExRates();
    }
  }, []);

  const fetchFedExRates = async (addressId?: string) => {
    setLoadingRates(true);
    setRatesError(null); // Сбрасываем предыдущую ошибку
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/packages/${pkg.id}/request-shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shippingAddressId: addressId || selectedAddressId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Показываем ошибку в UI
        setRatesError(result.error || 'Failed to load shipping rates');
        return;
      }

      if (result.needsFedExSelection && result.fedexOptions) {
        console.log('📦 Received FedEx options from API:', result.fedexOptions);
        setFedexOptions(result.fedexOptions);
      }
    } catch (error) {
      console.error('Error fetching FedEx rates:', error);
      setRatesError('Failed to load shipping rates. Please try again or contact support.');
    } finally {
      setLoadingRates(false);
    }
  };

  // Если domestic shipping уже оплачен, не добавляем его к итоговой сумме
  const domesticCost = pkg.domesticShippingPaid ? 0 : (pkg.domesticShippingCost || 0);

  // Если есть выбранный FedEx сервис - используем его стоимость
  let shippingCost = (pkg.shippingCost || 0) + domesticCost;
  if (selectedFedexService && fedexOptions.length > 0) {
    const selected = fedexOptions.find(opt => opt.serviceType === selectedFedexService);
    if (selected) {
      shippingCost = selected.rateJPY + domesticCost;
    }
  }

  const hasEnoughBalance = user && user.balance >= shippingCost;

  const handleConfirm = async () => {
    setProcessing(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/packages/${pkg.id}/request-shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedService: selectedFedexService || undefined,
          shippingAddressId: selectedAddressId
        })
      });

      const result = await response.json();

      // Если API вернул опции FedEx - показываем их для выбора
      if (result.needsFedExSelection && result.fedexOptions) {
        console.log('📦 Received FedEx options from API:', result.fedexOptions);
        setFedexOptions(result.fedexOptions);
        setProcessing(false);
        return; // Останавливаемся здесь, ждем выбора пользователя
      }

      // Если ошибка
      if (!response.ok) {
        setProcessing(false);
        alert('Error: ' + result.error);
        return;
      }

      // Успех - показываем анимацию минимум 2 секунды
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessing(false);
      setSuccess(true);

      // Показываем success минимум 2 секунды
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Вызываем onConfirm колбэк для обновления данных
      if (onConfirm) {
        await onConfirm();
      }

      onClose();
    } catch (error) {
      console.error('Error requesting shipping:', error);
      setProcessing(false);
      alert('Failed to request shipping');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className={`bg-white rounded-xl sm:rounded-3xl p-4 sm:p-8 w-full shadow-2xl relative max-h-[90vh] ${
        processing || success ? '' : 'overflow-y-auto'
      } ${fedexOptions.length > 0 ? 'max-w-4xl' : pkg.consolidated && ((pkg.autoConsolidated && pkg.originalItems?.length > 0) || pkg.consolidatedPackages?.length > 0) ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">Processing Payment...</p>
            <p className="mt-2 text-sm text-gray-600">Please wait while we process your request</p>
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
            </div>
            <p className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</p>
            <p className="mt-2 text-sm text-gray-600">Your shipping request has been sent</p>
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Admin will process your package soon</span>
            </div>
          </div>
        )}

        <div className={`${processing || success ? 'invisible' : ''}`}>
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {isFedExShipping && fedexOptions.length === 0 && loadingRates
              ? 'Loading Shipping Rates...'
              : isFedExShipping && fedexOptions.length > 0 && !selectedFedexService
              ? 'Choose Your Shipping Service'
              : 'Confirm Shipping Request'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            {isFedExShipping && fedexOptions.length > 0 && !selectedFedexService
              ? 'Select the FedEx service that works best for you'
              : 'Review the details before proceeding'}
          </p>
        </div>

        {/* Package Info */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Auto-Consolidated or Consolidated Package - Show all items */}
          {pkg.consolidated && (pkg.autoConsolidated ? pkg.originalItems && pkg.originalItems.length > 0 : pkg.consolidatedPackages && pkg.consolidatedPackages.length > 0) ? (
            <>
              <div className="mb-3">
                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  📦 {pkg.autoConsolidated
                    ? `Auto-Consolidated (${pkg.originalItems?.length || 0} variants)`
                    : `Consolidated Package (${pkg.consolidatedPackages.length} items)`
                  }
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {pkg.autoConsolidated ? (
                  /* Show original items with variants for auto-consolidated */
                  pkg.originalItems.map((item: any, idx: number) => {
                    let options = {};
                    try {
                      options = item.options ? JSON.parse(item.options) : {};
                    } catch (e) {
                      console.error('Error parsing options:', e);
                    }

                    return (
                      <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 bg-white rounded-lg">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                          {Object.keys(options).length > 0 && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              {Object.entries(options).map(([key, value]: [string, any]) => (
                                <span key={key} className="mr-2">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Show consolidated packages for manual consolidation */
                  pkg.consolidatedPackages.map((consolidatedPkg: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 bg-white rounded-lg">
                      {consolidatedPkg.orderItem?.image && (
                        <img src={consolidatedPkg.orderItem.image} alt={consolidatedPkg.orderItem.title} className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{consolidatedPkg.orderItem?.title}</p>
                        <p className="text-xs text-gray-500">Qty: {consolidatedPkg.orderItem?.quantity || 1}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Regular Package - Show single item */
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              {pkg.orderItem?.image && (
                <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{pkg.orderItem?.title}</p>
                <p className="text-xs sm:text-sm text-gray-500">Qty: {pkg.orderItem?.quantity || 1}</p>
              </div>
            </div>
          )}

          {/* Shipping Details */}
          <div className="space-y-2 pt-3 border-t border-gray-200">
            {pkg.weight && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium text-gray-900">{pkg.weight} kg</span>
              </div>
            )}
            {pkg.shippingMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium text-gray-900 uppercase">
                  {pkg.shippingMethod === 'fedex' ? 'FedEx' : pkg.shippingMethod.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address Section */}
        {addresses.length > 0 && selectedAddress && (
            <div className={`border-2 rounded-xl p-4 mb-6 ${
              isSelectedAddressLocked
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            }`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2">
                  <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isSelectedAddressLocked ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">Shipping Address</h4>
                      {isSelectedAddressLocked && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                          LOCKED
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{selectedAddress.name}</p>
                      <p>{selectedAddress.address}{selectedAddress.apartment ? `, ${selectedAddress.apartment}` : ''}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                      <p className="font-medium mt-1">{selectedAddress.country}</p>
                    </div>
                  </div>
                </div>
                {addresses.length > 1 && (
                  <button
                    onClick={() => setShowAddressSelector(!showAddressSelector)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                      isSelectedAddressLocked
                        ? 'text-red-700 bg-white border border-red-300 hover:bg-red-50'
                        : 'text-green-700 bg-white border border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {showAddressSelector ? 'Close' : 'Change'}
                  </button>
                )}
              </div>

              {/* Warning if address is locked */}
              {isSelectedAddressLocked && (
                <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-xs font-semibold text-red-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    ⚠️ This address is locked - there is an active shipment to this address. Please select a different address.
                  </p>
                </div>
              )}

              {/* Address Selector Dropdown */}
              {showAddressSelector && addresses.length > 1 && (
                <div className={`mt-3 pt-3 space-y-2 ${isSelectedAddressLocked ? 'border-t border-red-200' : 'border-t border-green-200'}`}>
                  <p className="text-xs font-medium text-gray-600 mb-2">Select a different address:</p>
                  {addresses.filter((addr: any) => addr.id !== selectedAddressId).map((addr: any) => {
                  // Проверяем есть ли активная посылка на этот адрес
                  const hasActiveShipment = Array.isArray(packages) && packages.some(p => {
                    return p.shippingAddressId === addr.id &&
                           p.shippingRequested === true &&
                           p.status !== 'shipped' &&
                           p.status !== 'delivered';
                  });

                  return (
                    <button
                      key={addr.id}
                      onClick={() => {
                        if (hasActiveShipment) {
                          alert('⚠️ This address is locked because there is an active shipment to this address. Please wait until the package is delivered.');
                          return;
                        }
                        setSelectedAddressId(addr.id);
                        setShowAddressSelector(false);

                        // Для FedEx - перезагружаем rates с новым адресом
                        if (isFedExShipping) {
                          setFedexOptions([]);
                          setSelectedFedexService('');
                          // Передаем новый addressId для перезапроса rates
                          fetchFedExRates(addr.id);
                        }
                      }}
                      disabled={hasActiveShipment}
                      className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                        hasActiveShipment
                          ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                          : 'bg-white border-gray-200 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <div className="text-sm">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${hasActiveShipment ? 'text-gray-500' : 'text-gray-900'}`}>
                            {addr.name}
                          </p>
                          {hasActiveShipment && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${hasActiveShipment ? 'text-gray-400' : 'text-gray-600'}`}>
                          {addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}
                        </p>
                        <p className={`text-xs ${hasActiveShipment ? 'text-gray-400' : 'text-gray-600'}`}>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className={`font-medium text-xs mt-0.5 ${hasActiveShipment ? 'text-gray-500' : 'text-gray-900'}`}>
                          {addr.country}
                        </p>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </div>
        )}

        {/* Loading Rates Indicator */}
        {isFedExShipping && loadingRates && fedexOptions.length === 0 && !ratesError && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-700 font-medium">Loading FedEx shipping rates...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
          </div>
        )}

        {/* Error Loading Rates */}
        {isFedExShipping && ratesError && fedexOptions.length === 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-1">Failed to Load Shipping Rates</p>
                <p className="text-sm text-red-700">{ratesError}</p>
                <button
                  onClick={() => fetchFedExRates()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FedEx Service Selection */}
        {fedexOptions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">FedEx Shipping Services</h4>
                <p className="text-sm text-gray-600">Official FedEx retail rates - Select the speed you need</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fedexOptions.map((option: any, idx: number) => {
                // Форматируем дату в "Thu, Dec 4" если есть
                const formatDeliveryDate = (dateStr: string) => {
                  try {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  } catch {
                    return dateStr;
                  }
                };

                // Форматируем время в "9:30 AM" если в формате "09:30:00"
                const formatDeliveryTime = (timeStr: string) => {
                  if (!timeStr) return '';
                  // Если уже в формате "9:30 AM", возвращаем как есть
                  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
                  // Иначе парсим "09:30:00"
                  try {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                  } catch {
                    return timeStr;
                  }
                };

                return (
                  <button
                    key={option.serviceType}
                    onClick={() => setSelectedFedexService(option.serviceType)}
                    className={`relative w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group ${
                      selectedFedexService === option.serviceType
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg ring-2 ring-purple-200'
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md hover:scale-[1.02]'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {selectedFedexService === option.serviceType && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Дата и время доставки (если есть) */}
                    {(option.estimatedDeliveryDate || option.deliveryTime) && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        {option.estimatedDeliveryDate && (
                          <div className="mb-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                              ARRIVES ON
                            </div>
                            <div className="text-base font-semibold text-gray-900">
                              {formatDeliveryDate(option.estimatedDeliveryDate)}
                            </div>
                          </div>
                        )}
                        {option.deliveryTime && (
                          <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                              DELIVERED BY
                            </div>
                            <div className="text-base font-semibold text-purple-700">
                              {formatDeliveryTime(option.deliveryTime)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Name & Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base mb-1">{option.serviceName}</div>
                        {idx === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            Most Economical
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold text-purple-600">{formatPrice(option.rateJPY)}</div>
                        <div className="text-sm text-gray-500">${option.rateUSD.toFixed(2)} USD</div>
                      </div>
                    </div>

                    {/* Fallback для deliveryDays если нет даты/времени */}
                    {!option.estimatedDeliveryDate && !option.deliveryTime && option.deliveryDays && (
                      <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>~{option.deliveryDays} business days</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Note about pricing for USA */}
            {isUSADestination && !selectedFedexService && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Official FedEx retail rates</p>
                    <p className="text-blue-700 mt-1">These are public prices directly from FedEx - transparent and fair.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel button для USA когда только показываем опции */}
            {isUSADestination && !selectedFedexService && (
              <div className="mt-4">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Address Locking Warning */}
        {!(isFedExShipping && fedexOptions.length > 0 && !selectedFedexService) && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm">⚠️ Important: Address Will Be Locked</p>
                <p className="text-xs text-amber-800 mt-1">
                  After confirming this shipping request, <span className="font-semibold">this address will be locked</span> and cannot be used for new packages until this shipment is delivered. Only one package can be shipped to each address at a time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown - скрыто для FedEx пока не выбран сервис */}
        {!(isFedExShipping && fedexOptions.length > 0 && !selectedFedexService) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          {/* Разбивка стоимости если есть domestic shipping */}
          {(pkg.domesticShippingCost > 0) && (
            <div className="space-y-2 mb-3 pb-3 border-b border-blue-200">
              {pkg.domesticShippingPaid ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Domestic shipping: Already paid ¥{pkg.domesticShippingCost.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Domestic shipping:</span>
                  <span>{formatPrice(pkg.domesticShippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>International shipping:</span>
                <span>{formatPrice(pkg.shippingCost || 0)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 font-medium">{pkg.domesticShippingCost > 0 && pkg.domesticShippingPaid ? 'Total to Pay:' : 'Shipping Cost:'}</span>
            <span className="text-2xl font-bold text-blue-600">{formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-3 border-t border-blue-200">
            <span className="text-gray-600">Your Balance:</span>
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              <span className={`font-semibold ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(user?.balance || 0)}
              </span>
            )}
          </div>
          {hasEnoughBalance && (
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">After Shipping:</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(user.balance - shippingCost)}
              </span>
            </div>
          )}
        </div>
        )}

        {/* Warning if insufficient balance - скрыто для FedEx пока не выбран сервис */}
        {!(isFedExShipping && fedexOptions.length > 0 && !selectedFedexService) && !loading && !hasEnoughBalance && user && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-800">Insufficient Balance</p>
                <p className="text-sm text-red-700 mt-1">
                  You need {formatPrice(shippingCost - user.balance)} more to ship this package.
                  Please top up your balance first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-3">
          {/* Кнопка Confirm - скрыта для FedEx пока не выбран сервис или если есть ошибка загрузки цен */}
          {!(isFedExShipping && ((fedexOptions.length > 0 && !selectedFedexService) || ratesError)) && (
            <button
              onClick={handleConfirm}
              disabled={Boolean(!hasEnoughBalance || processing || loading || loadingRates || (fedexOptions.length > 0 && !selectedFedexService) || (isFedExShipping && ratesError) || isSelectedAddressLocked)}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold transition-all touch-manipulation text-sm sm:text-base ${
                hasEnoughBalance && !processing && !loading && !loadingRates && !(fedexOptions.length > 0 && !selectedFedexService) && !(isFedExShipping && ratesError) && !Boolean(isSelectedAddressLocked)
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-600 active:to-blue-700 shadow-lg hover:shadow-xl active:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loadingRates ? 'Loading Rates...' :
               loading ? 'Loading...' :
               processing ? 'Processing...' :
               isSelectedAddressLocked ? 'Address Locked - Select Different Address' :
               !hasEnoughBalance ? 'Insufficient Balance' :
               (isUSADestination && ratesError) ? 'Fix Address to Continue' :
               fedexOptions.length > 0 && !selectedFedexService ? 'Select FedEx Service' :
               fedexOptions.length > 0 ? 'Confirm & Pay' :
               'Confirm Shipping'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={processing || loadingRates}
            className={`py-2.5 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base ${
              !(isFedExShipping && ((fedexOptions.length > 0 && !selectedFedexService) || ratesError)) ? 'px-4 sm:px-6' : 'flex-1'
            }`}
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// Компонент модального окна для оплаты domestic shipping
function DomesticShippingPaymentModal({ package: pkg, onClose, onConfirm, onSuccess }: any) {
  const { formatPrice, currency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ balance: data.balance });
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const domesticCost = pkg.domesticShippingCost || 0;
  const hasEnoughBalance = user && user.balance >= domesticCost;

  const handleConfirm = async () => {
    setProcessing(true);

    try {
      // Показываем спиннер минимум 2 секунды для красивой анимации
      await Promise.all([
        onConfirm(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      // Сразу обновляем данные ПЕРЕД показом success экрана
      if (onSuccess) {
        await onSuccess();
      }

      setProcessing(false);
      setSuccess(true);

      // Показываем success 1.5 секунды
      await new Promise(resolve => setTimeout(resolve, 1500));
      onClose();
    } catch (error) {
      setProcessing(false);
      // Если ошибка, закрываем модалку
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className={`bg-white rounded-xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] ${
        processing || success ? '' : 'overflow-y-auto'
      }`}>
        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-amber-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-amber-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">Processing Payment...</p>
            <p className="mt-2 text-sm text-gray-600">Please wait while we process your payment</p>
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-amber-50 rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
            </div>
            <p className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</p>
            <p className="mt-2 text-sm text-gray-600">Domestic shipping has been paid</p>
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">You can now configure services or ship</span>
            </div>
          </div>
        )}

        <div className={`${processing || success ? 'invisible' : ''}`}>
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pay Domestic Shipping</h3>
          <p className="text-sm sm:text-base text-gray-600">Payment is required to continue</p>
        </div>

        {/* Package Info */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            {pkg.orderItem?.image && (
              <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{pkg.orderItem?.title}</p>
              <p className="text-xs sm:text-sm text-gray-500">Qty: {pkg.orderItem?.quantity || 1}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shipping from seller to warehouse</span>
              <span className="font-semibold text-amber-600">{formatPrice(domesticCost)}</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 font-medium">Domestic Shipping Cost:</span>
            <span className="text-2xl font-bold text-amber-600">{formatPrice(domesticCost)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-3 border-t border-amber-200">
            <span className="text-gray-600">Your Balance:</span>
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              <span className={`font-semibold ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(user?.balance || 0)}
              </span>
            )}
          </div>
          {hasEnoughBalance && (
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-600">After Payment:</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(user.balance - domesticCost)}
              </span>
            </div>
          )}
        </div>

        {/* Warning if insufficient balance */}
        {!loading && !hasEnoughBalance && user && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-800">Insufficient Balance</p>
                <p className="text-sm text-red-700 mt-1">
                  You need {formatPrice(domesticCost - user.balance)} more to pay for domestic shipping.
                  Please top up your balance first.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleConfirm}
            disabled={!hasEnoughBalance || processing || loading}
            className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold transition-all touch-manipulation text-sm sm:text-base ${
              hasEnoughBalance && !processing && !loading
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 active:from-amber-600 active:to-amber-700 shadow-lg hover:shadow-xl active:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Loading...' : processing ? 'Processing...' : hasEnoughBalance ? 'Confirm & Pay' : 'Insufficient Balance'}
          </button>
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// Компонент модального окна для оплаты additional shipping
function AdditionalShippingPaymentModal({ package: pkg, onClose, onConfirm }: any) {
  const { formatPrice, currency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ balance: data.balance });
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const additionalCost = pkg.additionalShippingCost || 0;
  const hasEnoughBalance = user && user.balance >= additionalCost;

  const handleConfirm = async () => {
    setProcessing(true);

    try {
      // Показываем спиннер минимум 2 секунды для красивой анимации
      await Promise.all([
        onConfirm(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      setProcessing(false);
      setSuccess(true);

      // Показываем success 1.5 секунды
      await new Promise(resolve => setTimeout(resolve, 1500));
      onClose();
    } catch (error) {
      setProcessing(false);
      // Если ошибка, закрываем модалку
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className={`bg-white rounded-xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] ${
        processing || success ? '' : 'overflow-y-auto'
      }`}>
        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-orange-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">Processing Payment...</p>
            <p className="mt-2 text-sm text-gray-600">Please wait while we process your payment</p>
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-orange-50 rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
            </div>
            <p className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</p>
            <p className="mt-2 text-sm text-gray-600">Additional shipping has been paid</p>
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Admin can now confirm shipment</span>
            </div>
          </div>
        )}

        <div className={`${processing || success ? 'invisible' : ''}`}>
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pay Additional Shipping</h3>
          <p className="text-sm sm:text-base text-gray-600">Admin has requested additional payment</p>
        </div>

        {/* Reason Box */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-bold text-yellow-900 mb-1">Reason for Additional Cost:</h4>
              <p className="text-sm text-yellow-800">{pkg.additionalShippingReason}</p>
            </div>
          </div>
        </div>

        {/* Package Info */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            {pkg.orderItem?.image && (
              <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{pkg.orderItem?.title}</p>
              <p className="text-xs sm:text-sm text-gray-500">Qty: {pkg.orderItem?.quantity || 1}</p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-700 font-medium">Additional Shipping Cost:</span>
            <span className="text-2xl font-bold text-orange-600">{formatPrice(additionalCost)}</span>
          </div>
          <div className="pt-3 border-t border-orange-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Your Current Balance:</span>
              <span className="text-sm font-semibold text-gray-900">{loading ? '...' : formatPrice(user?.balance || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Balance After Payment:</span>
              <span className={`text-sm font-semibold ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                {loading ? '...' : formatPrice((user?.balance || 0) - additionalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {!loading && !hasEnoughBalance && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-900 text-sm">Insufficient Balance</p>
              <p className="text-xs text-red-700 mt-1">
                You need {formatPrice(additionalCost - (user?.balance || 0))} more to pay for this additional shipping.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!hasEnoughBalance || processing || loading}
            className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base ${
              hasEnoughBalance && !loading && !processing
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {processing ? 'Processing...' : loading ? 'Loading...' : !hasEnoughBalance ? 'Insufficient Balance' : `Pay ${formatPrice(additionalCost)}`}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// Компонент модального окна для настройки доставки
function DeliveryOptionsModal({ package: pkg, options, addresses, lastUpdateTimeRef, onClose, onSave, onRefresh, onPackageUpdate }: any) {
  const { formatPrice, currency } = useCurrency();
  const [localOptions, setLocalOptions] = useState(options);
  const [totalCost, setTotalCost] = useState(0);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [shippingMethodSelected, setShippingMethodSelected] = useState(false);
  const [showDisposalConfirm, setShowDisposalConfirm] = useState(false);
  const [disposalProcessing, setDisposalProcessing] = useState(false);
  const [showCancelPurchaseConfirm, setShowCancelPurchaseConfirm] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<any>(null);
  const [isUSAAddress, setIsUSAAddress] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(pkg.additionalInsurance || 0);
  const [showServicePaymentModal, setShowServicePaymentModal] = useState(false);
  const [servicePaymentAmount, setServicePaymentAmount] = useState(0);
  const [servicePaymentName, setServicePaymentName] = useState('');

  // Проверка адреса доставки
  useEffect(() => {
    if (addresses && addresses.length > 0) {
      // Проверяем первый адрес
      const primaryAddress = addresses[0];
      if (primaryAddress && primaryAddress.country) {
        const country = primaryAddress.country.toLowerCase();
        if (country.includes('united states') || country.includes('usa') || country === 'us') {
          setIsUSAAddress(true);
          // Если адрес в США и метод еще не установлен, ставим FedEx
          if (!options.shippingMethod || options.shippingMethod === 'ems') {
            setLocalOptions({ ...localOptions, shippingMethod: 'fedex' });
          }
        }
      }
    }
  }, [addresses]);

  const handleDisposal = async () => {
    setDisposalProcessing(true);
    try {
      // Устанавливаем timestamp ДО запроса
      if (lastUpdateTimeRef) {
        lastUpdateTimeRef.current = Date.now();
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/packages/${pkg.id}/request-disposal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Уведомляем другие вкладки об обновлении
        broadcastUpdate('packages');
        broadcastUpdate('admin-data');

        // Обновляем пакет напрямую если есть callback
        if (data.package && onPackageUpdate) {
          onPackageUpdate(data.package);
        }

        // Также обновляем список пакетов
        await onRefresh();

        // Закрываем окна после обновления данных
        setShowDisposalConfirm(false);
        onClose(); // Закрываем главное модальное окно
      } else {
        alert(`Error: ${data.error}`);
        setDisposalProcessing(false);
      }
    } catch (error) {
      console.error('Error requesting disposal:', error);
      alert('Failed to request disposal');
      setDisposalProcessing(false);
    }
  };

  useEffect(() => {
    let cost = 0;
    if (localOptions.photoService) cost += 500;
    if (localOptions.reinforcement) cost += 1000;
    setTotalCost(cost);
  }, [localOptions]);

  useEffect(() => {
    // Загружаем другие готовые посылки пользователя для консолидации
    const fetchPackages = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user/packages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Фильтруем: только ready, не текущая посылка, и без активного запроса на отмену
          // Исключаем: pending, awaiting_payment, paid, approved
          // Разрешаем: rejected (отклонен продавцом - можно консолидировать)

          console.log('=== CONSOLIDATION DEBUG ===');
          console.log('All packages:', data.packages.map((p: any) => ({
            id: p.id,
            title: p.orderItem?.title?.substring(0, 50),
            status: p.status,
            shippingRequested: p.shippingRequested,
            shippedAt: p.shippedAt,
            consolidated: p.consolidated,
            consolidation: p.consolidation,
            cancelPurchase: p.cancelPurchase,
            reinforcement: p.reinforcement,
            disposalRequested: p.disposalRequested,
            disposed: p.disposed
          })));
          console.log('Current package ID:', pkg.id);

          const available = data.packages.filter((p: any) => {
            // Проверяем cancelPurchase - блокируем если запрос активен (не rejected)
            const hasCancelPurchase = p.cancelPurchase &&
              p.cancelPurchaseStatus !== 'rejected';

            // Проверяем reinforcement - блокируем только если reinforcement был оплачен или завершен
            const hasReinforcement = p.reinforcementPaid || p.reinforcementStatus === 'completed';

            // Проверяем disposal - блокируем если запрошена утилизация
            const hasDisposal = p.disposalRequested;

            // Проверяем что пакет не отправлен и не утилизирован
            const isNotShipped = !p.shippingRequested && !p.shippedAt;
            const isNotDisposed = !p.disposed;

            // Проверяем что пакет не участвует в чужой консолидации
            const isNotInOtherConsolidation = !data.packages.some((otherPkg: any) => {
              if (otherPkg.id === p.id || otherPkg.id === pkg.id) return false;
              if (!otherPkg.consolidateWith) return false;
              try {
                const consolidateIds = JSON.parse(otherPkg.consolidateWith);
                return consolidateIds.includes(p.id);
              } catch {
                return false;
              }
            });

            // Проверяем domestic shipping - блокируем если не оплачен
            const hasDomesticShippingPaid = p.domesticShippingCost === 0 || p.domesticShippingPaid;

            const checks = {
              isReady: p.status === 'ready' || p.status === 'pending_shipping',
              notCurrentPkg: p.id !== pkg.id,
              notConsolidated: !p.consolidated,
              notConsolidation: !p.consolidation,
              notInOtherConsolidation: isNotInOtherConsolidation, // Блокируем если уже в чужой консолидации
              noCancelRequest: !hasCancelPurchase, // Блокируем если есть активный запрос на отмену
              noReinforcement: !hasReinforcement, // Блокируем если есть reinforcement
              noDisposal: !hasDisposal, // Блокируем если есть disposal request
              notShipped: isNotShipped, // Блокируем если уже отправлен
              notDisposed: isNotDisposed, // Блокируем если утилизирован
              domesticShippingPaid: hasDomesticShippingPaid // Блокируем если domestic shipping не оплачен
            };

            const passesAll = Object.values(checks).every(v => v);

            if (!passesAll) {
              console.log(`Package ${p.id.substring(0, 8)} filtered out:`, checks);
              console.log('  → Failed checks:', Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k));
            } else {
              console.log(`✓ Package ${p.id.substring(0, 8)} PASSED all checks`);
            }

            return passesAll;
          });

          console.log('Available for consolidation:', available.length, 'packages');
          console.log('=== END DEBUG ===');
          setAvailablePackages(available);

          // Восстанавливаем ранее выбранные посылки, исключая отмененные
          if (pkg.consolidateWith) {
            try {
              const saved = JSON.parse(pkg.consolidateWith);
              // Фильтруем: оставляем только те ID, которые есть в available (без cancel status)
              const validSaved = saved.filter((id: string) =>
                available.some((p: any) => p.id === id)
              );
              setSelectedPackages(validSaved);
            } catch (e) {}
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    if (localOptions.consolidation) {
      fetchPackages();
    }
  }, [localOptions.consolidation, pkg.id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Shipping Options</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Configure delivery preferences for your package</p>

        <div className="space-y-4 sm:space-y-6">
          {/* Shipping Method - скрыто если админ установил FedEx для пакета */}
          {pkg.shippingMethod !== 'fedex' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Shipping Method</label>
            {isUSAAddress && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800">
                  <strong>USA Shipping:</strong> EMS is currently suspended to USA. FedEx will be used for your delivery.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div
                onClick={() => setLocalOptions({ ...localOptions, shippingMethod: isUSAAddress ? 'fedex' : 'ems' })}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  (isUSAAddress && localOptions.shippingMethod === 'fedex') || (!isUSAAddress && localOptions.shippingMethod === 'ems')
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isUSAAddress ? 'FedEx' : 'EMS (Express Mail Service)'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {isUSAAddress
                        ? 'Express courier service for USA shipping'
                        : 'Fast international shipping (3-7 days)'}
                    </p>
                  </div>
                  {((isUSAAddress && localOptions.shippingMethod === 'fedex') || (!isUSAAddress && localOptions.shippingMethod === 'ems')) && (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Additional Services */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Services</label>
            <div className="space-y-3">
              {/* Consolidation - разрешаем для обычных и автоконсолидированных посылок */}
              {(!pkg.consolidated || pkg.autoConsolidated) && (
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl transition-all ${
                pkg.reinforcementPaid || localOptions.reinforcement
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 cursor-pointer hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={localOptions.consolidation}
                  onChange={(e) => {
                    setLocalOptions({ ...localOptions, consolidation: e.target.checked });
                    if (!e.target.checked) {
                      setSelectedPackages([]);
                      setShippingMethodSelected(false);
                    }
                  }}
                  disabled={pkg.reinforcementPaid || localOptions.reinforcement || (pkg.domesticShippingCost > 0 && !pkg.domesticShippingPaid)}
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="font-semibold text-gray-900">Package Consolidation</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Combine multiple packages into one box</p>
                  {pkg.domesticShippingCost > 0 && !pkg.domesticShippingPaid ? (
                    <p className="text-sm font-medium text-amber-600 mt-2">⚠️ Pay domestic shipping first</p>
                  ) : (
                    <p className="text-sm font-medium text-green-600 mt-2">FREE</p>
                  )}
                  {localOptions.consolidation && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-700">
                        ⚠️ <strong>Note:</strong> After selecting consolidation, Photo Service and Disposal Service will not be available for this package.
                      </p>
                    </div>
                  )}
                </div>
              </label>
              )}

              {/* Выбор посылок для консолидации */}
              {localOptions.consolidation && availablePackages.length === 0 && (
                <div className="ml-11 mt-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-700">⚠️ No other packages available for consolidation. You need at least 2 ready packages to consolidate.</p>
                </div>
              )}

              {localOptions.consolidation && availablePackages.length > 0 && (
                <div className="ml-11 mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Select packages to combine (required):</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${selectedPackages.length + 1 >= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedPackages.length + 1}/5 selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {availablePackages.map((p) => {
                      const pShippingMethod = p.shippingMethod || 'ems';
                      const currentShippingMethod = localOptions.shippingMethod || 'ems';
                      const hasDifferentShippingMethod = pShippingMethod !== currentShippingMethod;

                      return (
                        <label key={p.id} className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                          hasDifferentShippingMethod
                            ? 'border-orange-300 hover:border-orange-400'
                            : 'border-gray-200 hover:border-green-500'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedPackages.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Лимит: максимум 5 товаров для консолидации (включая основную)
                                if (selectedPackages.length >= 4) {
                                  alert('Maximum 5 packages total (including main package)');
                                  return;
                                }
                                setSelectedPackages([...selectedPackages, p.id]);
                              } else {
                                setSelectedPackages(selectedPackages.filter(id => id !== p.id));
                                // Сбрасываем выбор метода доставки при изменении пакетов
                                setShippingMethodSelected(false);
                              }
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <div className="flex items-center gap-3 flex-1">
                            {p.orderItem?.image && (
                              <img src={p.orderItem.image} alt="" className="w-10 h-10 rounded object-cover" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{p.orderItem?.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">Qty: {p.orderItem?.quantity}</p>
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  pShippingMethod === 'fedex'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {pShippingMethod === 'fedex' ? 'FedEx' : 'EMS'}
                                </span>
                                {hasDifferentShippingMethod && (
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded font-medium">
                                    ⚠️ Different method
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Выбор метода доставки для консолидации */}
                  {selectedPackages.length > 0 && (() => {
                    // Страны где EMS заблокирован
                    const emsBlockedCountries = ['United States', 'Iceland', 'Serbia', 'Moldova', 'Georgia'];

                    // Получаем адрес доставки
                    const shippingAddress = addresses.find((addr: any) => addr.id === pkg.shippingAddressId);
                    const destinationCountry = shippingAddress?.country || '';
                    const isEMSBlocked = emsBlockedCountries.includes(destinationCountry);

                    return (
                      <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">Choose Shipping Method for Consolidated Package</p>

                            {isEMSBlocked && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800">
                                ⚠️ <strong>EMS is not available for {destinationCountry}</strong> - Only FedEx can be used
                              </div>
                            )}

                            {!shippingMethodSelected ? (
                              <>
                                <p className="text-xs text-blue-700 mt-2">
                                  Select which shipping method to use for the consolidated package:
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLocalOptions({ ...localOptions, shippingMethod: 'ems' });
                                      setShippingMethodSelected(true);
                                    }}
                                    disabled={isEMSBlocked}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      isEMSBlocked
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                  >
                                    📮 Use EMS
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLocalOptions({ ...localOptions, shippingMethod: 'fedex' });
                                      setShippingMethodSelected(true);
                                    }}
                                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white text-gray-700 border border-gray-300 hover:border-purple-500 hover:bg-purple-50"
                                  >
                                    📦 Use FedEx
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="mt-2 flex items-center gap-3">
                                <div className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm ${
                                  localOptions.shippingMethod === 'ems'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-purple-600 text-white'
                                }`}>
                                  {localOptions.shippingMethod === 'ems' ? '📮 EMS Selected' : '📦 FedEx Selected'}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShippingMethodSelected(false)}
                                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                  Change
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Photo Service - скрыть для консолидированных пакетов (кроме автоконсолидированных) */}
              {(!pkg.consolidated || pkg.autoConsolidated) && (
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl transition-all ${
                pkg.photoServicePaid || localOptions.consolidation
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 cursor-pointer hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={localOptions.photoService}
                  onChange={(e) => setLocalOptions({ ...localOptions, photoService: e.target.checked })}
                  disabled={pkg.photoServicePaid || localOptions.consolidation || (pkg.consolidated && !pkg.autoConsolidated)}
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-semibold text-gray-900">Inside Package Photo</p>
                    {pkg.photoServicePaid && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Ordered</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {pkg.photoServicePaid
                      ? 'Photo service already ordered for this package'
                      : 'Receive up to 3 photos of items before shipping'}
                  </p>
                  {!pkg.photoServicePaid && (
                    <p className="text-sm font-medium text-gray-900 mt-2">{formatPrice(500)}</p>
                  )}
                </div>
              </label>
              )}

              {/* Package Reinforcement */}
              <label className={`flex items-start gap-3 p-4 border-2 rounded-xl transition-all ${
                pkg.reinforcementPaid || (localOptions.consolidation && !pkg.consolidated && !pkg.autoConsolidated)
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : 'border-gray-200 cursor-pointer hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={localOptions.reinforcement}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    // Если выбираем reinforcement, отменяем cancelPurchase
                    if (isChecked) {
                      setLocalOptions({ ...localOptions, reinforcement: true, cancelPurchase: false });
                    } else {
                      setLocalOptions({ ...localOptions, reinforcement: false });
                    }
                  }}
                  disabled={pkg.reinforcementPaid || (localOptions.consolidation && !pkg.consolidated && !pkg.autoConsolidated)}
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-semibold text-gray-900">Package Reinforcement</p>
                    {pkg.reinforcementPaid && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Ordered</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {pkg.reinforcementPaid
                      ? 'Reinforcement service already ordered for this package'
                      : 'Reinforced corners and bubble wrap for fragile items'}
                  </p>
                  {!pkg.reinforcementPaid && (
                    <p className="text-sm font-medium text-gray-900 mt-2">{formatPrice(1000)}</p>
                  )}
                  {localOptions.reinforcement && !pkg.reinforcementPaid && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700">
                        ⚠️ <strong>Important:</strong> After selecting reinforcement, you will NOT be able to select "Cancel Purchase" option. The package will be prepared and reinforced immediately.
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Cancel Purchase - Only for Yahoo/Rakuten - скрыть для консолидированных пакетов (кроме автоконсолидированных) */}
              {(!pkg.consolidated || pkg.autoConsolidated) && (pkg.orderItem.marketplace === 'yahoo' || pkg.orderItem.marketplace === 'rakuten') && !pkg.cancelPurchase && (
                <label className={`flex items-start gap-3 p-4 border-2 rounded-xl transition-all ${
                  pkg.cancelPurchase || localOptions.reinforcement || pkg.reinforcement || localOptions.consolidation || (pkg.consolidated && !pkg.autoConsolidated)
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 cursor-pointer hover:border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={localOptions.cancelPurchase || false}
                    onChange={(e) => setLocalOptions({ ...localOptions, cancelPurchase: e.target.checked })}
                    disabled={pkg.cancelPurchase || localOptions.reinforcement || pkg.reinforcement || localOptions.consolidation || (pkg.consolidated && !pkg.autoConsolidated)}
                    className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <p className="font-semibold text-gray-900">Cancel Purchase (if seller approves)</p>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Yahoo/Rakuten only</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Request cancellation of purchase from seller</p>
                    <p className="text-xs text-amber-600 mt-2">⚠️ Approval depends on seller's policy. You will need to pay {formatPrice(900)} if seller approves.</p>
                    {(localOptions.reinforcement || pkg.reinforcement) && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700">
                          🚫 <strong>Unavailable:</strong> Cannot cancel purchase after selecting package reinforcement.
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              )}


              {/* Disposal Service - скрыть для консолидированных пакетов (кроме автоконсолидированных) */}
              {(!pkg.consolidated || pkg.autoConsolidated) && (
              <div className={`p-4 border-2 rounded-xl ${localOptions.consolidation ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">♻️ Disposal Service</p>
                    <p className="text-sm text-gray-600 mt-1">Dispose and recycle your package</p>
                    {(pkg.consolidation || localOptions.consolidation || (pkg.consolidated && !pkg.autoConsolidated)) ? (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                          ⚠️ Not available - Package is in consolidation or manually consolidated
                        </p>
                      </div>
                    ) : pkg.weight ? (
                      <>
                        <p className="text-sm font-medium text-orange-600 mt-2">
                          Cost: {formatPrice(Math.ceil(pkg.weight * 300))} ({pkg.weight} kg × ¥300/kg)
                        </p>
                        <button
                          onClick={() => setShowDisposalConfirm(true)}
                          disabled={localOptions.consolidation || (pkg.consolidated && !pkg.autoConsolidated)}
                          className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Request Disposal
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Weight not set yet. Please wait for admin to set package weight.</p>
                    )}
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Additional Insurance - Не показываем для FedEx */}
          {localOptions.shippingMethod !== 'fedex' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">📋 Additional Insurance Coverage</label>
            <div className="p-4 border-2 border-gray-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Protect Your Package</p>
                  <p className="text-sm text-gray-600 mt-1">Standard coverage: ¥20,000 | Item value: ¥{(pkg.orderItem?.price || 0).toLocaleString()}</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Insurance Coverage Amount: ¥{(20000 + insuranceAmount).toLocaleString()}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={pkg.additionalInsurance || 0}
                          max="1980000"
                          step="20000"
                          value={insuranceAmount}
                          onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-right">
                          +¥{insuranceAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>¥{(20000 + (pkg.additionalInsurance || 0)).toLocaleString()} (Current)</span>
                        <span>¥2,000,000 (Maximum)</span>
                      </div>
                    </div>

                    {insuranceAmount > (pkg.additionalInsurance || 0) && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-blue-900">Additional Cost:</span>
                          <span className="text-sm font-bold text-blue-900">¥{(Math.ceil(insuranceAmount / 20000) - Math.ceil((pkg.additionalInsurance || 0) / 20000)) * 50}</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          ¥50 per ¥20,000 coverage ({Math.ceil(insuranceAmount / 20000) - Math.ceil((pkg.additionalInsurance || 0) / 20000)} × ¥50)
                        </p>
                      </div>
                    )}

                    {insuranceAmount === (pkg.additionalInsurance || 0) && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600">
                          {insuranceAmount === 0
                            ? 'ℹ️ Standard ¥20,000 coverage included at no additional cost'
                            : '✓ Current coverage maintained at no additional cost'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Total Cost */}
          {(totalCost + (Math.ceil(insuranceAmount / 20000) - Math.ceil((pkg.additionalInsurance || 0) / 20000)) * 50) > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Additional Cost:</span>
                <span className="text-xl font-bold text-green-600">{formatPrice(totalCost + (Math.ceil(insuranceAmount / 20000) - Math.ceil((pkg.additionalInsurance || 0) / 20000)) * 50)}</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save button clicked');
                console.log('Local options:', localOptions);
                console.log('Selected packages:', selectedPackages);

                // Валидация: если выбрана консолидация, но не выбраны пакеты
                if (localOptions.consolidation && selectedPackages.length === 0) {
                  alert('⚠️ Please select at least one package to consolidate with, or disable consolidation.');
                  return;
                }

                const optionsToSave = {
                  ...localOptions,
                  consolidateWith: localOptions.consolidation ? JSON.stringify(selectedPackages) : null,
                  additionalInsurance: insuranceAmount
                };
                console.log('Options to save:', optionsToSave);

                // Проверяем какие платные сервисы выбраны
                const needsPhotoPayment = localOptions.photoService && !pkg.photoServicePaid;
                const needsReinforcementPayment = localOptions.reinforcement && !pkg.reinforcementPaid;
                const insuranceCost = insuranceAmount > 0 ? Math.ceil(insuranceAmount / 20000) * 50 : 0;
                const currentInsuranceCost = (pkg.additionalInsurance || 0) > 0 ? Math.ceil((pkg.additionalInsurance || 0) / 20000) * 50 : 0;
                const insuranceDifference = insuranceCost - currentInsuranceCost;
                const needsInsurancePayment = insuranceDifference > 0;

                let paymentAmount = 0;
                let serviceName = '';
                const services = [];

                if (needsPhotoPayment) {
                  paymentAmount += 500;
                  services.push('Photo Service (¥500)');
                }
                if (needsReinforcementPayment) {
                  paymentAmount += 1000;
                  services.push('Reinforcement (¥1000)');
                }
                if (needsInsurancePayment) {
                  paymentAmount += insuranceDifference;
                  services.push(`Insurance (¥${insuranceDifference})`);
                }

                // Если выбрана отмена покупки
                if (localOptions.cancelPurchase && !pkg.cancelPurchase) {
                  setPendingOptions(optionsToSave);
                  setShowCancelPurchaseConfirm(true);
                  return;
                }

                // Если есть платные сервисы - показываем модалку оплаты
                if (paymentAmount > 0) {
                  serviceName = services.join(' + ');
                  setServicePaymentAmount(paymentAmount);
                  setServicePaymentName(serviceName);
                  setPendingOptions(optionsToSave);
                  setShowServicePaymentModal(true);
                } else {
                  // Если все бесплатно - сохраняем сразу
                  onSave(optionsToSave);
                }
              }}
              disabled={pkg.cancelPurchase}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl active:shadow-xl touch-manipulation text-sm sm:text-base ${
                pkg.cancelPurchase
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:from-green-600 active:to-green-700'
              }`}
            >
              Save Options
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all touch-manipulation text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Disposal Confirmation Modal */}
      {showDisposalConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-3 sm:p-4" onClick={() => !disposalProcessing && setShowDisposalConfirm(false)}>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold">Confirm Disposal Request</h3>
                  <p className="text-white/90 text-xs sm:text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">⚠️ Important Notice</p>
                    <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                      <li>Your package will be disposed and recycled</li>
                      <li>Payment will be processed immediately</li>
                      <li>This action cannot be reversed</li>
                      <li>The package cannot be shipped after disposal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Package Weight:</span>
                  <span className="font-semibold text-gray-900">{pkg.weight} kg</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-semibold text-gray-900">¥300 per kg</span>
                </div>
                <div className="h-px bg-gray-200 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Cost:</span>
                  <span className="text-2xl font-bold text-orange-600">{formatPrice(Math.ceil(pkg.weight * 300))}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💳 <span className="font-semibold">{formatPrice(Math.ceil(pkg.weight * 300))}</span> will be deducted from your balance immediately upon confirmation.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 bg-gray-50 flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDisposalConfirm(false)}
                disabled={disposalProcessing}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDisposal}
                disabled={disposalProcessing}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg sm:rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 active:from-orange-600 active:to-red-600 transition-all shadow-lg hover:shadow-xl active:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
              >
                {disposalProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    ✓ Confirm Disposal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Purchase Confirmation Modal */}
      {showCancelPurchaseConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <svg className="h-10 w-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Confirm Purchase Cancellation
              </h3>

              {/* Message */}
              <div className="space-y-3 mb-6 text-left">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Important Information:</p>
                  <ul className="text-sm text-amber-700 space-y-2 list-disc list-inside">
                    <li>We will contact the seller to request cancellation</li>
                    <li>If seller approves, you must pay <span className="font-bold">{formatPrice(900)} cancellation fee</span></li>
                    <li>Approval depends on seller's policy</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
                <p className="text-center text-gray-600 text-sm">
                  Do you want to proceed with the cancellation request?
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelPurchaseConfirm(false);
                    setPendingOptions(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingOptions) {
                      onSave(pendingOptions);
                    }
                    setShowCancelPurchaseConfirm(false);
                    setPendingOptions(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  Confirm Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Payment Modal */}
      {showServicePaymentModal && (
        <PaymentConfirmModal
          show={showServicePaymentModal}
          onClose={() => {
            setShowServicePaymentModal(false);
            setPendingOptions(null);
            // После закрытия модалки оплаты, закрываем и главную модалку опций
            onClose();
          }}
          onConfirm={async () => {
            // НЕ закрываем модалку здесь - PaymentConfirmModal сама покажет Success
            // и закроется через onClose после завершения всех анимаций
            if (pendingOptions) {
              // Передаем skipModalClose=true чтобы не закрывать главную модалку
              await onSave(pendingOptions, true);
            }
            // Модалка закроется автоматически через onClose после Success screen
          }}
          amount={servicePaymentAmount}
          serviceName={servicePaymentName}
        />
      )}
    </div>
  );
}

// Payment Confirmation Modal Component
function PaymentConfirmModal({ show, onClose, onConfirm, amount = 900, serviceName = 'Cancellation Service' }: any) {
  const { formatPrice, currency } = useCurrency();
  const [user, setUser] = React.useState<any>(null);
  const [processing, setProcessing] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser({ balance: data.balance });
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    };
    if (show) {
      fetchUser();
    }
  }, [show]);

  if (!show) return null;

  const hasEnoughBalance = user && user.balance >= amount;

  const handleConfirm = async () => {
    setProcessing(true);

    // Показываем спиннер минимум 4 секунды для красивой анимации
    const [result] = await Promise.all([
      onConfirm(),
      new Promise(resolve => setTimeout(resolve, 4000))
    ]);

    setProcessing(false);
    setSuccess(true);

    // Показываем success минимум 2 секунды
    await new Promise(resolve => setTimeout(resolve, 2000));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className={`bg-white rounded-xl sm:rounded-3xl p-4 sm:p-8 w-full shadow-2xl relative max-h-[90vh] max-w-md ${
        processing || success ? '' : 'overflow-y-auto'
      }`}>
        {/* Processing Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-xl font-semibold text-gray-900">Processing Payment...</p>
            <p className="mt-2 text-sm text-gray-600">Please wait while we process your request</p>
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl flex flex-col items-center justify-center z-[100] pointer-events-auto">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
            </div>
            <p className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</p>
            <p className="mt-2 text-sm text-gray-600">{serviceName} activated</p>
          </div>
        )}

        <div className={`${processing || success ? 'invisible' : ''}`}>
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Confirm Payment</h3>
            <p className="text-sm sm:text-base text-gray-600">Review the details before proceeding</p>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Service:</span>
              <span className="font-semibold text-gray-900">{serviceName}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 font-medium">Service Cost:</span>
              <span className="text-2xl font-bold text-blue-600">{formatPrice(amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-3 border-t border-blue-200">
              <span className="text-gray-600">Your Balance:</span>
              {loading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span className={`font-semibold ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(user?.balance || 0)}
                </span>
              )}
            </div>
            {hasEnoughBalance && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">After Payment:</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(user.balance - amount)}
                </span>
              </div>
            )}
          </div>

          {/* Warning if insufficient balance */}
          {!loading && !hasEnoughBalance && user && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800">Insufficient Balance</p>
                  <p className="text-sm text-red-700 mt-1">
                    You need {formatPrice(amount - user.balance)} more to purchase this service.
                    Please top up your balance first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleConfirm}
              disabled={!hasEnoughBalance || processing || loading}
              className={`flex-1 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold transition-all touch-manipulation text-sm sm:text-base ${
                hasEnoughBalance && !processing && !loading
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:from-blue-600 active:to-blue-700 shadow-lg hover:shadow-xl active:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Loading...' : processing ? 'Processing...' : hasEnoughBalance ? 'Confirm & Pay' : 'Insufficient Balance'}
            </button>
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 border-2 border-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Damaged Item Modal Component
function DamagedItemModal({ show, selectedPackage, onClose, fetchPackages }: any) {
  const [damageDescription, setDamageDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!show || !selectedPackage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!damageDescription.trim()) {
      alert('Please describe the damage');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/user/request-damaged-return', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          description: damageDescription
        })
      });

      if (response.ok) {
        // Show success modal
        const successModal = document.createElement('div');
        successModal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4';
        successModal.innerHTML = `
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[scale-in_0.3s_ease-out]">
            <div class="p-8 text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h3>
              <p class="text-gray-600 mb-6">Our team will review your damage report shortly and get back to you.</p>
              <button class="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
                Got it, thanks!
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);

        successModal.querySelector('button')?.addEventListener('click', () => {
          document.body.removeChild(successModal);
        });

        successModal.addEventListener('click', (e) => {
          if (e.target === successModal) {
            document.body.removeChild(successModal);
          }
        });

        setDamageDescription('');
        onClose();
        fetchPackages();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit damage report');
      }
    } catch (error) {
      console.error('Error submitting damage report:', error);
      alert('Failed to submit damage report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Report Damaged Item</h2>
                  <p className="text-xs sm:text-sm text-red-100">Free return service for damaged items</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Important Notice */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold text-red-900 mb-1">⚠️ ONLY for Damaged Items</p>
                  <p className="text-sm text-red-700">This service is <strong>ONLY</strong> for items that arrived at our warehouse in damaged condition. The photos from the photo service below will be sent to admin along with your description.</p>
                </div>
              </div>
            </div>

            {/* Shipping Block Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold text-yellow-900 mb-1">📦 Shipping Temporarily Blocked</p>
                  <p className="text-sm text-yellow-700">After submitting this report, you won't be able to configure shipping options or request shipping for this item until the admin reviews your damage report.</p>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Package Information</h3>
              <p className="text-sm text-gray-600">Item: {selectedPackage.orderItem?.title}</p>
              <p className="text-sm text-gray-600">Tracking: {selectedPackage.trackingNumber || 'N/A'}</p>
            </div>

            {/* Photos from Photo Service */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Photos from Photo Service</h3>
              <p className="text-xs text-gray-600 mb-3">These photos will be sent to admin with your damage report</p>
              {selectedPackage.photos && (() => {
                try {
                  const photoUrls = JSON.parse(selectedPackage.photos);
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {photoUrls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Package photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-purple-200"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      ))}
                    </div>
                  );
                } catch (e) {
                  return <p className="text-sm text-gray-500">No photos available</p>;
                }
              })()}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Describe the Damage <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                  rows={4}
                  placeholder="Please describe what is damaged based on the photos above (e.g., broken screen, crushed box, missing parts, etc.)"
                  required
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Our team will review your damage report</li>
                      <li>• We'll arrange a FREE return to the seller if applicable</li>
                      <li>• You'll receive updates via email</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDamageDescription('');
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}

// USA States list with 2-letter codes
const USA_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

function AddressesSection() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<any>(null);
  const [showUSARequirementModal, setShowUSARequirementModal] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [formData, setFormData] = useState({
    id: null as string | null,
    name: "",
    phone: "",
    email: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isCommercial: false,
    ssnNumber: "",
    taxIdType: "",
    taxIdNumber: "",
    companyName: "",
    canDelete: true, // Can this address be deleted? If false, country cannot be changed
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [citySearchTimeout, setCitySearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [stateSuggestions, setStateSuggestions] = useState<any[]>([]);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [stateLoading, setStateLoading] = useState(false);
  const [stateSearchTimeout, setStateSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [showTaxIdDropdown, setShowTaxIdDropdown] = useState(false);

  // Закрываем выпадающий список city при клике вне элемента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative') || !target.closest('input[placeholder="City *"]')) {
        setShowCitySuggestions(false);
      }
    };

    if (showCitySuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCitySuggestions]);

  const handleAddressSearch = (query: string) => {
    setFormData({ ...formData, address: query });

    // Очищаем предыдущий таймаут
    if (searchTimeout) clearTimeout(searchTimeout);

    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Устанавливаем новый таймаут для debounce (задержка 1000ms)
    const timeout = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/address-autocomplete?query=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions && data.suggestions.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Address search error:', error);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    }, 1000);

    setSearchTimeout(timeout);
  };

  const handleCitySearch = (query: string) => {
    setFormData({ ...formData, city: query });

    // Очищаем предыдущий таймаут
    if (citySearchTimeout) clearTimeout(citySearchTimeout);

    if (query.length < 3) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setCityLoading(false);
      return;
    }

    setCityLoading(true);

    // Устанавливаем новый таймаут для debounce (задержка 400ms)
    const timeout = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Формируем URL с параметрами страны и штата
        let url = `/api/address-autocomplete?query=${encodeURIComponent(query)}`;
        if (formData.country) {
          url += `&country=${encodeURIComponent(formData.country)}`;
        }
        if (formData.state) {
          url += `&state=${encodeURIComponent(formData.state)}`;
        }

        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setCitySuggestions(data.suggestions || []);
          setShowCitySuggestions(data.suggestions && data.suggestions.length > 0);
        } else {
          setCitySuggestions([]);
          setShowCitySuggestions(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('City search error:', error);
        }
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      } finally {
        setCityLoading(false);
      }
    }, 400);

    setCitySearchTimeout(timeout);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    // Извлекаем адресную строку из display_name (всё до первой запятой после города)
    // Например: "123 Main St, New York, NY 10001, USA" -> "123 Main St"
    let addressLine = suggestion.display_name;

    // Убираем город, штат, индекс и страну из display_name
    if (suggestion.address.city || suggestion.address.town || suggestion.address.village) {
      const city = suggestion.address.city || suggestion.address.town || suggestion.address.village;
      const cityIndex = addressLine.indexOf(city);
      if (cityIndex > 0) {
        addressLine = addressLine.substring(0, cityIndex).trim();
        // Убираем запятую в конце если есть
        if (addressLine.endsWith(',')) {
          addressLine = addressLine.slice(0, -1).trim();
        }
      }
    }

    setFormData({
      ...formData,
      address: addressLine || `${suggestion.address.house_number || ''} ${suggestion.address.road || suggestion.address.street || ''}`.trim(),
      city: suggestion.address.city || suggestion.address.town || suggestion.address.village || '',
      postalCode: suggestion.address.postcode || '',
      country: suggestion.address.country || ''
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSelectCitySuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      city: suggestion.address.city || '',
      postalCode: suggestion.address.postcode || '',
      country: suggestion.address.country || formData.country
    });
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const handleStateSearch = (query: string) => {
    setFormData({ ...formData, state: query });

    if (stateSearchTimeout) clearTimeout(stateSearchTimeout);

    if (query.length < 2) {
      setStateSuggestions([]);
      setShowStateSuggestions(false);
      setStateLoading(false);
      return;
    }

    setStateLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const searchQuery = formData.country ? `${query}, ${formData.country}` : query;
        const response = await fetch(`/api/address-autocomplete?query=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setStateSuggestions(data.suggestions || []);
          setShowStateSuggestions(data.suggestions && data.suggestions.length > 0);
        } else {
          setStateSuggestions([]);
          setShowStateSuggestions(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('State search error:', error);
        }
        setStateSuggestions([]);
        setShowStateSuggestions(false);
      } finally {
        setStateLoading(false);
      }
    }, 1000);

    setStateSearchTimeout(timeout);
  };

  const handleSelectStateSuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      state: suggestion.display_name.split(',')[0].trim(),
      country: suggestion.address.country || formData.country
    });
    setShowStateSuggestions(false);
    setStateSuggestions([]);
  };

  const handleCountrySearch = (query: string) => {
    // Проверяем вводит ли пользователь США
    const isUSA = query.toLowerCase().includes('united states') ||
                  query.toLowerCase().includes('usa') ||
                  query.toLowerCase() === 'us';

    // Если вводятся США - очищаем поле state
    if (isUSA) {
      setFormData({ ...formData, country: query, state: "" });
    } else {
      setFormData({ ...formData, country: query });
    }

    if (query.length < 1) {
      setFilteredCountries([]);
      setShowCountrySuggestions(false);
      return;
    }

    const filtered = countries.filter(country =>
      country.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCountries(filtered);
    setShowCountrySuggestions(filtered.length > 0);
  };

  const handleSelectCountry = (countryName: string) => {
    // Проверяем выбрана ли США
    const isUSA = countryName.toLowerCase().includes('united states') ||
                  countryName.toLowerCase().includes('usa') ||
                  countryName.toLowerCase() === 'us';

    // Если выбраны США - очищаем поле state, чтобы пользователь выбрал из dropdown
    if (isUSA) {
      setFormData({ ...formData, country: countryName, state: "" });
    } else {
      setFormData({ ...formData, country: countryName });
    }

    setShowCountrySuggestions(false);
    setFilteredCountries([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Проверка для США - обязательно SSN или информация о компании
    const isUSA = formData.country.toLowerCase().includes('united states') ||
                  formData.country.toLowerCase().includes('usa') ||
                  formData.country.toLowerCase() === 'us';

    if (isUSA) {
      const hasSSN = formData.ssnNumber && formData.ssnNumber.trim().length > 0;
      const hasCompanyInfo = formData.companyName && formData.companyName.trim().length > 0;

      if (!hasSSN && !hasCompanyInfo) {
        setShowUSARequirementModal(true);
        return;
      }

      // Validate USA State (must be valid state name or code)
      const validStateNames = USA_STATES.map(s => s.name);
      const validStateCodes = USA_STATES.map(s => s.code);
      if (!validStateNames.includes(formData.state) && !validStateCodes.includes(formData.state)) {
        alert('Please select a valid US state from the dropdown.');
        return;
      }

      // Validate USA ZIP code (must be 5 digits or 5+4 format)
      if (!/^\d{5}(-\d{4})?$/.test(formData.postalCode)) {
        alert('Please enter a valid ZIP code (5 digits, e.g., 12345, or 9 digits, e.g., 12345-6789).');
        return;
      }
    }

    // Показываем модальное окно подтверждения
    setShowConfirmModal(true);
  };

  const confirmSaveAddress = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Token length:', token?.length, 'First 20 chars:', token?.substring(0, 20));

      if (!token) {
        alert('Authentication token missing. Please login again.');
        window.location.href = '/';
        return;
      }

      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
          phoneNumber: formData.phone,
          isCommercial: formData.isCommercial,
          ssnNumber: formData.ssnNumber,
          taxIdType: formData.taxIdType,
          taxIdNumber: formData.taxIdNumber,
          companyName: formData.companyName
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.isUpdate) {
          // Обновляем существующий адрес в списке
          setAddresses(addresses.map(addr => addr.id === data.address.id ? data.address : addr));
        } else {
          // Добавляем новый адрес к списку
          setAddresses([...addresses, data.address]);
        }

        setFormData({ id: null, name: "", phone: "", email: "", address: "", apartment: "", city: "", state: "", postalCode: "", country: "", isCommercial: false, ssnNumber: "", taxIdType: "", taxIdNumber: "", companyName: "", canDelete: true });
        setShowForm(false);
        setShowConfirmModal(false);
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('auth_token');
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert('Error saving address: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    }
  };


  // Загружаем адреса из API при монтировании
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem('auth_token');

        // Загружаем адреса
        const addressesResponse = await fetch('/api/user/addresses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (addressesResponse.ok) {
          const addressesData = await addressesResponse.json();
          setAddresses(addressesData.addresses || []);
        }

        // Загружаем заказы
        const ordersResponse = await fetch('/api/user/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData.orders || []);
        }

        // Загружаем посылки
        const packagesResponse = await fetch('/api/user/packages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          setPackages(packagesData.packages);
        }

        // Добавляем небольшую задержку чтобы убедиться что все данные обработались
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Обновляем packages когда происходит shipping request или другое обновление
  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const packagesResponse = await fetch('/api/user/packages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          setPackages(packagesData.packages);
          console.log('[AddressesSection] 🔄 Packages updated after event');
        }
      } catch (error) {
        console.error('[AddressesSection] Error updating packages:', error);
      }
    };

    window.addEventListener('packagesUpdated', handleUpdate);
    window.addEventListener('dataUpdated', handleUpdate);

    return () => {
      window.removeEventListener('packagesUpdated', handleUpdate);
      window.removeEventListener('dataUpdated', handleUpdate);
    };
  }, []);

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
    { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
    { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
    { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
    { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
    { code: 'RO', name: 'Romania', flag: '🇷🇴' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
    { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
    { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  ];

  return (
    <div>
      {/* Modern header with gradient */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Delivery Addresses
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {addresses.length} of 3 addresses saved
          </p>
        </div>
        {addresses.length < 3 && (
          <button
            onClick={() => {
              // Reset form data when adding new address
              setFormData({
                id: null,
                name: "",
                phone: "",
                email: "",
                address: "",
                apartment: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                isCommercial: false,
                ssnNumber: "",
                taxIdType: "",
                taxIdNumber: "",
                companyName: "",
                canDelete: true
              });
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm sm:text-base rounded-xl hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all font-semibold shadow-lg hover:shadow-xl touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add New Address</span>
            <span className="sm:hidden">Add</span>
          </button>
        )}
      </div>

      {/* Warning about address accuracy - always visible */}
      <div className="mb-4 sm:mb-6 bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-r-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-semibold text-amber-800 text-xs sm:text-sm mb-1">Important: Address Accuracy</h4>
            <p className="text-amber-700 text-xs sm:text-sm leading-relaxed">
              Incorrect or misspelled addresses may cause delivery delays, additional fees, or package returns. Always use autocomplete suggestions and double-check your address before saving.
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 sm:mb-6 bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Delivery Address</h3>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email for delivery notifications *"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
              autoComplete="off"
            />
            <input
              type="text"
              placeholder="Apartment, Suite, Unit (Optional)"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="City *"
                  value={formData.city}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => {
                    if (citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  required
                  autoComplete="off"
                />
                {cityLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectCitySuggestion(suggestion)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-green-50 active:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">
                          {suggestion.address.city}
                        </div>
                        <div className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
                          {suggestion.address.state && `${suggestion.address.state}, `}
                          {suggestion.address.country}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                {formData.country.toLowerCase().includes('united states') || formData.country.toLowerCase() === 'usa' || formData.country.toLowerCase() === 'us' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowStateDropdown(!showStateDropdown)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-left bg-white flex justify-between items-center"
                    >
                      <span className={formData.state ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.state || 'Select State *'}
                      </span>
                      <svg className={`w-5 h-5 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStateDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {USA_STATES.map((state) => (
                          <button
                            key={state.code}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, state: state.name });
                              setShowStateDropdown(false);
                            }}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-green-50 active:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">
                              {state.code} - {state.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="State/Province/Region *"
                      value={formData.state}
                      onChange={(e) => handleStateSearch(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                    {stateLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                      </div>
                    )}
                    {showStateSuggestions && stateSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {stateSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectStateSuggestion(suggestion)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-green-50 active:bg-green-50 transition-colors border-b border-gray-100 last:border-0 touch-manipulation"
                          >
                            <div className="font-medium text-gray-900 text-xs sm:text-sm">
                              {suggestion.address.state || suggestion.address.province || suggestion.address.region}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {suggestion.address.country}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  💡 If your country doesn't use states/provinces/regions, please enter your city name here
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder={(formData.country.toLowerCase().includes('united states') || formData.country.toLowerCase() === 'usa' || formData.country.toLowerCase() === 'us') ? "ZIP Code (12345) *" : "Postal Code / ZIP *"}
                  value={formData.postalCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    // For USA: only allow digits and hyphen, max 10 chars (12345-6789)
                    if (formData.country.toLowerCase().includes('united states') || formData.country.toLowerCase() === 'usa' || formData.country.toLowerCase() === 'us') {
                      const cleaned = value.replace(/[^\d-]/g, '');
                      if (cleaned.length <= 10) {
                        setFormData({ ...formData, postalCode: cleaned });
                      }
                    } else {
                      setFormData({ ...formData, postalCode: value });
                    }
                  }}
                  className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                    formData.postalCode && (formData.country.toLowerCase().includes('united states') || formData.country.toLowerCase() === 'usa' || formData.country.toLowerCase() === 'us') && !/^\d{5}(-\d{4})?$/.test(formData.postalCode)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                />
                {formData.postalCode && (formData.country.toLowerCase().includes('united states') || formData.country.toLowerCase() === 'usa' || formData.country.toLowerCase() === 'us') && !/^\d{5}(-\d{4})?$/.test(formData.postalCode) && (
                  <p className="text-xs text-red-600 mt-1">ZIP code must be 5 digits (e.g., 12345) or 9 digits (e.g., 12345-6789)</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Select or type country *"
                  value={formData.country}
                  onChange={(e) => handleCountrySearch(e.target.value)}
                  onFocus={() => {
                    if (formData.country.length > 0) {
                      const filtered = countries.filter(country =>
                        country.name.toLowerCase().includes(formData.country.toLowerCase())
                      );
                      setFilteredCountries(filtered);
                      setShowCountrySuggestions(filtered.length > 0);
                    }
                  }}
                  disabled={formData.id !== null && !formData.canDelete}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl outline-none transition-all ${
                    formData.id !== null && !formData.canDelete
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  }`}
                  title={formData.id !== null && !formData.canDelete ? 'Country cannot be changed for this address' : ''}
                  required
                />
                {showCountrySuggestions && filteredCountries.length > 0 && !(formData.id !== null && !formData.canDelete) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleSelectCountry(country.name)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-green-50 active:bg-green-50 transition-colors border-b border-gray-100 last:border-0 flex items-center gap-2 touch-manipulation"
                      >
                        <span className="text-xl sm:text-2xl">{country.flag}</span>
                        <span className="font-medium text-gray-900 text-xs sm:text-sm">{country.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* USA Tax Information */}
              {formData.country === 'United States' && (
                <div className="col-span-2 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <span>🇺🇸</span>
                    USA Tax Information
                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">REQUIRED</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 font-semibold mb-3 sm:mb-4">
                    ⚠️ For USA addresses, you MUST provide either your SSN OR company information. You cannot save the address without one of these.
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Personal SSN Option */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Personal Information (For individuals)
                      </label>
                      <input
                        type="text"
                        placeholder="SSN - Social Security Number (e.g., 123-45-6789)"
                        value={formData.ssnNumber}
                        onChange={(e) => setFormData({ ...formData, ssnNumber: e.target.value, taxIdType: '', taxIdNumber: '', companyName: '' })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your Social Security Number if you're ordering as an individual
                      </p>
                    </div>

                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="text-sm text-gray-500 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>

                    {/* Company Tax ID Option */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Company Information (For businesses)
                      </label>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowTaxIdDropdown(!showTaxIdDropdown)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer hover:border-blue-400 active:border-blue-400 text-left flex items-center justify-between touch-manipulation"
                          >
                            <span className={formData.taxIdType ? "text-gray-900" : "text-gray-500"}>
                              {formData.taxIdType ? (
                                <>
                                  {formData.taxIdType === "ABN" && "ABN (Australian Business Number)"}
                                  {formData.taxIdType === "CR" && "CR (Company Registration)"}
                                  {formData.taxIdType === "EIN" && "EIN (Employer Identification Number)"}
                                  {formData.taxIdType === "GST" && "GST (Goods and Services Tax Number)"}
                                  {formData.taxIdType === "IN" && "IN (Tax Identification Number)"}
                                  {formData.taxIdType === "RFC" && "RFC (Registro Federal de Contribuyentes)"}
                                  {formData.taxIdType === "VAT" && "VAT (Value Added Tax Number)"}
                                </>
                              ) : (
                                "Select Tax ID Type"
                              )}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${showTaxIdDropdown ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showTaxIdDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "ABN", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">ABN</div>
                                <div className="text-xs text-gray-500">Australian Business Number</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "CR", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">CR</div>
                                <div className="text-xs text-gray-500">Company Registration</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "EIN", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">EIN</div>
                                <div className="text-xs text-gray-500">Employer Identification Number</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "GST", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">GST</div>
                                <div className="text-xs text-gray-500">Goods and Services Tax Number</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "IN", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">IN</div>
                                <div className="text-xs text-gray-500">Tax Identification Number</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "RFC", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors border-b border-gray-100 text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">RFC</div>
                                <div className="text-xs text-gray-500">Registro Federal de Contribuyentes</div>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, taxIdType: "VAT", ssnNumber: '' });
                                  setShowTaxIdDropdown(false);
                                }}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-blue-50 active:bg-blue-50 transition-colors text-gray-900 touch-manipulation"
                              >
                                <div className="font-medium text-xs sm:text-sm">VAT</div>
                                <div className="text-xs text-gray-500">Value Added Tax Number</div>
                              </button>
                            </div>
                          )}
                        </div>

                        {formData.taxIdType && (
                          <>
                            <input
                              type="text"
                              placeholder={`Enter your ${formData.taxIdType} number`}
                              value={formData.taxIdNumber}
                              onChange={(e) => setFormData({ ...formData, taxIdNumber: e.target.value })}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                              required={!!formData.taxIdType}
                            />
                            <input
                              type="text"
                              placeholder="Company Name *"
                              value={formData.companyName}
                              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                              required={!!formData.taxIdType}
                            />
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select Tax ID type if you're ordering for a company
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Address Checkbox */}
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <input
                type="checkbox"
                id="isCommercial"
                checked={formData.isCommercial}
                onChange={(e) => setFormData({ ...formData, isCommercial: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isCommercial" className="text-sm sm:text-base text-gray-900 cursor-pointer select-none">
                <span className="font-medium">This is a business/commercial address</span>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Check this if delivering to an office, warehouse, or business location (may reduce FedEx shipping costs for USA)
                </p>
              </label>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md touch-manipulation"
              >
                Save Address
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-50 transition-all font-medium touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Addresses Yet</p>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Add your first delivery address to start ordering</p>
          <button
            onClick={() => {
              setFormData({
                id: null,
                name: "",
                phone: "",
                email: "",
                address: "",
                apartment: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                isCommercial: false,
                ssnNumber: "",
                taxIdType: "",
                taxIdNumber: "",
                companyName: "",
                canDelete: true
              });
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {addresses.map((addr) => {
            // Проверка 1: Есть ли посылка с запрошенным shipping на этот адрес
            const hasRequestedShipping = Array.isArray(packages) && packages.some(pkg => {
              return pkg.shippingAddressId === addr.id &&
                     pkg.shippingRequested === true &&
                     pkg.status !== 'shipped' &&
                     pkg.status !== 'delivered';
            });

            // Проверка 2: Есть ли посылка на складе, привязанная к этому адресу
            const hasWarehousePackage = Array.isArray(packages) && packages.some(pkg => {
              return (pkg.status === 'ready' || pkg.status === 'pending_shipping') &&
                     pkg.orderItem?.order?.addressId === addr.id &&
                     !pkg.shippingRequested &&
                     !pkg.disposed;
            });

            // Проверка 3: Есть ли заказы на этот адрес, у которых еще нет посылок
            const hasOrderWithoutPackage = Array.isArray(orders) && orders.some(order => {
              // Заказ привязан к этому адресу
              if (order.addressId !== addr.id) return false;

              // Проверяем, есть ли хотя бы один item в заказе без посылки
              return order.items?.some((item: any) => {
                // У item'а нет package (или package в статусе disposed)
                return !item.package || item.package.disposed;
              });
            });

            // ЛОГИКА БЛОКИРОВКИ:
            // cannotEdit (полная блокировка адреса) - только если запрошен shipping
            // cannotDelete (блокировка удаления и смены страны) - если есть любая привязка к адресу
            const cannotEdit = loadingData || hasRequestedShipping;
            const cannotDelete = loadingData || hasRequestedShipping || hasWarehousePackage || hasOrderWithoutPackage;

            console.log('Address blocking check for', addr.id, addr.name, ':', {
              hasRequestedShipping,
              hasWarehousePackage,
              hasOrderWithoutPackage,
              cannotEdit,
              cannotDelete
            });

            return (
            <div key={addr.id} className={`group relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
              hasRequestedShipping
                ? 'bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 shadow-md'
                : (hasWarehousePackage || hasOrderWithoutPackage)
                ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300 shadow-md'
                : 'bg-gradient-to-br from-white via-gray-50 to-blue-50 border border-gray-200 hover:border-green-400 hover:shadow-xl hover:scale-[1.02]'
            }`}>
              {/* Decorative corner element */}
              <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 rounded-full blur-2xl opacity-20 ${
                hasRequestedShipping ? 'bg-red-400' : (hasWarehousePackage || hasOrderWithoutPackage) ? 'bg-yellow-400' : 'bg-green-400'
              }`}></div>

              {/* Header with flag and name */}
              <div className="relative flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md ${
                    (hasRequestedShipping || hasWarehousePackage || hasOrderWithoutPackage) ? 'bg-white/80' : 'bg-white'
                  }`}>
                    {countries.find(c => c.name === addr.country)?.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{addr.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{addr.country}</p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-col gap-1.5 items-end ml-2">
                  {hasRequestedShipping && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      LOCKED
                    </span>
                  )}
                  {!hasRequestedShipping && (hasWarehousePackage || hasOrderWithoutPackage) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      IN USE
                    </span>
                  )}
                  {addr.isCommercial && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      Business
                    </span>
                  )}
                </div>
              </div>

              {/* Address details with modern icons */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{addr.address}</p>
                    {addr.apartment && <p className="text-sm text-gray-500 truncate">{addr.apartment}</p>}
                    <p className="text-sm text-gray-600 truncate mt-1">{addr.city}, {addr.state} {addr.postalCode}</p>
                  </div>
                </div>

                {addr.phoneNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium truncate">{addr.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Warning messages */}
              {hasRequestedShipping && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl">
                  <p className="text-xs font-semibold text-red-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Active shipment in progress - Address fully locked until delivery
                  </p>
                </div>
              )}
              {!hasRequestedShipping && (hasWarehousePackage || hasOrderWithoutPackage) && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-xl">
                  <p className="text-xs font-semibold text-yellow-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Address in use - Cannot delete or change country
                  </p>
                </div>
              )}

              {/* USA Tax Information */}
              {addr.country === 'United States' && (addr.ssnNumber || addr.taxIdType) && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    USA Tax Information
                  </p>
                  {addr.ssnNumber && (
                    <p className="text-xs text-gray-600 truncate">
                      <span className="font-medium">SSN:</span> {addr.ssnNumber}
                    </p>
                  )}
                  {addr.taxIdType && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="truncate"><span className="font-medium">Tax ID:</span> {addr.taxIdType}</p>
                      <p className="truncate"><span className="font-medium">Tax ID #:</span> {addr.taxIdNumber}</p>
                      <p className="truncate"><span className="font-medium">Company:</span> {addr.companyName}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (cannotEdit) {
                      alert('⚠️ This address is fully locked because there is an active shipment to this address. Please wait until the package is delivered.');
                      return;
                    }
                    setFormData({
                      id: addr.id,
                      name: addr.name,
                      phone: addr.phoneNumber || "",
                      email: addr.email || "",
                      address: addr.address,
                      apartment: addr.apartment || "",
                      city: addr.city,
                      state: addr.state,
                      postalCode: addr.postalCode,
                      country: addr.country,
                      isCommercial: addr.isCommercial || false,
                      ssnNumber: addr.ssnNumber || "",
                      taxIdType: addr.taxIdType || "",
                      taxIdNumber: addr.taxIdNumber || "",
                      companyName: addr.companyName || "",
                      canDelete: !cannotDelete // Pass whether this address can be deleted
                    });
                    setShowForm(true);
                  }}
                  disabled={cannotEdit}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    cannotEdit
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-lg active:scale-95'
                  }`}
                  title={
                    loadingData
                      ? 'Loading data...'
                      : cannotEdit
                      ? 'Address locked - active shipment to this address'
                      : ''
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (cannotDelete) {
                      if (hasRequestedShipping) {
                        alert('⚠️ This address is fully locked because there is an active shipment to this address. Please wait until the package is delivered.');
                      } else {
                        alert('⚠️ This address cannot be deleted because it is currently in use by an order or package. You can edit other fields, but cannot delete the address or change the country.');
                      }
                      return;
                    }
                    setAddressToDelete(addr);
                    setShowDeleteConfirm(true);
                  }}
                  disabled={cannotDelete}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    cannotDelete
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-lg active:scale-95'
                  }`}
                  title={
                    loadingData
                      ? 'Loading data...'
                      : cannotDelete
                      ? hasRequestedShipping
                        ? 'Address locked - active shipment to this address'
                        : 'Address in use - cannot delete or change country'
                      : ''
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно подтверждения */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Verify Your Address</h3>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Please carefully review your delivery address. Make sure all information is correct before saving.
            </p>

            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Name:</span>
                <span className="text-gray-900 font-medium text-xs sm:text-sm break-words">{formData.name}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Phone:</span>
                <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.phone}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Email:</span>
                <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.email}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Address:</span>
                <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.address}</span>
              </div>
              {formData.apartment && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Apartment:</span>
                  <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.apartment}</span>
                </div>
              )}
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">City:</span>
                <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.city}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">State:</span>
                <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.state}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Postal Code:</span>
                <span className="text-gray-900 text-xs sm:text-sm">{formData.postalCode}</span>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Country:</span>
                <span className="text-gray-900 font-medium text-xs sm:text-sm break-words">{formData.country}</span>
              </div>

              {/* USA Tax Information Display */}
              {formData.country === 'United States' && (formData.ssnNumber || formData.taxIdType) && (
                <>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="text-xs sm:text-sm font-semibold text-blue-600 mb-2">🇺🇸 USA Tax Information</div>

                  {formData.ssnNumber && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">SSN:</span>
                      <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.ssnNumber}</span>
                    </div>
                  )}

                  {formData.taxIdType && (
                    <>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Tax ID Type:</span>
                        <span className="text-gray-900 text-xs sm:text-sm">{formData.taxIdType}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Tax ID #:</span>
                        <span className="text-gray-900 text-xs sm:text-sm break-words">{formData.taxIdNumber}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-gray-400 min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium">Company:</span>
                        <span className="text-gray-900 font-medium text-xs sm:text-sm break-words">{formData.companyName}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex gap-2 sm:gap-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>Important:</strong> This address will be used for all your shipments. Double-check that everything is spelled correctly and complete.
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-50 transition-all font-medium touch-manipulation"
              >
                Go Back & Edit
              </button>
              <button
                onClick={confirmSaveAddress}
                className="flex-1 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-700 transition-all font-medium shadow-lg hover:shadow-xl touch-manipulation"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USA Requirement Modal */}
      {showUSARequirementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">🇺🇸 USA Address Requirements</h3>
              <p className="text-sm sm:text-base text-gray-600">Additional information required for USA shipping</p>
            </div>

            <div className="bg-red-50 rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 border-2 border-red-200">
              <p className="text-xs sm:text-sm text-red-900 font-semibold mb-2 sm:mb-3">
                For USA addresses, you must provide <span className="underline">at least one</span> of the following:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">SSN Number</p>
                    <p className="text-xs text-gray-600">Social Security Number (for individuals)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-red-300"></div>
                  <span className="text-xs text-red-600 font-bold">OR</span>
                  <div className="flex-1 h-px bg-red-300"></div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">Company Name</p>
                    <p className="text-xs text-gray-600">Business/Company information (for businesses)</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">
              Please scroll down and fill in one of these fields to continue saving your address.
            </p>

            <button
              onClick={() => setShowUSARequirementModal(false)}
              className="w-full py-2.5 sm:py-3.5 text-sm sm:text-base bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 active:from-red-600 active:to-red-700 transition-all shadow-lg hover:shadow-xl touch-manipulation"
            >
              Got it, I'll fill it in
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && addressToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Delete Address?</h3>
              <p className="text-sm sm:text-base text-gray-600">This action cannot be undone</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">You are about to delete:</p>
              <p className="text-sm sm:text-base text-gray-900 font-semibold truncate">{addressToDelete.name}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{addressToDelete.address}</p>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{addressToDelete.city}, {addressToDelete.state} {addressToDelete.postalCode}</p>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch('/api/user/addresses', {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ id: addressToDelete.id })
                    });

                    if (response.ok) {
                      setAddresses(addresses.filter((a) => a.id !== addressToDelete.id));
                      setShowDeleteConfirm(false);
                      setAddressToDelete(null);
                    } else {
                      const error = await response.json();
                      alert('Error deleting address: ' + error.error);
                    }
                  } catch (error) {
                    console.error('Error deleting address:', error);
                    alert('Failed to delete address');
                  }
                }}
                className="flex-1 py-2.5 sm:py-3.5 text-sm sm:text-base bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 active:from-red-600 active:to-red-700 transition-all shadow-lg hover:shadow-xl touch-manipulation"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setAddressToDelete(null);
                }}
                className="flex-1 py-2.5 sm:py-3.5 text-sm sm:text-base border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 active:bg-gray-50 transition-all touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FAQ Data
const FAQ_ITEMS = [
  {
    id: 1,
    question: "My parcel is stopped at customs, what should I do?",
    answer: "If your parcel is held at customs:\n\n1. Check tracking for customs clearance status\n2. Contact your local customs office for required documents\n3. You may need to pay customs duties/taxes\n4. Provide invoice if requested (you can download it from packages tab after the parcel is shipped)\n5. Customs clearance usually takes 3-7 business days\n\nIf you need help, contact us with your tracking number."
  },
  {
    id: 2,
    question: "How do I track my package?",
    answer: "To track your package:\n\n1. Go to 'Packages' tab in your profile\n2. Find your package and copy tracking number that is provided after shipping\n3. Scroll to the top of the page and paste tracking number in Japan Post Tracking or FedEx Tracking\n4. Tracking updates every 12-24 hours"
  },
  {
    id: 3,
    question: "When will my order be shipped?",
    answer: "Shipping timeline:\n\n1. Order processing: 1-3 business days\n2. International shipping: 3-21 business days (depending on shipping method)\n\nYou'll receive tracking information once your package is shipped from Japan. Check the 'Packages' tab for updates."
  },
  {
    id: 4,
    question: "How do I add balance to my account?",
    answer: "To add balance:\n\n1. Go to cart\n2. Click 'Top Up Balance'\n3. Enter the amount you want to add\n4. Choose payment method (Stripe, PayPal)\n5. Complete the payment\n\nYour balance will be updated immediately and can be used for purchasing items or paying for shipping."
  },
  {
    id: 5,
    question: "What are the shipping costs?",
    answer: "Shipping costs depend on:\n\n1. Package weight and dimensions\n2. Destination country\n3. Shipping method (Japan Post EMS, FedEx)\n\nFinal costs will be calculated when your package is ready to ship.",
    link: "/shipping-calculator",
    linkText: "Open Shipping Calculator"
  },
  {
    id: 6,
    question: "Can I combine multiple items into one package?",
    answer: "Yes! Package consolidation is available:\n\n1. All your items are stored in our Japanese warehouse\n2. We can combine multiple items into one package\n3. This reduces shipping costs significantly\n4. Request consolidation in the 'Packages' section\n5. We'll repack items and provide new weight/dimensions\n\nConsolidation is free and typically takes 5 hours, rarely takes 1-2 business days."
  },
  {
    id: 7,
    question: "What items are prohibited to ship?",
    answer: "Prohibited items include:\n\n❌ Hazardous materials (batteries, flammable items)\n❌ Weapons and weapon replicas\n❌ Illegal drugs and medicines\n❌ Counterfeit goods\n❌ Food and perishables (some exceptions apply)\n\nIf unsure, contact us before purchasing.",
    links: [
      { url: "/prohibited-items", text: "Prohibited Items Page" },
      { url: "https://www.post.japanpost.jp/int/use/restriction/index_en.html", text: "Japan Post Prohibited Items", external: true },
      { url: "https://www.fedex.com/en-us/shipping/international-prohibited-items.html", text: "FedEx Prohibited Items", external: true }
    ]
  },
  {
    id: 8,
    question: "How do I cancel or modify my order?",
    answer: "To cancel or modify an order:\n\n1. Go to 'Packages' tab\n2. Find your order (must be in 'Ready' status)\n3. Click 'Configure Shipping Options' and choose Cancel Purchase (if seller approves)\n\n⚠️ Orders cannot be cancelled if:\n- Seller doesn't accept cancelations\n- Shipped to you\n- Product have been consolidated"
  },
  {
    id: 9,
    question: "Do I have to pay customs fees?",
    answer: "Customs fees depend on your country:\n\n1. Each country has different import thresholds\n2. You're responsible for customs duties/taxes\n3. We mark packages accurately (cannot mark as 'gift' or undervalue)\n4. Fees are paid to customs, not to us\n\nCheck your country's customs regulations:\n- Most countries: threshold is $50-$800\n- EU: threshold is €150\n- 🇺🇸 USA (Updated Nov 2025): $800 de minimis ELIMINATED\n  → ALL shipments now subject to duties (10-41% reciprocal tariffs)\n  → Only gifts under $100 remain duty-free\n  → Tariffs vary by product and country of origin\n\nWe provide all necessary documentation."
  },
  {
    id: 10,
    question: "My package is damaged or missing items",
    answer: "📦 Damage Claim Guide\n\nIf your package arrives damaged, follow these steps immediately. Your prompt action is essential for us to claim compensation from the shipping carrier.\n\n🚨 1. IMMEDIATE STEPS (Critical!)\n\n✓ KEEP ALL ITEMS - Do not throw away the outer box, all packaging materials, or the damaged goods. They are needed for inspection.\n\n✓ Take Clear Photos - Photograph the damaged package exterior (including the shipping label) and the damaged product itself.\n\n✓ Contact Us - Send us the photos and the tracking number immediately.\n\n📋 2. OFFICIAL DAMAGE REPORT\n\n⚠️ JAPAN POST EMS ONLY:\nYou must obtain official proof of damage from your local postal service:\n1. Visit your local post office with the damaged package and contents\n2. File a damage report and request an Official Damage Certificate or Damage Report\n3. Send the official document scan/photo to us\n\n✓ FEDEX SHIPPING:\nNo need to visit local post office - just take clear photos of:\n1. Damaged outer packaging (all sides, including FedEx label)\n2. Damaged product from multiple angles\n3. All packaging materials inside the box\n\n⏱️ 3. COMPENSATION PROCESS\n\n• Who Files: We (the sender) must file the compensation claim\n• Your Role: Provide photos and documentation (damage certificate for EMS, photos only for FedEx)\n• Timeline: The process takes 1-3 months\n• Compensation Amount: Based on actual damage, up to the insured amount",
    action: "request_compensation"
  }
];

function FavouritesSection() {
  const { formatPrice, currency } = useCurrency();
  const { favourites, removeFromFavourites } = useFavourites();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (favourites.length === 0) {
    return (
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Your Favourites</h2>
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
            <Heart className="text-gray-400" size={24} />
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-700">No favourites yet</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Products you add to favourites will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
        Your Favourites ({favourites.length})
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {favourites.map((item) => (
          <div
            key={item.itemCode}
            className="group bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-300 transition-all duration-200 cursor-pointer"
            onClick={() => {
              if (item.itemUrl) {
                router.push(`/product/${encodeURIComponent(item.itemCode)}?source=${item._source || 'rakuten'}`);
              }
            }}
          >
            <div className="relative aspect-square bg-gray-50">
              <img
                src={item.imageUrl || '/placeholder.png'}
                alt={item.itemName}
                className="w-full h-full object-contain"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromFavourites(item.itemCode);
                }}
                className="absolute top-2 right-2 p-1.5 sm:p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 transition-colors z-10"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-red-500 text-red-500" />
              </button>
            </div>

            <div className="p-2 sm:p-3">
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-1 sm:mb-2">
                {item.itemName}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                {formatPrice(item.itemPrice)}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {item._source || 'rakuten'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesSection({ onMessagesRead }: { onMessagesRead: () => void }) {
  // const { socket, isConnected } = useSocket(); // DISABLED - using polling instead
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<number | null>(null);
  const [showFAQ, setShowFAQ] = useState(true);
  const [showCompensationModal, setShowCompensationModal] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedFAQ]);

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const unreadMessages = messages.filter(m => m.senderType === 'admin' && !m.read);

      for (const msg of unreadMessages) {
        await fetch('/api/messages', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messageId: msg.id })
        });
      }

      if (unreadMessages.length > 0) {
        onMessagesRead(); // Update unread count in parent
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        // Mark admin messages as read after loading
        if (data.messages.some((m: any) => m.senderType === 'admin' && !m.read)) {
          setTimeout(() => markMessagesAsRead(), 1000);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleFAQSelect = (faqId: number) => {
    setSelectedFAQ(faqId);
    setShowFAQ(false);
  };

  const handleBackToFAQ = () => {
    setSelectedFAQ(null);
    setShowFAQ(true);
  };

  const selectedFAQItem = FAQ_ITEMS.find(item => item.id === selectedFAQ);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Help & Support</h2>
        {!showFAQ && (
          <button
            onClick={handleBackToFAQ}
            className="text-xs sm:text-sm text-green-600 hover:text-green-700 active:text-green-700 font-medium flex items-center gap-1 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to questions
          </button>
        )}
      </div>

      {/* Admin Messages (if any) */}
      {messages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <MessageCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 text-sm sm:text-base">Important Messages from Admin</h3>
              <div className="space-y-2 sm:space-y-3">
                {messages.filter(m => m.senderType === 'admin').map((msg) => (
                  <div key={msg.id} className="bg-white rounded-lg p-2 sm:p-3 border border-amber-200">
                    <div className="text-xs text-amber-700 mb-1">
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {showFAQ ? (
          <div className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>
              <p className="text-xs sm:text-sm text-gray-600">Select a question to see the answer</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {FAQ_ITEMS.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleFAQSelect(faq.id)}
                  className="w-full text-left p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-100 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md group touch-manipulation"
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1">
                      <div className="mt-0.5 p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <MessageCircle className="text-green-600" size={16} />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                        {faq.question}
                      </p>
                    </div>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-green-600 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : selectedFAQItem ? (
          <div className="p-4 sm:p-6">
            {/* Question */}
            <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
              <div className="flex items-start gap-2 sm:gap-3 mb-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="text-green-600" size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Your Question</div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{selectedFAQItem.question}</h3>
                </div>
              </div>
            </div>

            {/* Answer */}
            <div className="bg-gray-50 rounded-xl p-3 sm:p-5 border border-gray-200">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600 font-semibold mb-2">Answer</div>
                  <div className="text-xs sm:text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {selectedFAQItem.answer}
                  </div>
                  {(selectedFAQItem as any).link && (
                    <a
                      href={(selectedFAQItem as any).link}
                      className="inline-flex items-center gap-2 mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors touch-manipulation"
                    >
                      {(selectedFAQItem as any).linkText || 'Learn More'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  )}
                  {(selectedFAQItem as any).links && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-gray-600 font-semibold mb-2">Useful Links:</div>
                      {(selectedFAQItem as any).links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noopener noreferrer" : undefined}
                          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-green-200 hover:border-green-400 active:border-green-400 hover:bg-green-50 active:bg-green-50 text-green-700 rounded-lg font-medium text-xs sm:text-sm transition-all group touch-manipulation"
                        >
                          <span>{link.text}</span>
                          {link.external ? (
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  {(selectedFAQItem as any).action === 'request_compensation' && (
                    <button
                      onClick={() => setShowCompensationModal(true)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 active:bg-red-700 text-white rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-lg hover:shadow-xl touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Request Compensation
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-900">
                <strong>Still need help?</strong> Contact our support team via Telegram:
                <a href="https://t.me/yoursupport" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-700 active:text-blue-700 font-semibold underline touch-manipulation">
                  @YourSupport
                </a>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Compensation Request Modal */}
      {showCompensationModal && (
        <CompensationModal
          onClose={() => setShowCompensationModal(false)}
        />
      )}
    </div>
  );
}

// Compensation Modal Component
function CompensationModal({ onClose }: { onClose: () => void }) {
  console.log('CompensationModal rendered');
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // For consolidated packages
  const [carrier, setCarrier] = useState<'ems' | 'fedex'>('ems');
  const [compensationType, setCompensationType] = useState<'replace'>('replace'); // Only replacement option
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [damageCertificate, setDamageCertificate] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('CompensationModal mounted, fetching packages');
    fetchShippedPackages();
  }, []);

  // Clear selected items when package changes and set carrier from package shipping method
  useEffect(() => {
    setSelectedItems([]);

    // Set carrier based on package's actual shipping method
    if (selectedPackage) {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg?.shippingMethod) {
        const method = pkg.shippingMethod.toLowerCase();
        // Map shipping methods to carrier types
        if (method === 'fedex') {
          setCarrier('fedex');
        } else if (method === 'ems') {
          setCarrier('ems');
        } else {
          // Default to ems for other methods (DHL, etc.)
          setCarrier('ems');
        }
      }
    }
  }, [selectedPackage, packages]);

  const fetchShippedPackages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      // Получаем список посылок
      const packagesResponse = await fetch('/api/user/packages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Получаем список активных compensation requests
      const compensationResponse = await fetch('/api/user/compensation-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (packagesResponse.ok && compensationResponse.ok) {
        const packagesData = await packagesResponse.json();
        const compensationData = await compensationResponse.json();

        console.log('[Compensation] All packages:', packagesData.packages);
        console.log('[Compensation] Active requests:', compensationData.requests);

        // Получаем ID посылок, которые уже имеют compensation request
        const packageIdsWithClaims = new Set(
          compensationData.requests.map((req: any) => req.packageId)
        );

        // Фильтруем посылки со статусом shipped или delivered (case-insensitive)
        // И исключаем товары, которые были объединены в консолидированные посылки
        // И исключаем посылки, по которым уже есть активный спор
        const shippedPackages = packagesData.packages.filter((pkg: any) => {
          const status = pkg.status?.toLowerCase();
          const isShipped = status === 'shipped' || status === 'in transit' || status === 'delivered' || status === 'in_transit';
          const isNotConsolidatedIntoAnother = !pkg.consolidatedInto; // Исключаем объединенные товары
          const hasNoClaim = !packageIdsWithClaims.has(pkg.id); // Исключаем посылки со спорами
          return isShipped && isNotConsolidatedIntoAnother && hasNoClaim;
        });

        console.log('[Compensation] Available packages (no claims):', shippedPackages);
        setPackages(shippedPackages);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDamageCertificate(e.target.files[0]);
    }
  };

  const removeCertificate = () => {
    setDamageCertificate(null);
    if (certificateInputRef.current) {
      certificateInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Certificate is required only for EMS
    if (!selectedPackage || !description.trim() || files.length === 0) {
      alert('Please fill all required fields and upload photos/videos');
      return;
    }

    // Check if consolidated and items selected
    const pkg = packages.find(p => p.id === selectedPackage);
    const isConsolidated = pkg?.consolidated && pkg?.consolidatedPackages && pkg.consolidatedPackages.length > 0;

    if (isConsolidated && selectedItems.length === 0) {
      alert('Please select which items are damaged from the consolidated package');
      return;
    }

    if (carrier === 'ems' && !damageCertificate) {
      alert('Please upload the damage certificate (required for Japan Post EMS)');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('packageId', selectedPackage);
      formData.append('carrier', carrier);
      formData.append('compensationType', compensationType); // Always 'replace'

      // Add selected items if consolidated
      if (isConsolidated && selectedItems.length > 0) {
        formData.append('selectedItems', JSON.stringify(selectedItems));
      }

      // Add selected items info to description if consolidated
      let fullDescription = description;
      if (isConsolidated && selectedItems.length > 0) {
        const itemNames = selectedItems.map(itemId => {
          const consolidatedItem = pkg.consolidatedPackages.find((cp: any) => cp.id === itemId);
          return consolidatedItem?.orderItem?.title || `Item ${itemId.slice(0, 8)}`;
        });
        fullDescription = `[DAMAGED ITEMS: ${itemNames.join(', ')}]\n\n${description}`;
      }

      formData.append('description', fullDescription);
      files.forEach((file) => {
        formData.append('files', file);
      });

      if (damageCertificate) {
        formData.append('certificate', damageCertificate);
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/compensation-request', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setShowSuccess(true);
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting compensation request:', error);
      alert('Failed to submit request. Please try again or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">📝 Report Damaged/Missing Item</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 active:text-gray-600 transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">Submit a claim for damaged or missing items</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Shipping Method Display */}
          {(() => {
            if (!selectedPackage) return null;

            const pkg = packages.find(p => p.id === selectedPackage);
            if (!pkg?.shippingMethod) return null;

            const method = pkg.shippingMethod.toLowerCase();
            const isFedEx = method === 'fedex';
            const isEMS = method === 'ems';

            // Display the actual shipping method from the package
            return (
              <div className={`border-2 rounded-lg p-3 sm:p-4 ${
                isFedEx
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isFedEx ? 'bg-purple-200' : 'bg-blue-200'
                  }`}>
                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${isFedEx ? 'text-purple-700' : 'text-blue-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs sm:text-sm font-bold ${isFedEx ? 'text-purple-900' : 'text-blue-900'}`}>
                      {isFedEx && '📦 FedEx'}
                      {isEMS && '📮 Japan Post EMS'}
                      {!isFedEx && !isEMS && `📦 ${pkg.shippingMethod.toUpperCase()}`}
                    </h4>
                    <p className={`text-xs mt-1 ${isFedEx ? 'text-purple-700' : 'text-blue-700'}`}>
                      {isFedEx
                        ? 'No need to visit local post office - just take clear photos of the damage.'
                        : 'You must obtain official proof of damage from your local postal service.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Package Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
              Select Package <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="text-xs sm:text-sm text-gray-500">Loading packages...</div>
            ) : packages.length === 0 ? (
              <div className="p-6 sm:p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-xs sm:text-sm text-gray-500">No shipped packages found</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto pr-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left touch-manipulation ${
                      selectedPackage === pkg.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 active:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Package Icon/Image */}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedPackage === pkg.id ? 'bg-green-200' : 'bg-gray-100'
                      }`}>
                        {pkg.orderItem?.image ? (
                          <img
                            src={pkg.orderItem.image}
                            alt="Package"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className={`w-6 h-6 sm:w-8 sm:h-8 ${selectedPackage === pkg.id ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>

                      {/* Package Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`font-bold text-xs sm:text-sm ${selectedPackage === pkg.id ? 'text-green-900' : 'text-gray-900'}`}>
                            {pkg.trackingNumber || `Package #${pkg.id.slice(0, 8)}`}
                          </h4>
                          {selectedPackage === pkg.id && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {pkg.orderItem?.title && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {pkg.orderItem.title}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                            pkg.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            pkg.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {pkg.status}
                          </span>

                          {pkg.shippingMethod && (
                            <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium uppercase">
                              {pkg.shippingMethod}
                            </span>
                          )}

                          {pkg.consolidated && pkg.consolidatedPackages && pkg.consolidatedPackages.length > 0 && (
                            <span className="px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              📦 {pkg.consolidatedPackages.length} items
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Select Damaged Items - For Consolidated Packages */}
          {selectedPackage && (() => {
            const pkg = packages.find(p => p.id === selectedPackage);
            const isConsolidated = pkg?.consolidated && pkg?.consolidatedPackages && pkg.consolidatedPackages.length > 0;

            if (!isConsolidated) return null;

            // All items in consolidated package (only the consolidated items, not the main package)
            const allItems = pkg.consolidatedPackages.map((cp: any) => ({
              id: cp.id,
              title: cp.orderItem?.title || `Item ${cp.id.slice(0, 8)}`,
              image: cp.orderItem?.image
            }));

            return (
              <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-3 sm:p-4">
                <label className="block text-xs sm:text-sm font-semibold text-orange-900 mb-2 sm:mb-3">
                  Which items are damaged? <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-orange-700 mb-3">
                  This is a consolidated package with multiple items. Select the items that are damaged or missing.
                </p>

                <div className="space-y-2">
                  {allItems.map((item: any) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all touch-manipulation ${
                        selectedItems.includes(item.id)
                          ? 'border-orange-500 bg-white shadow-sm'
                          : 'border-orange-200 bg-white hover:border-orange-300 active:border-orange-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                      />

                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}

                      <span className="text-xs sm:text-sm font-medium text-gray-900 flex-1">{item.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Describe the damage or missing items <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe in detail what is damaged or missing. Include specific items, extent of damage, etc."
              rows={5}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none resize-none text-xs sm:text-sm"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Upload Photos/Videos <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Include photos of: damaged package exterior with EMS label, damaged items, all packaging materials
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 active:border-green-500 hover:bg-green-50 active:bg-green-50 transition-all text-gray-600 hover:text-green-700 active:text-green-700 font-medium text-xs sm:text-sm touch-manipulation"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Click to upload files
            </button>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 active:text-red-700 transition-colors touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Damage Certificate Upload - EMS Only */}
          {carrier === 'ems' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                Upload Damage Report/Official Damage Certificate <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Upload the official damage certificate from your local post office (Required for Japan Post EMS claims)
              </p>

            <input
              ref={certificateInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleCertificateChange}
              className="hidden"
            />

            {!damageCertificate ? (
              <button
                type="button"
                onClick={() => certificateInputRef.current?.click()}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg hover:border-blue-500 active:border-blue-500 hover:bg-blue-100 active:bg-blue-100 transition-all text-blue-700 hover:text-blue-800 active:text-blue-800 font-medium text-xs sm:text-sm touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Click to upload damage certificate (PDF or Image)
              </button>
            ) : (
              <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded flex items-center justify-center">
                    {damageCertificate.type === 'application/pdf' ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-blue-900">{damageCertificate.name}</p>
                    <p className="text-xs text-blue-700">{(damageCertificate.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeCertificate}
                  className="text-red-500 hover:text-red-700 active:text-red-700 transition-colors touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:bg-gray-50 transition-colors text-xs sm:text-sm touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPackage || !description.trim() || files.length === 0 || !damageCertificate}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 active:bg-red-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm touch-manipulation"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/95 to-emerald-50/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 animate-in fade-in duration-300">
          <div className="text-center p-6 sm:p-8 animate-in zoom-in duration-500">
            {/* Success Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-2xl animate-in zoom-in duration-700">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-in zoom-in duration-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 animate-in slide-in-from-bottom duration-700">
              Request Submitted!
            </h3>
            <p className="text-base sm:text-lg text-gray-700 mb-2 animate-in slide-in-from-bottom duration-900">
              Your compensation request has been received.
            </p>
            <p className="text-sm sm:text-md text-gray-600 animate-in slide-in-from-bottom duration-1000">
              We'll review it and contact you soon! 📧
            </p>

            {/* Loading Bar */}
            <div className="mt-4 sm:mt-6 w-48 sm:w-64 mx-auto">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-[loading_3s_ease-in-out]" style={{
                  animation: 'loading 3s ease-in-out forwards',
                  width: '0%'
                }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Closing automatically...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Coupons Section Component
function CouponsSection() {
  const { formatPrice, currency } = useCurrency();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Force re-render when currency changes
  useEffect(() => {
    forceUpdate();
  }, [currency]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('[Coupons] Token exists:', !!token);
        if (!token) {
          console.log('[Coupons] No token found');
          setLoading(false);
          return;
        }

        console.log('[Coupons] Fetching from /api/user/coupons...');
        const response = await fetch('/api/user/coupons', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('[Coupons] Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[Coupons] Data received:', data);
          console.log('[Coupons] Number of coupons:', data.coupons?.length || 0);
          setCoupons(data.coupons || []);
        } else {
          const errorData = await response.json();
          console.error('[Coupons] Error response:', errorData);
        }
      } catch (error) {
        console.error('[Coupons] Error fetching coupons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">My Coupons</h2>
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-base sm:text-lg font-medium text-gray-700">No coupons available</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Your discount coupons will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">My Coupons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {coupons.map((coupon: any) => (
          <div
            key={coupon.id}
            className={`relative overflow-hidden rounded-xl border-2 transition-all ${
              coupon.status === 'used' || coupon.status === 'expired' || new Date(coupon.expiresAt) < new Date()
                ? 'border-gray-200 bg-gray-50 opacity-60'
                : 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg'
            }`}
          >
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="text-purple-600">
                <circle cx="50" cy="50" r="40" fill="currentColor" />
              </svg>
            </div>

            <div className="relative p-4">
              {/* Coupon header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Discount</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatPrice(coupon.discountAmount)}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                {coupon.status === 'used' ? (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">Used</span>
                ) : coupon.status === 'expired' || new Date(coupon.expiresAt) < new Date() ? (
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">Expired</span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">Active</span>
                )}
              </div>

              {/* Coupon code */}
              <div className="mb-3 p-3 bg-white rounded-lg border border-dashed border-purple-300">
                <p className="text-xs text-gray-500 mb-1">Coupon Code</p>
                <p className="text-sm font-mono font-bold text-gray-900">{coupon.code}</p>
              </div>

              {/* Description */}
              {coupon.description && (
                <p className="text-xs text-gray-600 mb-3">{coupon.description}</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-purple-600">{formatPrice(coupon.discountAmount)} OFF</span>
                <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Disputes Section Component
function DisputesSection() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [refundFormRequest, setRefundFormRequest] = useState<any>(null);
  const [refundMethod, setRefundMethod] = useState<'balance' | 'stripe' | 'paypal'>('balance');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [bankDetails, setBankDetails] = useState({
    name: '',
    address: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    swiftCode: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCompensationModal, setShowCompensationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Edit/Resubmit states for rejected requests
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editCertificate, setEditCertificate] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle ESC key to close success modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSuccessModal) {
        setShowSuccessModal(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showSuccessModal]);

  useEffect(() => {
    console.log('DisputesSection: showCompensationModal state changed to:', showCompensationModal);
  }, [showCompensationModal]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/compensation-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching compensation requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = {
        requestId: refundFormRequest.id,
        refundMethod
      };

      if (refundMethod === 'stripe' || refundMethod === 'paypal') {
        if (!paymentEmail || !cardLast4) {
          alert('Please fill all required payment details');
          setSubmitting(false);
          return;
        }

        if (cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
          alert('Card last 4 digits must be exactly 4 numbers');
          setSubmitting(false);
          return;
        }

        payload.paymentEmail = paymentEmail;
        payload.cardLast4 = cardLast4;
      }

      const response = await fetch('/api/user/request-refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(data.message || 'Refund request submitted successfully!');
        setShowSuccessModal(true);
        setRefundFormRequest(null);
        setBankDetails({ name: '', address: '', accountNumber: '', routingNumber: '', bankName: '', swiftCode: '' });
        setPaymentEmail('');
        setCardLast4('');
        setRefundMethod('balance');
        fetchRequests(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error submitting refund request:', error);
      alert('Failed to submit refund request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRequest = (request: any) => {
    setEditingRequest(request);
    setEditDescription(request.description);
    setEditFiles([]);
    setEditCertificate(null);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editDescription.trim()) {
      alert('Please provide a description');
      return;
    }

    setResubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();

      formData.append('requestId', editingRequest.id);
      formData.append('description', editDescription);

      // Add new files if any
      editFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Add certificate if provided
      if (editCertificate) {
        formData.append('certificate', editCertificate);
      }

      const response = await fetch('/api/user/resubmit-compensation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Request resubmitted successfully!');
        setEditingRequest(null);
        setEditDescription('');
        setEditFiles([]);
        setEditCertificate(null);
        fetchRequests(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to resubmit request');
      }
    } catch (error) {
      console.error('Error resubmitting compensation request:', error);
      alert('Failed to resubmit request. Please try again.');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">Loading disputes...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              console.log('New Claim button clicked, current state:', showCompensationModal);
              setShowCompensationModal(true);
              console.log('After setState called');
            }}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 active:from-red-600 active:to-red-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            New Claim
          </button>
        </div>

        {/* EMS Dispute Process Warning */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm sm:text-base font-bold text-amber-900 mb-2">⚠️ EMS Damage Claim Process & Timeline</h4>
              <div className="text-xs sm:text-sm text-amber-800 space-y-2">
                <p className="font-semibold">If your package was shipped via <span className="underline">Japan Post EMS</span> and you discovered damage:</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2">
                  <li><strong>Get Certificate:</strong> You must visit your local Japan Post office to obtain an official damage certificate</li>
                  <li><strong>Submit to Japrix:</strong> Provide the certificate and evidence to us</li>
                  <li><strong>Document Submission:</strong> Japrix will submit all documentation to Japan Post</li>
                  <li><strong>Investigation Period:</strong> Japan Post will review and investigate the claim</li>
                  <li><strong>Timeline:</strong> This process takes <strong className="text-amber-900">minimum 1-3 months</strong></li>
                  <li><strong>Refund:</strong> Compensation is only issued if the claim is successfully approved by Japan Post</li>
                </ol>
                <p className="mt-3 pt-3 border-t border-amber-200 font-medium text-amber-900">
                  💡 Please be patient - EMS claims are handled directly by Japan Post and we cannot expedite this process.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-12 sm:py-16">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <AlertCircle size={40} className="text-gray-400 sm:w-12 sm:h-12" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Disputes</h3>
          <p className="text-gray-600 text-sm sm:text-base px-4">You haven't submitted any compensation requests yet.</p>
        </div>

        {/* Compensation Modal */}
        {showCompensationModal && (
          <CompensationModal
            onClose={() => {
              console.log('Closing CompensationModal');
              setShowCompensationModal(false);
              fetchRequests(); // Refresh list after submission
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Compensation Requests</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Track and manage your damage claims</p>
        </div>
        <button
          onClick={() => {
            console.log('New Claim button clicked (with requests), current state:', showCompensationModal);
            setShowCompensationModal(true);
            console.log('After setState called (with requests)');
          }}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 active:from-red-600 active:to-red-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          New Claim
        </button>
      </div>

      {/* EMS Dispute Process Warning */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm sm:text-base font-bold text-amber-900 mb-2">⚠️ EMS Damage Claim Process & Timeline</h4>
            <div className="text-xs sm:text-sm text-amber-800 space-y-2">
              <p className="font-semibold">If your package was shipped via <span className="underline">Japan Post EMS</span> and you discovered damage:</p>
              <ol className="list-decimal list-inside space-y-1.5 ml-2">
                <li><strong>Get Certificate:</strong> You must visit your local Japan Post office to obtain an official damage certificate</li>
                <li><strong>Submit to Japrix:</strong> Provide the certificate and evidence to us</li>
                <li><strong>Document Submission:</strong> Japrix will submit all documentation to Japan Post</li>
                <li><strong>Investigation Period:</strong> Japan Post will review and investigate the claim</li>
                <li><strong>Timeline:</strong> This process takes <strong className="text-amber-900">minimum 1-3 months</strong></li>
                <li><strong>Refund:</strong> Compensation is only issued if the claim is successfully approved by Japan Post</li>
              </ol>
              <p className="mt-3 pt-3 border-t border-amber-200 font-medium text-amber-900">
                💡 Please be patient - EMS claims are handled directly by Japan Post and we cannot expedite this process.
              </p>
            </div>
          </div>
        </div>
      </div>

      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Request #{request.id.slice(0, 8)}
                </h3>
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)} w-fit`}>
                  {request.status}
                </span>
              </div>

              {request.package && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                  <Package size={14} className="sm:w-4 sm:h-4" />
                  <span className="truncate">Package: {request.package.trackingNumber || `#${request.package.id.slice(0, 8)}`}</span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-500">
                Submitted: {new Date(request.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <button
              onClick={() => setSelectedRequest(request)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-green-600 hover:bg-green-50 active:bg-green-50 rounded-lg transition-colors touch-manipulation w-full sm:w-auto"
            >
              View Details
            </button>
          </div>

          {/* Package Info */}
          {request.package?.orderItem && (
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg mb-3 sm:mb-4">
              {request.package.orderItem.image && (
                <img
                  src={request.package.orderItem.image}
                  alt={request.package.orderItem.title}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{request.package.orderItem.title}</p>
                <p className="text-xs sm:text-sm text-gray-600">¥{request.package.orderItem.price?.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Description Preview */}
          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{request.description}</p>
          </div>

          {/* Admin Notes */}
          {request.adminNotes && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-1">Admin Response:</p>
              <p className="text-xs sm:text-sm text-blue-800">{request.adminNotes}</p>
            </div>
          )}

          {/* Refund Action for Approved Requests */}
          {request.status === 'Approved' && !request.refundProcessed && !request.refundMethod && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              {request.approvedForRefund ? (
                <button
                  onClick={() => setRefundFormRequest(request)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Request Refund
                </button>
              ) : (
                <div className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs sm:text-sm text-center border border-yellow-200">
                  ⏳ Proceedings have begun
                </div>
              )}
            </div>
          )}

          {/* Refund Status */}
          {request.status === 'Approved' && request.refundMethod && (
            <div className={`mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg border ${
              request.refundProcessed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                request.refundProcessed ? 'text-green-900' : 'text-blue-900'
              }`}>
                {request.refundProcessed ? '✅ Refund Completed' : '⏳ Refund Processing'}
              </p>
              <p className={`text-xs sm:text-sm mb-1 ${
                request.refundProcessed ? 'text-green-800' : 'text-blue-800'
              }`}>
                Method: {request.refundMethod === 'balance' ? '💰 Site Balance' :
                         request.refundMethod === 'stripe' ? '💳 Stripe (Card)' :
                         request.refundMethod === 'paypal' ? '🔵 PayPal' : '🏦 Bank Transfer'}
              </p>

              {/* Balance refund info */}
              {request.refundProcessed && request.refundMethod === 'balance' && (
                <p className="text-xs text-green-600 mt-1">
                  ✨ Refund has been added to your account balance!
                </p>
              )}

              {/* Stripe/PayPal processing time */}
              {request.refundProcessed && (request.refundMethod === 'stripe' || request.refundMethod === 'paypal') && (
                <div className="mt-2 pt-2 border-t border-green-300">
                  <p className="text-xs text-green-800 font-medium">
                    ⏱️ Expected processing time: 5-10 business days
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    The refund has been initiated and will appear in your payment method soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Configure Button for Rejected Requests */}
          {request.status === 'Rejected' && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEditRequest(request)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-600 active:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Configure & Resubmit
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto my-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Request Details</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">#{selectedRequest.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-600 transition-colors touch-manipulation flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Status */}
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Status</label>
                <div className="mt-2">
                  <span className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Package Info */}
              {selectedRequest.package?.orderItem && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Package</label>
                  <div className="mt-2 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    {selectedRequest.package.orderItem.image && (
                      <img
                        src={selectedRequest.package.orderItem.image}
                        alt={selectedRequest.package.orderItem.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedRequest.package.orderItem.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600">¥{selectedRequest.package.orderItem.price?.toLocaleString()}</p>
                      {selectedRequest.package.trackingNumber && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">Tracking: {selectedRequest.package.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">Description</label>
                <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Photos/Videos */}
              {selectedRequest.files && JSON.parse(selectedRequest.files).length > 0 && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Evidence Files</label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {JSON.parse(selectedRequest.files).map((file: string, index: number) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-500 active:border-green-500 transition-colors touch-manipulation"
                      >
                        <img
                          src={file}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Damage Certificate */}
              {selectedRequest.damageCertificate && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Damage Certificate</label>
                  <div className="mt-2">
                    <a
                      href={selectedRequest.damageCertificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-100 transition-colors touch-manipulation text-xs sm:text-sm"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Certificate
                    </a>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.adminNotes && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Admin Response</label>
                  <div className="mt-2 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap">{selectedRequest.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-medium text-gray-900 break-words">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedRequest.updatedAt !== selectedRequest.createdAt && (
                    <div>
                      <p className="text-gray-600">Last Updated</p>
                      <p className="font-medium text-gray-900 break-words">
                        {new Date(selectedRequest.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 rounded-b-2xl">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-700 text-white rounded-lg font-semibold transition-colors touch-manipulation text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Form Modal */}
      {refundFormRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto" onClick={() => setRefundFormRequest(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Request Refund</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Choose how you want to receive your refund</p>
                </div>
                <button
                  onClick={() => setRefundFormRequest(null)}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-600 transition-colors touch-manipulation flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRefundSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Refund Method Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                  Refund Method <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {/* Site Balance Option */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('balance')}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all touch-manipulation ${
                      refundMethod === 'balance'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          refundMethod === 'balance' ? 'bg-green-200' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${refundMethod === 'balance' ? 'text-green-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${refundMethod === 'balance' ? 'text-green-900' : 'text-gray-900'}`}>
                            💰 Site Balance
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            Instant refund to your account balance
                          </p>
                        </div>
                      </div>
                      {refundMethod === 'balance' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Stripe Option */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('stripe')}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all touch-manipulation ${
                      refundMethod === 'stripe'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          refundMethod === 'stripe' ? 'bg-blue-200' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${refundMethod === 'stripe' ? 'text-blue-700' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${refundMethod === 'stripe' ? 'text-blue-900' : 'text-gray-900'}`}>
                            💳 Stripe (Card Refund)
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            Refund to your card (5-10 business days)
                          </p>
                        </div>
                      </div>
                      {refundMethod === 'stripe' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* PayPal Option */}
                  <button
                    type="button"
                    onClick={() => setRefundMethod('paypal')}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all touch-manipulation ${
                      refundMethod === 'paypal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 active:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          refundMethod === 'paypal' ? 'bg-blue-200' : 'bg-gray-100'
                        }`}>
                          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${refundMethod === 'paypal' ? 'text-blue-700' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.06-.39 0-.63l.84-4.11c.07-.34.29-.61.63-.73.34-.12.71-.07 1.02.13.31.2.52.52.58.88l.42 2.05c.04.18.04.37 0 .55-.04.18-.12.35-.24.49-.12.14-.27.25-.44.32-.17.07-.35.1-.54.08l-1.47-.3c-.18-.04-.35-.12-.49-.24-.14-.12-.25-.27-.32-.44zM18.806 9.506c.018 1.172-.16 2.34-.527 3.454-.473 1.396-1.298 2.626-2.41 3.59-1.11.962-2.46 1.613-3.92 1.89-.82.153-1.656.197-2.488.13-.387-.03-.764-.13-1.11-.29-.346-.16-.648-.4-.88-.7-.232-.3-.393-.65-.47-1.02-.07-.37-.06-.75.04-1.12.09-.36.26-.69.5-.96.24-.27.54-.47.87-.59.33-.12.69-.15 1.04-.1l1.47.3c.36.07.73.1 1.1.1.81-.02 1.61-.23 2.33-.61.72-.38 1.32-.95 1.75-1.63.43-.68.68-1.47.71-2.27.03-.8-.14-1.6-.49-2.3-.35-.71-.87-1.31-1.51-1.75-.64-.44-1.39-.7-2.17-.75-.78-.05-1.57.11-2.28.47-.71.36-1.31.9-1.75 1.56-.44.66-.7 1.43-.75 2.23-.05.8.1 1.6.43 2.32.11.24.16.5.15.76-.01.26-.09.51-.23.73-.14.22-.33.4-.56.52-.23.12-.48.17-.74.15-.26-.02-.5-.1-.71-.25-.21-.14-.38-.34-.49-.57-.62-1.17-.91-2.49-.84-3.81.07-1.32.49-2.6 1.21-3.7.72-1.1 1.71-1.97 2.87-2.52 1.16-.55 2.45-.77 3.73-.64 1.28.13 2.49.61 3.51 1.39 1.02.78 1.8 1.82 2.26 3.01.46 1.19.58 2.48.36 3.73z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${refundMethod === 'paypal' ? 'text-blue-900' : 'text-gray-900'}`}>
                            💰 PayPal
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                            Refund to PayPal account (5-10 business days)
                          </p>
                        </div>
                      </div>
                      {refundMethod === 'paypal' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Verification - Show for Stripe and PayPal */}
              {refundMethod !== 'balance' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
                    <p className="text-xs font-semibold text-blue-900 mb-1">ℹ️ Verification Required</p>
                    <p className="text-xs text-blue-700">To speed up the refund process, please provide the payment details you used for the original transaction.</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      {refundMethod === 'stripe' ? 'Email used with Stripe' : 'PayPal Email'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={paymentEmail}
                      onChange={(e) => setPaymentEmail(e.target.value)}
                      placeholder={refundMethod === 'stripe' ? 'your.email@example.com' : 'your-paypal@example.com'}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Last 4 digits of card <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardLast4}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCardLast4(value);
                      }}
                      placeholder="1234"
                      maxLength={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">This helps us verify and speed up your refund</p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRefundFormRequest(null);
                    setBankDetails({ name: '', address: '', accountNumber: '', routingNumber: '', bankName: '', swiftCode: '' });
                    setRefundMethod('balance');
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 active:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-sm sm:text-base"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compensation Modal */}
      {(() => {
        console.log('DisputesSection: showCompensationModal =', showCompensationModal);
        return showCompensationModal && (
          <CompensationModal
            onClose={() => {
              console.log('Closing CompensationModal');
              setShowCompensationModal(false);
              fetchRequests(); // Refresh list after submission
            }}
          />
        );
      })()}

      {/* Edit/Resubmit Modal for Rejected Requests */}
      {editingRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto" onClick={() => setEditingRequest(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit & Resubmit Request</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Update your compensation request details</p>
                </div>
                <button
                  onClick={() => setEditingRequest(null)}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-600 transition-colors touch-manipulation flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleResubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Admin Rejection Note */}
              {editingRequest.adminNotes && (
                <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                  <p className="text-xs sm:text-sm text-red-800">{editingRequest.adminNotes}</p>
                </div>
              )}

              {/* Package Info */}
              {editingRequest.package?.orderItem && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-gray-700">Package</label>
                  <div className="mt-2 flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    {editingRequest.package.orderItem.image && (
                      <img
                        src={editingRequest.package.orderItem.image}
                        alt={editingRequest.package.orderItem.title}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{editingRequest.package.orderItem.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600">¥{editingRequest.package.orderItem.price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Please provide a clear and detailed description of the issue</p>
              </div>

              {/* Current Files */}
              {editingRequest.files && JSON.parse(editingRequest.files).length > 0 && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Current Evidence Files</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {JSON.parse(editingRequest.files).map((file: string, index: number) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-orange-500 active:border-orange-500 transition-colors touch-manipulation"
                      >
                        <img
                          src={file}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* New Files Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Upload New Evidence Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setEditFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:text-xs sm:file:text-sm"
                />
                {editFiles.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">{editFiles.length} new file(s) selected</p>
                )}
              </div>

              {/* Current Certificate */}
              {editingRequest.damageCertificate && (
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">Current Damage Certificate</label>
                  <a
                    href={editingRequest.damageCertificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-100 transition-colors touch-manipulation text-xs sm:text-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Current Certificate
                  </a>
                </div>
              )}

              {/* New Certificate Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Upload New Damage Certificate (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditCertificate(e.target.files[0]);
                    }
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:text-xs sm:file:text-sm"
                />
                {editCertificate && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 truncate">New certificate: {editCertificate.name}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-blue-900">Resubmission Information</p>
                    <p className="text-xs text-blue-800 mt-1">
                      Your request will be reviewed again by our team. Please address the rejection reason mentioned above and provide any additional information that may help resolve your case.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRequest(null);
                    setEditDescription('');
                    setEditFiles([]);
                    setEditCertificate(null);
                  }}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:bg-gray-50 transition-colors touch-manipulation text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resubmitting}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-600 active:to-orange-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg touch-manipulation text-sm sm:text-base"
                >
                  {resubmitting ? 'Resubmitting...' : 'Resubmit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4 animate-fadeIn" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-slideUp relative" onClick={(e) => e.stopPropagation()}>
            {/* Close Button (X) */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 active:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Success Icon with Pulse Effect */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-scaleIn shadow-lg">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">
              ✅ Request Submitted!
            </h2>

            {/* Message */}
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 leading-relaxed px-2">
              {successMessage}
            </p>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">What's next?</p>
                  <p className="text-xs sm:text-sm text-blue-700">Our admin team will review your request and get back to you shortly. You'll receive an update via email.</p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 active:from-green-600 active:to-green-700 shadow-lg hover:shadow-xl transition-all touch-manipulation text-sm sm:text-base"
            >
              Got it, thanks! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Damaged Refund Modal Component
function DamagedRefundModal({ show, damagedRequest, onClose, fetchPackages }: any) {
  const [refundMethod, setRefundMethod] = useState<'balance' | 'stripe' | 'paypal' | 'replace'>('replace');
  const [paymentEmail, setPaymentEmail] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!show || !damagedRequest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (refundMethod !== 'balance' && refundMethod !== 'replace') {
      if (!paymentEmail.trim()) {
        alert('Please enter the email you used for payment');
        return;
      }
      if (!cardLast4.trim() || cardLast4.length !== 4) {
        alert('Please enter exactly 4 digits of your card');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/user/request-damaged-refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          damagedRequestId: damagedRequest.id,
          refundMethod,
          paymentEmail: refundMethod !== 'balance' ? paymentEmail : undefined,
          cardLast4: refundMethod !== 'balance' ? cardLast4 : undefined
        })
      });

      if (response.ok) {
        const successModal = document.createElement('div');
        successModal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4';
        successModal.innerHTML = `
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-[scale-in_0.3s_ease-out]">
            <div class="p-8 text-center">
              <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Refund Request Submitted!</h3>
              <p class="text-gray-600 mb-6">
                ${refundMethod === 'balance' ? 'Your refund will be added to your account balance shortly.' : 'Our team will process your refund within 5-10 business days.'}
              </p>
              <button class="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
                Got it, thanks!
              </button>
            </div>
          </div>
        `;
        document.body.appendChild(successModal);

        successModal.querySelector('button')?.addEventListener('click', () => {
          document.body.removeChild(successModal);
        });

        successModal.addEventListener('click', (e) => {
          if (e.target === successModal) {
            document.body.removeChild(successModal);
          }
        });

        onClose();
        fetchPackages();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error submitting refund request:', error);
      alert('Failed to submit refund request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Request Refund</h2>
                <p className="text-xs sm:text-sm text-green-100">Choose your refund method</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Refund Method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Replace Item - Recommended */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                refundMethod === 'replace' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input type="radio" name="refundMethod" value="replace" checked={refundMethod === 'replace'} onChange={() => setRefundMethod('replace')} className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    Replace with Same Item
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                  </p>
                  <p className="text-xs text-gray-600">We'll order the same item for you again</p>
                  {refundMethod === 'replace' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 font-medium mb-1">⚠️ Important Notice:</p>
                      <p className="text-xs text-amber-700">
                        The entire process will restart from the beginning. You will need to pay all fees again (except the item price), including:
                      </p>
                      <ul className="text-xs text-amber-700 mt-2 ml-4 space-y-1 list-disc">
                        <li>Domestic shipping (if applicable)</li>
                        <li>Any additional services (photo service, reinforcement, etc.)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                refundMethod === 'balance' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}>
                <input type="radio" name="refundMethod" value="balance" checked={refundMethod === 'balance'} onChange={() => setRefundMethod('balance')} className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Account Balance</p>
                  <p className="text-xs text-gray-600">Instant refund to your account</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                refundMethod === 'stripe' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}>
                <input type="radio" name="refundMethod" value="stripe" checked={refundMethod === 'stripe'} onChange={() => setRefundMethod('stripe')} className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Stripe (Card Refund)</p>
                  <p className="text-xs text-gray-600">5-10 business days</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                refundMethod === 'paypal' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
              }`}>
                <input type="radio" name="refundMethod" value="paypal" checked={refundMethod === 'paypal'} onChange={() => setRefundMethod('paypal')} className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">PayPal</p>
                  <p className="text-xs text-gray-600">5-10 business days</p>
                </div>
              </label>
            </div>
          </div>

          {refundMethod !== 'balance' && refundMethod !== 'replace' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-900 mb-1">ℹ️ Verification Required</p>
                <p className="text-xs text-blue-700">To speed up the refund process, please provide the payment details you used for the original transaction.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {refundMethod === 'stripe' ? 'Email used with Stripe' : 'PayPal Email'} <span className="text-red-500">*</span>
                </label>
                <input type="email" value={paymentEmail} onChange={(e) => setPaymentEmail(e.target.value)} placeholder={refundMethod === 'stripe' ? 'your.email@example.com' : 'your-paypal@example.com'} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last 4 digits of card <span className="text-red-500">*</span>
                </label>
                <input type="text" value={cardLast4} onChange={(e) => { const value = e.target.value.replace(/\D/g, '').slice(0, 4); setCardLast4(value); }} placeholder="1234" maxLength={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono" required />
                <p className="text-xs text-gray-500 mt-1">This helps us verify and speed up your refund</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl">
            {submitting ? 'Processing...' : 'Submit Refund Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
// Damaged Refund Modal Component
