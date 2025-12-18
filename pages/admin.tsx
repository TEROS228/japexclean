import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { broadcastUpdate } from "@/lib/sync";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

export default function AdminPage() {
  const router = useRouter();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Track last update time to prevent polling conflicts
  const lastUpdateTimeRef = useRef<Record<string, number>>({
    photos: 0,
    reinforcement: 0,
    consolidation: 0,
    cancelPurchase: 0,
    shipping: 0,
    disposal: 0
  });

  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'warehouse' | 'consolidation' | 'photos' | 'reinforcement' | 'disposal' | 'cancelPurchase' | 'messages' | 'shipping' | 'compensation' | 'damaged'>('orders');
  const [consolidationPackages, setConsolidationPackages] = useState<any[]>([]);
  const [photoRequests, setPhotoRequests] = useState<any[]>([]);
  const [reinforcementRequests, setReinforcementRequests] = useState<any[]>([]);
  const [disposalRequests, setDisposalRequests] = useState<any[]>([]);
  const [cancelPurchaseRequests, setCancelPurchaseRequests] = useState<any[]>([]);
  const [compensationRequests, setCompensationRequests] = useState<any[]>([]);
  const [damagedItemRequests, setDamagedItemRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [shippingRequests, setShippingRequests] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedShippingPackage, setSelectedShippingPackage] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedConsolidationPackage, setSelectedConsolidationPackage] = useState<any>(null);
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationShippingCost, setConsolidationShippingCost] = useState("");
  const [consolidationWeight, setConsolidationWeight] = useState("");
  const [consolidationWeightUnit, setConsolidationWeightUnit] = useState<"kg" | "g">("kg");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCancelPackage, setSelectedCancelPackage] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [packageData, setPackageData] = useState({
    trackingNumber: "",
    weight: "",
    weightUnit: "kg" as "kg" | "g", // Default to kg
    length: "",
    width: "",
    height: "",
    shippingCost: "",
    notes: "",
    shippingMethod: "ems", // Default to EMS
    packagePhoto: null as File | null
  });
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState("");
  const [domesticShippingCosts, setDomesticShippingCosts] = useState<Record<string, number>>({});

  // Функция для получения базового itemCode (без суффикса варианта)
  const getBaseItemCode = (itemCode: string) => {
    return itemCode.split('_')[0];
  };

  // Функция для группировки товаров по базовому itemCode
  const groupItemsByBase = (items: any[]) => {
    const groups: { [baseCode: string]: any[] } = {};
    items.forEach(item => {
      const baseCode = getBaseItemCode(item.itemCode);
      if (!groups[baseCode]) {
        groups[baseCode] = [];
      }
      groups[baseCode].push(item);
    });
    return groups;
  };

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Count unread messages from users
        const unreadCount = data.messages.filter((m: any) => m.senderType === 'user' && !m.read).length;
        setUnreadMessagesCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Hide header when any modal is open
  useEffect(() => {
    const header = document.querySelector('header');
    if ((showPackageModal || showTrackingModal || showConsolidationModal || showRefundModal) && header) {
      header.style.display = 'none';
    } else if (header) {
      header.style.display = '';
    }

    return () => {
      if (header) {
        header.style.display = '';
      }
    };
  }, [showPackageModal, showTrackingModal, showConsolidationModal, showRefundModal]);

  const fetchConsolidationRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/consolidation-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setConsolidationPackages(data.packages);
      }
    } catch (error) {
      console.error('Error fetching consolidation requests:', error);
    }
  };

  const fetchPhotoRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/photo-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setPhotoRequests(data.packages);
      }
    } catch (error) {
      console.error('Error fetching photo requests:', error);
    }
  };

  const fetchReinforcementRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/reinforcement-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setReinforcementRequests(data.packages);
      }
    } catch (error) {
      console.error('Error fetching reinforcement requests:', error);
    }
  };

  const fetchShippingRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/shipping-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setShippingRequests(data.packages);
      }
    } catch (error) {
      console.error('Error fetching shipping requests:', error);
    }
  };

  const fetchDisposalRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/disposal-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setDisposalRequests(data.packages);
      }
    } catch (error) {
      console.error('Error fetching disposal requests:', error);
    }
  };

  const fetchCancelPurchaseRequests = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/cancel-purchase-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setCancelPurchaseRequests(data.packages);
      }
    } catch (error) {
      console.error('Error fetching cancel purchase requests:', error);
    }
  };

  const fetchCompensationRequests = async () => {
    console.log('🔴 fetchCompensationRequests CALLED');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔴 Token:', token ? 'exists' : 'missing');
      if (!token) {
        console.log('🔴 No token, returning early');
        return;
      }

      console.log('🔴 Fetching compensation requests...');
      const response = await fetch(`/api/admin/compensation-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      console.log('Compensation requests response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Compensation requests data:', data);
        console.log('Number of requests:', data.requests?.length || 0);
        setCompensationRequests(data.requests);
      } else {
        console.error('Failed to fetch compensation requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching compensation requests:', error);
    }
  };

  const fetchDamagedItemRequests = async () => {
    console.log('🔴 fetchDamagedItemRequests CALLED');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('🔴 No token for damaged items');
        return;
      }

      console.log('🔴 Fetching damaged item requests...');
      const response = await fetch(`/api/admin/damaged-item-requests?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      console.log('Damaged item requests response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Damaged item requests data:', data);
        console.log('Number of damaged requests:', data.requests?.length || 0);
        setDamagedItemRequests(data.requests);
      } else {
        console.error('Failed to fetch damaged item requests:', response.status);
      }
    } catch (error) {
      console.error('Error fetching damaged item requests:', error);
    }
  };

  const fetchMessages = async (userId?: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const url = userId ? `/api/messages?userId=${userId}` : '/api/messages';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/orders?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store' // Always fetch fresh data
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else if (response.status === 403) {
        alert('Access denied: Admin only');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseItems = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`/api/admin/warehouse-items?_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store' // Always fetch fresh data
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouseItems(data.items);

        // Инициализируем domesticShippingCosts значениями из БД
        const costs: Record<string, number> = {};
        data.items.forEach((item: any) => {
          if (item.domesticShippingCost) {
            // Используем orderId как ключ для группировки
            costs[item.order.id] = item.domesticShippingCost;
          }
        });
        setDomesticShippingCosts(prev => ({ ...prev, ...costs }));
      }
    } catch (error) {
      console.error('Error fetching warehouse items:', error);
    }
  };

  // Функция для загрузки всех данных админки
  const loadAllAdminData = async () => {
    console.log('🟢 loadAllAdminData CALLED - starting Promise.all');
    try {
      await Promise.all([
        fetchOrders(),
        fetchWarehouseItems(),
        fetchConsolidationRequests(),
        fetchPhotoRequests(),
        fetchReinforcementRequests(),
        fetchDisposalRequests(),
        fetchCancelPurchaseRequests(),
        fetchCompensationRequests(),
        fetchDamagedItemRequests(),
        fetchMessages(),
        fetchShippingRequests(),
        fetchUnreadCount()
      ]);
      console.log('🟢 loadAllAdminData COMPLETED');
    } catch (error) {
      console.error('🔴 loadAllAdminData ERROR:', error);
    }
  };

  // Cross-tab sync - слушаем обновления от других вкладок (в том числе от клиентов)
  useAutoRefresh({
    enabled: true,
    onRefresh: loadAllAdminData,
    broadcastType: 'packages' // Слушаем обновления от клиентов
  });

  // Также слушаем обновления от других админских вкладок
  useAutoRefresh({
    enabled: true,
    onRefresh: loadAllAdminData,
    broadcastType: 'admin-data'
  });

  // Слушаем новые заказы от клиентов
  useAutoRefresh({
    enabled: true,
    onRefresh: fetchOrders,
    broadcastType: 'orders'
  });

  // Initial data load
  useEffect(() => {
    fetchOrders();
    fetchWarehouseItems();
    fetchConsolidationRequests();
    fetchPhotoRequests();
    fetchReinforcementRequests();
    fetchDisposalRequests();
    fetchCancelPurchaseRequests();
    fetchCompensationRequests();
    fetchDamagedItemRequests();
    fetchMessages();
    fetchShippingRequests();
    fetchUnreadCount();
  }, []);

  const handleUpdateDomesticShippingCost = async (itemIds: string[], cost: number) => {
    try {
      const token = localStorage.getItem('auth_token');

      // Обновляем все товары в группе
      await Promise.all(itemIds.map(itemId =>
        fetch(`/api/admin/order-items/${itemId}/domestic-shipping`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ domesticShippingCost: cost })
        })
      ));

      // Проверяем результаты
      console.log(`Updated domestic shipping cost for ${itemIds.length} items to ¥${cost}`);

      // Обновляем данные в зависимости от активной вкладки
      if (activeTab === 'warehouse') {
        fetchWarehouseItems();
      } else if (activeTab === 'orders') {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating domestic shipping cost:', error);
      alert('Error updating domestic shipping cost');
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('Confirm that this order has been received? Items will appear in Warehouse tab.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Обновляем state МГНОВЕННО
        setOrders(prev => prev.filter(order => order.id !== orderId));

        // Обновляем warehouse items (новые пакеты могли быть созданы)
        await fetchWarehouseItems();

        // Уведомляем другие вкладки об обновлении
        broadcastUpdate('admin-data');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to confirm order'}`);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Error confirming order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Order deleted successfully!');
        // Уведомляем другие вкладки об обновлении
        broadcastUpdate('admin-data');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to delete order'}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order');
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();

      // Конвертируем вес в килограммы если введён в граммах
      let weightInKg = packageData.weight ? parseFloat(packageData.weight) : 0;
      if (packageData.weightUnit === 'g') {
        weightInKg = weightInKg / 1000; // Граммы в килограммы
      }

      formData.append('orderItemId', selectedItem.id);
      formData.append('trackingNumber', packageData.trackingNumber || '');
      formData.append('weight', weightInKg.toString()); // Всегда отправляем в килограммах
      formData.append('length', packageData.length || '');
      formData.append('width', packageData.width || '');
      formData.append('height', packageData.height || '');
      formData.append('shippingCost', packageData.shippingCost || '0');
      formData.append('notes', packageData.notes || '');
      formData.append('shippingMethod', packageData.shippingMethod || 'ems');

      if (packageData.packagePhoto) {
        formData.append('packagePhoto', packageData.packagePhoto);
      }

      const response = await fetch('/api/admin/packages/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();

        // Добавляем созданный пакет в warehouse МГНОВЕННО
        if (result.package) {
          await fetchWarehouseItems();
        }

        setShowPackageModal(false);
        setPackageData({ trackingNumber: "", weight: "", weightUnit: "kg", length: "", width: "", height: "", shippingCost: "", notes: "", shippingMethod: "ems", packagePhoto: null });

        // Уведомляем другие вкладки об обновлении
        broadcastUpdate('admin-data');

        alert('✅ Package created successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Failed to create package');
    }
  };

  // TEMPORARILY DISABLED FOR DEBUG
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <Link href="/" className="text-green-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {/* Tabs - Modern Grid Design with horizontal scroll fallback */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 min-w-max">
            <button
              onClick={() => setActiveTab('orders')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-green-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-green-500'
              }`}
            >
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm font-bold">Orders</div>
            </button>

            <button
              onClick={() => setActiveTab('warehouse')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'warehouse'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-blue-500'
              }`}
            >
              <div className="text-2xl mb-1">📦</div>
              <div className="text-sm font-bold">Warehouse</div>
              {warehouseItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {warehouseItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('consolidation')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'consolidation'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-purple-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-purple-500'
              }`}
            >
              <div className="text-2xl mb-1">🎁</div>
              <div className="text-sm font-bold">Consolidation</div>
              {consolidationPackages.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {consolidationPackages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'photos'
                  ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-pink-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-pink-500'
              }`}
            >
              <div className="text-2xl mb-1">📸</div>
              <div className="text-sm font-bold">Photos</div>
              {photoRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-pink-500 to-rose-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {photoRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reinforcement')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'reinforcement'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-amber-500'
              }`}
            >
              <div className="text-2xl mb-1">🛡️</div>
              <div className="text-sm font-bold">Reinforcement</div>
              {reinforcementRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {reinforcementRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('disposal')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'disposal'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-orange-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-orange-500'
              }`}
            >
              <div className="text-2xl mb-1">♻️</div>
              <div className="text-sm font-bold">Disposal</div>
              {disposalRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {disposalRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cancelPurchase')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'cancelPurchase'
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-red-500'
              }`}
            >
              <div className="text-2xl mb-1">❌</div>
              <div className="text-sm font-bold">Cancel</div>
              {cancelPurchaseRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {cancelPurchaseRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'messages'
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-indigo-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-indigo-500'
              }`}
            >
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm font-bold">Messages</div>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'shipping'
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-cyan-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-cyan-500'
              }`}
            >
              <div className="text-2xl mb-1">📮</div>
              <div className="text-sm font-bold">Shipping</div>
              {shippingRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {shippingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('compensation')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'compensation'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-rose-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-rose-500'
              }`}
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm font-bold">Compensation</div>
              {compensationRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {compensationRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('damaged')}
              className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'damaged'
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 scale-105'
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600 shadow-md hover:shadow-lg border-2 border-gray-100 hover:border-red-600'
              }`}
            >
              <div className="text-2xl mb-1">⚠️</div>
              <div className="text-sm font-bold">Damaged</div>
              {damagedItemRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-600 to-red-700 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {damagedItemRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.filter(order => !order.confirmed).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              // Группируем заказы по пользователю и времени (в пределах 5 минут)
              Object.entries(
                orders
                  .filter(order => !order.confirmed)
                  .reduce((groups: Record<string, any[]>, order) => {
                    // Создаем ключ группы: userId + временной диапазон (5 минут)
                    const timeGroup = Math.floor(new Date(order.createdAt).getTime() / (5 * 60 * 1000));
                    const groupKey = `${order.userId}_${timeGroup}`;

                    if (!groups[groupKey]) {
                      groups[groupKey] = [];
                    }
                    groups[groupKey].push(order);
                    return groups;
                  }, {})
              ).map(([groupKey, groupOrders]: [string, any[]]) => (
                <div key={groupKey} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {/* User info header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{groupOrders[0].user.email}</h3>
                      <p className="text-sm text-gray-500">{new Date(groupOrders[0].createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{groupOrders.length} order{groupOrders.length > 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(groupOrders[0].userId);
                        setActiveTab('messages');
                        fetchMessages(groupOrders[0].userId);
                      }}
                      className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      title="Message User"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Each order */}
                  <div className="space-y-4">
                    {groupOrders.map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Order header with ID and Confirm button */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded font-mono text-xs">#{order.orderNumber ? String(order.orderNumber).padStart(6, '0') : order.id.slice(0, 8)}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">¥{order.total.toLocaleString()}</p>
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
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                          >
                            Confirm
                          </button>
                        </div>

                        {/* Order items - grouped by base itemCode */}
                        <div className="space-y-2">
                          {Object.entries(groupItemsByBase(order.items)).map(([baseCode, items]: [string, any[]]) => {
                            const isGroup = items.length > 1;
                            const firstItem = items[0];
                            // Используем ID первого товара в группе для хранения стоимости доставки
                            const groupKey = firstItem.id;

                            return (
                              <div key={baseCode} className={`p-3 bg-white rounded-lg border ${isGroup ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                                {isGroup && (
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                      📦 Auto-Consolidation ({items.length} variants)
                                    </span>
                                  </div>
                                )}

                                {/* Показываем все товары в группе */}
                                <div className="space-y-2">
                                  {items.map((item: any, idx: number) => (
                                    <div key={item.id} className={`flex items-start gap-3 ${idx > 0 ? 'pt-2 border-t border-gray-200' : ''}`}>
                                      {item.image && (
                                        <div className="relative flex-shrink-0">
                                          <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                                          {item.quantity > 1 && (
                                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow border border-white">
                                              {item.quantity}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 mb-1 line-clamp-2">{item.title}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                            {item.marketplace === 'yahoo' ? '💜 Yahoo' : '🛍️ Rakuten'}
                                          </span>
                                          {item.options && Object.keys(item.options).length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {Object.entries(item.options).map(([key, value]) => (
                                                <span key={key} className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                  {key}: {value as string}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {item.itemUrl && (
                                          <a
                                            href={item.itemUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
                                          >
                                            View on marketplace
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        )}
                                        <p className="text-xs text-gray-600 mt-1">
                                          Qty: {item.quantity} • ¥{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Одно поле ввода для всей группы */}
                                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                                  <label className="text-xs font-medium text-gray-700">
                                    {isGroup ? `Shipping to warehouse (combined for ${items.length} items):` : 'Shipping to warehouse:'}
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">¥</span>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={domesticShippingCosts[groupKey] ?? firstItem.domesticShippingCost ?? 0}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setDomesticShippingCosts(prev => ({
                                          ...prev,
                                          [groupKey]: value
                                        }));
                                      }}
                                      onBlur={() => {
                                        const cost = domesticShippingCosts[groupKey] ?? firstItem.domesticShippingCost ?? 0;
                                        // Применяем к всем товарам в группе
                                        handleUpdateDomesticShippingCost(items.map(item => item.id), cost);
                                      }}
                                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  {isGroup && (
                                    <span className="text-xs text-green-600">
                                      (will be applied to all variants)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Warehouse Tab */}
        {activeTab === 'warehouse' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Order ID (e.g., 000001 or #000001)..."
                  value={warehouseSearchQuery}
                  onChange={(e) => setWarehouseSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {warehouseSearchQuery && (
                <p className="text-xs text-gray-500 mt-2">
                  Found {warehouseItems.filter(item => {
                    const orderNumber = item.order.orderNumber ? String(item.order.orderNumber).padStart(6, '0') : item.order.id.slice(0, 8);
                    const searchQuery = warehouseSearchQuery.toLowerCase().replace('#', '');
                    return orderNumber.toLowerCase().includes(searchQuery);
                  }).length} items
                </p>
              )}
            </div>

            {warehouseItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No items in warehouse yet</p>
                <p className="text-sm text-gray-400 mt-2">Confirmed order items will appear here</p>
              </div>
            ) : (() => {
              const filteredItems = warehouseItems.filter(item => {
                if (!warehouseSearchQuery) return true;
                const orderNumber = item.order.orderNumber ? String(item.order.orderNumber).padStart(6, '0') : item.order.id.slice(0, 8);
                const searchQuery = warehouseSearchQuery.toLowerCase().replace('#', '');
                return orderNumber.toLowerCase().includes(searchQuery);
              });

              if (filteredItems.length === 0) {
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">No items found for &quot;{warehouseSearchQuery}&quot;</p>
                    <button
                      onClick={() => setWarehouseSearchQuery('')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                );
              }

              // Группируем товары по orderId
              const groupedByOrder: { [orderId: string]: any[] } = {};
              filteredItems.forEach(item => {
                if (!groupedByOrder[item.order.id]) {
                  groupedByOrder[item.order.id] = [];
                }
                groupedByOrder[item.order.id].push(item);
              });

              return Object.entries(groupedByOrder).map(([orderId, items]) => {
                const isAutoConsolidated = items.length > 1;
                const firstItem = items[0];

                return (
                <div key={orderId} className={`bg-white rounded-xl shadow-sm border-2 ${isAutoConsolidated ? 'border-green-300' : 'border-gray-200'} p-6`}>
                  {isAutoConsolidated && (
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                          📦 Auto-Consolidated ({items.length} variants)
                        </span>
                        <span className="text-xs text-gray-500">
                          Same item with different options
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Are you sure you want to separate these ${items.length} items? Each will get its own Order ID.`)) {
                            return;
                          }

                          try {
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch('/api/admin/orders/deconsolidate-items', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ orderId })
                            });

                            const data = await response.json();

                            if (!response.ok) {
                              alert(`Error: ${data.error || 'Failed to deconsolidate items'}`);
                              return;
                            }

                            alert(`✅ Items separated successfully! Created ${data.newOrders.length} new orders.`);
                            fetchWarehouseItems();
                          } catch (error) {
                            console.error('Error deconsolidating items:', error);
                            alert('Error deconsolidating items');
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 font-medium"
                      >
                        🔓 Separate Items
                      </button>
                    </div>
                  )}

                  {items.map((item, idx) => (
                    <div key={item.id} className={`${idx > 0 ? 'mt-4 pt-4 border-t-2 border-gray-200' : ''}`}>
                      <div className="flex items-start gap-4">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-24 h-24 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                              {idx === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Customer: {item.order.user.email}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">¥{(item.price * item.quantity).toLocaleString()}</p>
                              {idx === 0 && (
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mt-1">
                                  In Warehouse
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded">
                              {item.marketplace === 'yahoo' ? '💜 Yahoo' : '🛍️ Rakuten'}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{item.itemCode.slice(0, 12)}</span>
                            <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                            {item.order.preferredShippingCarrier && (
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                item.order.preferredShippingCarrier === 'ems'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                📮 Preferred: {item.order.preferredShippingCarrier.toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Варианты товара */}
                          {item.options && Object.keys(item.options).length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.options).map(([key, value]) => (
                                  <span key={key} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    {key}: {value as string}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Кнопка перехода на маркетплейс */}
                          {item.itemUrl && (
                            <a
                              href={item.itemUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 inline-flex items-center gap-1 font-medium shadow-sm hover:shadow-md transition-all mb-3"
                            >
                              {item.marketplace === 'yahoo' ? '💜 Open on Yahoo' : '🛍️ Open on Rakuten'}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}

                          {!isAutoConsolidated && (
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                // Автоматически устанавливаем правильный метод доставки
                                // Приоритет: выбор пользователя > рекомендация на основе страны > EMS по умолчанию
                                let shippingMethod = 'ems';
                                if (item.order.preferredShippingCarrier === 'fedex') {
                                  shippingMethod = 'fedex';
                                } else if (item.order.preferredShippingCarrier === 'ems') {
                                  shippingMethod = 'ems';
                                } else {
                                  shippingMethod = item.recommendedShippingMethod || 'ems';
                                }

                                setPackageData({
                                  ...packageData,
                                  shippingMethod: shippingMethod,
                                  shippingCost: ""
                                });
                                setShowPackageModal(true);
                              }}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all"
                            >
                              📦 Create Package
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Shipping Country & Method - показываем один раз для всей группы */}
                  <div className={`mt-4 mb-3 p-3 border-2 rounded-lg ${
                    firstItem.isUSA
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        firstItem.isUSA ? 'text-amber-600' : 'text-green-600'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900 mb-1">
                          Shipping Destination: {firstItem.shippingCountry || 'Unknown'}
                        </p>
                        <p className={`text-xs font-semibold ${
                          firstItem.isUSA ? 'text-amber-700' : 'text-green-700'
                        }`}>
                          {firstItem.isUSA ? '✈️ Use FedEx' : '📦 Use EMS'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Domestic Shipping Cost - Edit field */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">
                          {isAutoConsolidated ? `Shipping to warehouse (combined for ${items.length} items):` : 'Shipping to warehouse:'}
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">¥</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={domesticShippingCosts[orderId] ?? firstItem.domesticShippingCost ?? 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setDomesticShippingCosts(prev => ({
                                ...prev,
                                [orderId]: value
                              }));
                            }}
                            onBlur={async () => {
                              const cost = domesticShippingCosts[orderId] ?? firstItem.domesticShippingCost ?? 0;
                              // Применяем к всем товарам в группе
                              await handleUpdateDomesticShippingCost(items.map(item => item.id), cost);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(firstItem.domesticShippingCost ?? 0) > 0 ? (
                          <span className="text-sm font-semibold text-blue-600">
                            Установлено в Orders
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Не указано
                          </span>
                        )}
                        {isAutoConsolidated && (
                          <span className="text-xs text-green-600">
                            • применится ко всем вариантам
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAutoConsolidated && (
                    <button
                      onClick={() => {
                        setSelectedItem(firstItem);
                        // Автоматически устанавливаем правильный метод доставки
                        // Приоритет: выбор пользователя > рекомендация на основе страны > EMS по умолчанию
                        let shippingMethod = 'ems';
                        if (firstItem.order.preferredShippingCarrier === 'fedex') {
                          shippingMethod = 'fedex';
                        } else if (firstItem.order.preferredShippingCarrier === 'ems') {
                          shippingMethod = 'ems';
                        } else {
                          shippingMethod = firstItem.recommendedShippingMethod || 'ems';
                        }

                        setPackageData({
                          ...packageData,
                          shippingMethod: shippingMethod,
                          shippingCost: ""
                        });
                        setShowPackageModal(true);
                      }}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all"
                    >
                      📦 Create Package (Auto-Consolidates all variants)
                    </button>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Order ID: #{firstItem.order.orderNumber ? String(firstItem.order.orderNumber).padStart(6, '0') : firstItem.order.id.slice(0, 8)} • Arrived: {new Date(firstItem.createdAt).toLocaleDateString()}
                      {isAutoConsolidated && <span className="ml-2 text-green-600 font-medium">• {items.length} items will be auto-consolidated</span>}
                    </p>
                  </div>
                </div>
                );
              });
            })()}
          </div>
        )}

        {/* Consolidation Requests Tab */}
        {activeTab === 'consolidation' && (
          <div className="space-y-6">
            {consolidationPackages.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No consolidation requests at the moment</p>
              </div>
            ) : (
              consolidationPackages.map((pkg) => {
                const consolidateWithIds = pkg.consolidateWith ? JSON.parse(pkg.consolidateWith) : [];
                return (
                  <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">Requested on {new Date(pkg.updatedAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">Package ID: {pkg.id}</p>
                        {pkg.futureConsolidatedId && (
                          <div className="mt-2 inline-block px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-lg">
                            <p className="text-xs font-semibold text-purple-700">New ID: <span className="font-mono">{pkg.futureConsolidatedId}</span></p>
                          </div>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        📦 Consolidation Request
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Main Package:</h4>
                      <div className="flex items-center gap-3">
                        {pkg.orderItem.image && (
                          <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-16 h-16 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pkg.orderItem.title}</p>
                          <p className="text-xs text-gray-500">Qty: {pkg.orderItem.quantity}</p>
                          <p className="text-xs font-mono">
                            Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</span>
                          </p>
                          <p className="text-xs text-purple-600 font-mono font-bold">Package ID: {pkg.id}</p>
                          {pkg.trackingNumber && (
                            <p className="text-xs text-gray-600 font-mono mt-1">Tracking: {pkg.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {consolidateWithIds.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Combine with these packages:</h4>
                        <div className="space-y-2">
                          {pkg.consolidateWithPackages?.map((relatedPkg: any) => (
                            <div key={relatedPkg.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-200">
                              {relatedPkg.orderItem.image && (
                                <img src={relatedPkg.orderItem.image} alt={relatedPkg.orderItem.title} className="w-12 h-12 rounded object-cover" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{relatedPkg.orderItem.title}</p>
                                <p className="text-xs text-gray-500">Qty: {relatedPkg.orderItem.quantity}</p>
                                <p className="text-xs font-mono">
                                  Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{relatedPkg.orderItem.order?.orderNumber ? String(relatedPkg.orderItem.order.orderNumber).padStart(6, '0') : relatedPkg.orderItem.orderId.slice(0, 8)}</span>
                                </p>
                                <p className="text-xs text-purple-600 font-mono font-bold">Package ID: {relatedPkg.id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3 text-xs">
                      {pkg.shippingMethod && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">📮 {pkg.shippingMethod.toUpperCase()}</span>
                      )}
                      {pkg.photoService && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">📸 Photo Service (+¥400)</span>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                      <button
                        onClick={() => {
                          console.log('Selected package for consolidation:', pkg);
                          console.log('consolidateWith:', pkg.consolidateWith);
                          console.log('consolidateWithPackages:', pkg.consolidateWithPackages);
                          setSelectedConsolidationPackage(pkg);
                          // Вычисляем начальную стоимость доставки (сумма всех пакетов включая domestic shipping)
                          const consolidateWithIds = pkg.consolidateWith ? JSON.parse(pkg.consolidateWith) : [];
                          const totalCost = (pkg.shippingCost + (pkg.domesticShippingCost || 0)) +
                            (pkg.consolidateWithPackages?.reduce((sum: number, p: any) => sum + (p.shippingCost || 0) + (p.domesticShippingCost || 0), 0) || 0);
                          setConsolidationShippingCost(totalCost.toString());
                          setShowConsolidationModal(true);
                        }}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all"
                      >
                        ✓ Mark as Completed
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Cancel this consolidation request?')) return;

                          // Устанавливаем timestamp ДО запроса
                          lastUpdateTimeRef.current.consolidation = Date.now();

                          try {
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch(`/api/admin/packages/${pkg.id}/cancel-consolidation`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });

                            if (response.ok) {
                              // Уведомляем другие вкладки об обновлении
                              broadcastUpdate('admin-data');
                              // Показываем alert после обновления UI
                              setTimeout(() => {
                                alert('Consolidation request cancelled');
                              }, 0);
                            } else {
                              const error = await response.json();
                              alert('Error: ' + error.error);
                            }
                          } catch (error) {
                            console.error('Error cancelling consolidation:', error);
                            alert('Failed to cancel consolidation');
                          }
                        }}
                        className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Product Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            {photoRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No photo requests at the moment</p>
              </div>
            ) : (
              photoRequests.map((pkg) => (
                <PhotoRequestCard
                  key={pkg.id}
                  pkg={pkg}
                  lastUpdateTimeRef={lastUpdateTimeRef}
                  onPhotoUploaded={(updatedPackage: any) => {
                    // Удаляем из photo requests
                    setPhotoRequests(prev => prev.filter(p => p.id !== pkg.id));
                    // Обновляем в warehouse items
                    if (updatedPackage) {
                      setWarehouseItems(prev => prev.map(item =>
                        item.id === pkg.id ? updatedPackage : item
                      ));
                      // Также обновляем в reinforcement requests если этот товар там есть
                      setReinforcementRequests(prev => prev.map(item =>
                        item.id === pkg.id ? updatedPackage : item
                      ));
                    }
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Package Reinforcement Tab */}
        {activeTab === 'reinforcement' && (
          <div className="space-y-6">
            {reinforcementRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No reinforcement requests at the moment</p>
              </div>
            ) : (
              reinforcementRequests.map((pkg) => (
                <ReinforcementRequestCard
                  key={pkg.id}
                  pkg={pkg}
                  lastUpdateTimeRef={lastUpdateTimeRef}
                  onCompleted={(updatedPackage: any) => {
                    // Удаляем из reinforcement requests
                    setReinforcementRequests(prev => prev.filter(p => p.id !== pkg.id));
                    // Обновляем в warehouse items
                    if (updatedPackage) {
                      setWarehouseItems(prev => prev.map(item =>
                        item.id === pkg.id ? updatedPackage : item
                      ));
                    }
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Disposal Requests Tab */}
        {activeTab === 'disposal' && (
          <div className="space-y-4">
            {disposalRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No disposal requests at the moment</p>
              </div>
            ) : (
              disposalRequests.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
                      <p className="text-sm font-mono">
                        Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</span>
                      </p>
                      <p className="text-sm text-gray-500">Requested disposal</p>
                    </div>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      ♻️ Pending Disposal
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex gap-4">
                      {pkg.orderItem.image && (
                        <img
                          src={pkg.orderItem.image}
                          alt={pkg.orderItem.title}
                          className="w-20 h-20 object-cover rounded border border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{pkg.orderItem.title}</h4>
                        <p className="text-sm text-gray-600">Quantity: {pkg.orderItem.quantity}</p>
                        <p className="text-sm text-gray-600">Weight: {pkg.weight} kg</p>
                        <p className="text-sm font-medium text-orange-600 mt-2">
                          Disposal Cost: ¥{pkg.disposalCost} (paid by user)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Tracking Number</p>
                      <p className="font-medium text-gray-900">{pkg.trackingNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Package ID</p>
                      <p className="font-medium text-gray-900">{pkg.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={async () => {
                        if (!confirm('Mark this package as disposed? This action cannot be undone.')) {
                          return;
                        }

                        // Устанавливаем timestamp ДО запроса
                        lastUpdateTimeRef.current.disposal = Date.now();

                        try {
                          const token = localStorage.getItem('auth_token');
                          const response = await fetch(`/api/admin/packages/${pkg.id}/mark-disposed`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          if (response.ok) {
                            // Обновляем state МГНОВЕННО - удаляем пакет из списка
                            setDisposalRequests(prev => prev.filter(p => p.id !== pkg.id));

                            // Уведомляем другие вкладки об обновлении
                            console.log('[ADMIN] 📡 Broadcasting disposal complete...');
                            broadcastUpdate('admin-data');
                            broadcastUpdate('packages'); // Также отправляем broadcast для профиля

                            // Показываем alert после обновления UI
                            setTimeout(() => {
                              alert('✅ Package marked as disposed!');
                            }, 0);
                          } else {
                            const data = await response.json();
                            alert(`Error: ${data.error}`);
                          }
                        } catch (error) {
                          console.error('Error marking as disposed:', error);
                          alert('Failed to mark as disposed');
                        }
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      ✓ Mark as Disposed
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter the reason for declining this disposal request:');
                        if (!reason || reason.trim().length === 0) {
                          return;
                        }

                        // Устанавливаем timestamp ДО запроса
                        lastUpdateTimeRef.current.disposal = Date.now();

                        (async () => {
                          try {
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch(`/api/admin/packages/${pkg.id}/decline-disposal`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ reason: reason.trim() })
                            });
                            if (response.ok) {
                              // Обновляем state МГНОВЕННО - удаляем пакет из списка
                              setDisposalRequests(prev => prev.filter(p => p.id !== pkg.id));

                              // Уведомляем другие вкладки об обновлении
                              console.log('[ADMIN] 📡 Broadcasting disposal declined...');
                              broadcastUpdate('admin-data');
                              broadcastUpdate('packages'); // Также отправляем broadcast для профиля

                              // Показываем alert после обновления UI
                              setTimeout(() => {
                                alert('✅ Disposal request declined! User has been notified and refunded.');
                              }, 0);
                            } else {
                              const data = await response.json();
                              alert(`Error: ${data.error}`);
                            }
                          } catch (error) {
                            console.error('Error declining disposal:', error);
                            alert('Failed to decline disposal');
                          }
                        })();
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      ✗ Decline Request
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Cancel Purchase Requests Tab */}
        {activeTab === 'cancelPurchase' && (
          <div className="space-y-4">
            {cancelPurchaseRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No cancel purchase requests at the moment</p>
              </div>
            ) : (
              cancelPurchaseRequests.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-500">Requested cancellation</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">Package ID: {pkg.id}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      ❌ Cancel Request
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex gap-4">
                      {pkg.orderItem.image && (
                        <img
                          src={pkg.orderItem.image}
                          alt={pkg.orderItem.title}
                          className="w-20 h-20 object-cover rounded border border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{pkg.orderItem.title}</h4>
                        <p className="text-sm text-gray-600">Quantity: {pkg.orderItem.quantity}</p>
                        <p className="text-xs text-blue-600 font-mono">Order #{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Marketplace:</span> {pkg.orderItem.marketplace?.toUpperCase()}
                        </p>
                        {pkg.orderItem.itemUrl && (
                          <a
                            href={pkg.orderItem.itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View Product →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Tracking Number</p>
                      <p className="font-medium text-gray-900">{pkg.trackingNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-gray-900 capitalize">{pkg.cancelPurchaseStatus || 'pending'}</p>
                    </div>
                  </div>

                  {pkg.cancelPurchaseStatus === 'pending' && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-amber-700">
                          ⚠️ Contact the seller to confirm cancellation. If seller approves, click "Request Payment" button below.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            if (!confirm('Seller approved cancellation? This will request ¥900 payment from user.')) {
                              return;
                            }
                            try {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch(`/api/admin/packages/${pkg.id}/request-cancel-payment`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              if (response.ok) {
                                // Обновляем state МГНОВЕННО - обновляем статус в списке
                                setCancelPurchaseRequests(prev =>
                                  prev.map(p => p.id === pkg.id ? { ...p, cancelPurchaseStatus: 'awaiting_payment' } : p)
                                );

                                // Уведомляем другие вкладки об обновлении
                                console.log('[ADMIN] 📡 Broadcasting cancel purchase payment request...');
                                broadcastUpdate('admin-data');
                                broadcastUpdate('packages');

                                // Показываем alert после обновления UI
                                setTimeout(() => {
                                  alert('✅ Payment request sent! User will be charged ¥900.');
                                }, 0);
                              } else {
                                const data = await response.json();
                                alert(`Error: ${data.error}`);
                              }
                            } catch (error) {
                              console.error('Error requesting payment:', error);
                              alert('Failed to request payment');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                        >
                          💳 Request Payment (¥900)
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Reject this cancellation request?')) {
                              return;
                            }

                            // Устанавливаем timestamp ДО запроса
                            lastUpdateTimeRef.current.cancelPurchase = Date.now();

                            try {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch(`/api/admin/packages/${pkg.id}/update-cancel-purchase`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ status: 'rejected' })
                              });
                              if (response.ok) {
                                // Обновляем state МГНОВЕННО - удаляем из списка (rejected = не показываем)
                                setCancelPurchaseRequests(prev => prev.filter(p => p.id !== pkg.id));

                                // Уведомляем другие вкладки об обновлении
                                console.log('[ADMIN] 📡 Broadcasting cancel purchase rejected...');
                                broadcastUpdate('admin-data');
                                broadcastUpdate('packages');

                                // Показываем alert после обновления UI
                                setTimeout(() => {
                                  alert('❌ Cancellation rejected! User has been notified.');
                                }, 0);
                              } else {
                                const data = await response.json();
                                alert(`Error: ${data.error}`);
                              }
                            } catch (error) {
                              console.error('Error updating status:', error);
                              alert('Failed to update status');
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-all"
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    </>
                  )}

                  {pkg.cancelPurchaseStatus === 'awaiting_payment' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-700 font-medium">
                        ⏳ Waiting for user to pay ¥900 cancellation fee...
                      </p>
                    </div>
                  )}

                  {pkg.cancelPurchaseStatus === 'paid' && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-xs text-green-700">
                          ✅ User has paid ¥900. Complete the cancellation process with seller and update status below.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCancelPackage(pkg);
                          setRefundAmount("");
                          setShowRefundModal(true);
                        }}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all"
                      >
                        ✅ Complete Cancellation
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <AdminMessagesSection
            messages={messages}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            onRefresh={fetchMessages}
          />
        )}

        {/* Shipping Requests Tab */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            {shippingRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No shipping requests at the moment</p>
              </div>
            ) : (
              shippingRequests.map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
                      {pkg.consolidated ? (
                        <p className="text-sm font-mono">
                          Package ID <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded shadow">{pkg.id}</span>
                        </p>
                      ) : (
                        <p className="text-sm font-mono">
                          Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Requested shipping</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      📮 Ready to Ship
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    {pkg.consolidated ? (
                      // Для консолидированных пакетов показываем все товары
                      <div>
                        <h4 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Consolidated Package ({(pkg.consolidatedPackages?.length || 0) + 1} items)
                        </h4>
                        <div className="space-y-2">
                          {/* Главный товар */}
                          <div className="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                            {pkg.orderItem.image && (
                              <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-900">{pkg.orderItem.title}</p>
                              <p className="text-xs text-gray-500">Qty: {pkg.orderItem.quantity}</p>
                            </div>
                          </div>
                          {/* Объединенные товары */}
                          {pkg.consolidatedPackages && pkg.consolidatedPackages.length > 0 && (
                            <>
                              {pkg.consolidatedPackages.map((consolidatedPkg: any) => (
                                <div key={consolidatedPkg.id} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                                  {consolidatedPkg.orderItem.image && (
                                    <img src={consolidatedPkg.orderItem.image} alt={consolidatedPkg.orderItem.title} className="w-12 h-12 rounded object-cover" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-900">{consolidatedPkg.orderItem.title}</p>
                                    <p className="text-xs text-gray-500">Qty: {consolidatedPkg.orderItem.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                        {/* Информация о посылке */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {pkg.trackingNumber && (
                            <p className="text-xs text-gray-600 font-mono">Tracking: {pkg.trackingNumber}</p>
                          )}
                          {pkg.weight && (
                            <p className="text-xs text-gray-600 mt-1">Total Weight: {pkg.weight} kg</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Для обычных пакетов показываем как раньше
                      <div className="flex items-center gap-3">
                        {pkg.orderItem.image && (
                          <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-20 h-20 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{pkg.orderItem.title}</p>
                          <p className="text-xs text-gray-500">Qty: {pkg.orderItem.quantity}</p>
                          {pkg.trackingNumber && (
                            <p className="text-xs text-gray-600 font-mono mt-1">Tracking: {pkg.trackingNumber}</p>
                          )}
                          {pkg.weight && (
                            <p className="text-xs text-gray-600 mt-1">Weight: {pkg.weight} kg</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 text-xs mb-4">
                    {pkg.shippingMethod && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">📮 {pkg.shippingMethod.toUpperCase()}</span>
                    )}
                    {pkg.photoService && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">📸 Photo Service</span>
                    )}
                    {pkg.additionalInsurance > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                        🛡️ Insured: ¥{(20000 + pkg.additionalInsurance).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Shipping Address */}
                  {pkg.shippingAddress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Shipping Address
                      </h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p className="font-medium">{pkg.shippingAddress.name}</p>
                        <p>{pkg.shippingAddress.address}</p>
                        {pkg.shippingAddress.apartment && <p>{pkg.shippingAddress.apartment}</p>}
                        <p>{pkg.shippingAddress.city}, {pkg.shippingAddress.state} {pkg.shippingAddress.postalCode}</p>
                        <p className="font-medium">{pkg.shippingAddress.country}</p>
                        {pkg.shippingAddress.phoneNumber && <p>📞 {pkg.shippingAddress.phoneNumber}</p>}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedShippingPackage(pkg);
                      setShowTrackingModal(true);
                    }}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    ✓ Mark as Shipped & Add Tracking
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Compensation Requests Tab */}
        {activeTab === 'compensation' && (
          <div className="space-y-4">
            {compensationRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No compensation requests at the moment</p>
              </div>
            ) : (
              compensationRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{request.user?.email || 'Unknown User'}</h3>
                      {request.user?.name && <p className="text-sm text-gray-600">{request.user.name}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {/* Package Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Package Information
                    </h4>
                    {request.package && (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Tracking:</span>
                          <span className="font-mono text-gray-900">{request.package.trackingNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className="text-gray-900">{request.package.status}</span>
                        </div>
                        {/* Show selected packages if consolidated, otherwise show main package */}
                        {request.selectedPackages && request.selectedPackages.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            <div className="font-medium text-gray-700">Damaged Items:</div>
                            {request.selectedPackages.map((pkg: any, idx: number) => (
                              <div key={pkg.id} className="pl-4 border-l-2 border-orange-300 bg-orange-50 p-3 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-700">Item {idx + 1}:</span>
                                  <span className="text-gray-900">{pkg.orderItem?.title || 'N/A'}</span>
                                </div>
                                {pkg.orderItem?.order?.orderNumber && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Order:</span>
                                    <span className="font-mono text-gray-900">#{String(pkg.orderItem.order.orderNumber).padStart(6, '0')}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          request.package.orderItem && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">Item:</span>
                                <span className="text-gray-900">{request.package.orderItem.title}</span>
                              </div>
                              {request.package.orderItem.order?.orderNumber && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">Order:</span>
                                  <span className="font-mono text-gray-900">#{String(request.package.orderItem.order.orderNumber).padStart(6, '0')}</span>
                                </div>
                              )}
                            </>
                          )
                        )}
                        {request.package.invoice && (
                          <div className="flex items-center gap-2 mt-2">
                            <a
                              href={request.package.invoice}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Invoice
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{request.description}</p>
                  </div>

                  {/* Damage Certificate */}
                  {request.damageCertificate && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Official Damage Certificate</h4>
                      <a
                        href={request.damageCertificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Certificate
                      </a>
                    </div>
                  )}

                  {/* Photos/Videos */}
                  {(() => {
                    try {
                      const files = request.files ? JSON.parse(request.files) : [];
                      return files.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Photos & Videos ({files.length})</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {files.map((file: string, index: number) => (
                          <a
                            key={index}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors group"
                          >
                            {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img
                                src={file}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                            ))}
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error parsing files:', error);
                      return null;
                    }
                  })()}

                  {/* Admin Notes */}
                  {request.adminNotes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">{request.adminNotes}</p>
                    </div>
                  )}

                  {/* Refund Information */}
                  {request.refundMethod && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Refund Information</h4>
                      <div className={`rounded-lg p-4 border-2 ${
                        request.refundMethod === 'balance' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {request.refundMethod === 'balance' ? '💰 Site Balance' :
                               request.refundMethod === 'stripe' ? '💳 Stripe (Card)' :
                               request.refundMethod === 'paypal' ? '🔵 PayPal' : '🏦 Bank Transfer'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              request.refundProcessed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {request.refundProcessed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                          {request.package?.orderItem?.price && (
                            <span className="text-sm font-bold text-gray-900">
                              ¥{request.package.orderItem.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Stripe/PayPal Details */}
                        {(request.refundMethod === 'stripe' || request.refundMethod === 'paypal') && (
                          <div className="space-y-2 text-sm">
                            {request.refundEmail && (
                              <div>
                                <span className="font-medium text-gray-700">Payment Email:</span>
                                <p className="text-gray-900 font-mono text-xs">{request.refundEmail}</p>
                              </div>
                            )}
                            {request.refundCardLast4 && (
                              <div>
                                <span className="font-medium text-gray-700">Card Last 4 Digits:</span>
                                <p className="text-gray-900 font-mono">****{request.refundCardLast4}</p>
                              </div>
                            )}

                            {/* Mark as Completed Button */}
                            {!request.refundProcessed && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Mark this ${request.refundMethod} refund as completed?`)) return;

                                  try {
                                    const token = localStorage.getItem('auth_token');
                                    const response = await fetch('/api/admin/compensation-requests', {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        requestId: request.id,
                                        refundProcessed: true,
                                      }),
                                    });

                                    if (response.ok) {
                                      alert('Refund marked as completed');
                                      fetchCompensationRequests();
                                    } else {
                                      alert('Failed to update');
                                    }
                                  } catch (error) {
                                    console.error('Error:', error);
                                    alert('Error updating');
                                  }
                                }}
                                className="mt-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                ✓ Mark as Completed
                              </button>
                            )}
                          </div>
                        )}

                        {/* Balance Refund Info */}
                        {request.refundMethod === 'balance' && (
                          <p className="text-xs text-green-700">
                            {request.refundProcessed ? '✓ Money has been automatically added to user balance' : 'Processing...'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Update Form */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Request</h4>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const status = formData.get('status') as string;
                        const adminNotes = formData.get('adminNotes') as string;

                        try {
                          const token = localStorage.getItem('auth_token');
                          const response = await fetch('/api/admin/compensation-requests', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              requestId: request.id,
                              status,
                              adminNotes,
                            }),
                          });

                          if (response.ok) {
                            alert('Request updated successfully');
                            fetchCompensationRequests();
                          } else {
                            alert('Failed to update request');
                          }
                        } catch (error) {
                          console.error('Error updating request:', error);
                          alert('Error updating request');
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            defaultValue={request.status}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes</label>
                          <input
                            type="text"
                            name="adminNotes"
                            id={`adminNotes-${request.id}`}
                            defaultValue={request.adminNotes || ''}
                            placeholder="Add notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`adminNotes-${request.id}`) as HTMLInputElement;
                                if (input) input.value = 'Claim is attempting to be created';
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium transition-colors border border-blue-200"
                            >
                              📝 Attempting to Create
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`adminNotes-${request.id}`) as HTMLInputElement;
                                if (input) input.value = 'Claim is successfully created and the proceedings are beginning';
                              }}
                              className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium transition-colors border border-green-200"
                            >
                              ✅ Successfully Created
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`adminNotes-${request.id}`) as HTMLInputElement;
                                if (input) input.value = 'Claim creation is rejected (reason)';
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-xs font-medium transition-colors border border-red-200"
                            >
                              ❌ Rejected
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        Update Request
                      </button>
                    </form>

                    {/* Approve for Refund Button */}
                    {request.status === 'Approved' && !request.approvedForRefund && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            if (!confirm('Allow customer to request refund?')) return;

                            try {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch('/api/admin/compensation-requests', {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  requestId: request.id,
                                  approvedForRefund: true,
                                }),
                              });

                              if (response.ok) {
                                alert('Customer can now request refund');
                                fetchCompensationRequests();
                              } else {
                                alert('Failed to approve for refund');
                              }
                            } catch (error) {
                              console.error('Error approving for refund:', error);
                              alert('Error approving for refund');
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all text-sm"
                        >
                          ✅ Approve for Refund
                        </button>
                      </div>
                    )}

                    {/* Show if already approved for refund */}
                    {request.approvedForRefund && (
                      <div className="mt-3 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm text-center font-medium">
                        ✓ Approved for refund - Customer can request refund
                      </div>
                    )}

                    {/* Process Item Replacement Button */}
                    {request.compensationType === 'replace' && request.status === 'Approved' && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            if (!confirm('Process item replacement? This will:\n1. Create new order with the same items\n2. Remove package from client\'s packages\n3. Close this compensation request')) return;

                            try {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch('/api/admin/process-item-replacement', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  requestId: request.id,
                                }),
                              });

                              if (response.ok) {
                                const data = await response.json();
                                alert(`Item replacement processed successfully!\nNew order created for reordering.`);
                                fetchCompensationRequests();
                              } else {
                                const error = await response.json();
                                alert(`Failed to process item replacement: ${error.error || 'Unknown error'}`);
                              }
                            } catch (error) {
                              console.error('Error processing item replacement:', error);
                              alert('Error processing item replacement');
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium shadow-sm hover:shadow-md transition-all text-sm"
                        >
                          🔄 Process Item Replacement
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          This will create a new order and remove the package from client
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Damaged Items Tab */}
        {activeTab === 'damaged' && (
          <div className="space-y-4">
            {damagedItemRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No damaged item reports at the moment</p>
              </div>
            ) : (
              damagedItemRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{request.user?.email || 'Unknown User'}</h3>
                      {request.user?.name && <p className="text-sm text-gray-600">{request.user.name} {request.user.secondName || ''}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Package Info */}
                  <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
                    <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Package Information
                    </h4>
                    {request.package && (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Tracking:</span>
                          <span className="font-mono text-gray-900">{request.package.trackingNumber || 'N/A'}</span>
                        </div>
                        {request.package.orderItem && (
                          <>
                            {request.package.orderItem.order?.orderNumber && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">Order ID:</span>
                                <span className="font-mono text-gray-900 bg-white px-2 py-1 rounded border border-red-300">
                                  #{String(request.package.orderItem.order.orderNumber).padStart(6, '0')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Item:</span>
                              <span className="text-gray-900">{request.package.orderItem.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">Price:</span>
                              <span className="font-mono text-gray-900">¥{request.package.orderItem.price?.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Damage Description */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Damage Description</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">{request.description}</p>
                  </div>

                  {/* Photos */}
                  {(() => {
                    try {
                      const photos = request.photos ? JSON.parse(request.photos) : [];
                      return photos.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Photos ({photos.length})</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {photos.map((photo: string, index: number) => (
                              <a
                                key={index}
                                href={photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-500 transition-colors group"
                              >
                                <img
                                  src={photo}
                                  alt={`Damage ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    } catch (error) {
                      console.error('Error parsing photos:', error);
                      return null;
                    }
                  })()}

                  {/* Refund Information */}
                  {request.refundRequested && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Refund Information
                      </h4>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            request.refundProcessed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {request.refundProcessed ? 'Processed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Method:</span>
                          <span className="text-gray-900">
                            {request.refundMethod === 'balance' ? 'Account Balance' :
                             request.refundMethod === 'stripe' ? 'Stripe (Card)' : 'PayPal'}
                          </span>
                        </div>
                        {request.refundEmail && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-900 font-mono text-xs">{request.refundEmail}</span>
                          </div>
                        )}
                        {request.refundCardLast4 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">Card Last 4:</span>
                            <span className="text-gray-900 font-mono">****{request.refundCardLast4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {request.adminNotes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">{request.adminNotes}</p>
                    </div>
                  )}

                  {/* Update Form */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Request</h4>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        const status = formData.get('status') as string;
                        const adminNotes = formData.get('adminNotes') as string;
                        const refundProcessed = formData.get('refundProcessed') === 'true';

                        try {
                          const token = localStorage.getItem('auth_token');
                          const response = await fetch('/api/admin/damaged-item-requests', {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              requestId: request.id,
                              status,
                              adminNotes,
                              refundProcessed: request.refundRequested ? refundProcessed : undefined,
                            }),
                          });

                          if (response.ok) {
                            alert('Request updated successfully');
                            fetchDamagedItemRequests();
                          } else {
                            alert('Failed to update request');
                          }
                        } catch (error) {
                          console.error('Error updating request:', error);
                          alert('Error updating request');
                        }
                      }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                          <select
                            name="status"
                            defaultValue={request.status}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes</label>
                          <input
                            type="text"
                            name="adminNotes"
                            defaultValue={request.adminNotes || ''}
                            placeholder="Add notes..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                          />
                        </div>
                      </div>

                      {/* Refund Status - only show if refund was requested */}
                      {request.refundRequested && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Refund Status</label>
                          <select
                            name="refundProcessed"
                            defaultValue={request.refundProcessed ? 'true' : 'false'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                          >
                            <option value="false">Pending</option>
                            <option value="true">Processed</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium shadow-sm hover:shadow-md transition-all text-sm"
                      >
                        Update Request
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Package Modal */}
      {showPackageModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full my-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Package</h2>
                <p className="text-gray-600 text-sm">Item: {selectedItem.title}</p>
                <p className="text-gray-500 text-xs">Qty: {selectedItem.quantity}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer Country Info */}
            <div className="mb-6 p-3 border-2 rounded-lg bg-blue-50 border-blue-300">
              <p className="text-sm font-semibold text-gray-900">
                📍 Destination: <span className="font-bold">
                  {selectedItem.shippingCity || 'Unknown'}
                  {selectedItem.shippingPostalCode && ` ${selectedItem.shippingPostalCode}`}
                  , {selectedItem.shippingCountry || 'Unknown'}
                </span>
              </p>
              <p className="text-xs mt-1 text-blue-700">
                Shipping method: {packageData.shippingMethod === 'fedex' ? 'FedEx International' : 'Japan Post EMS'}
              </p>
            </div>

            <form onSubmit={handleCreatePackage}>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number (optional)
                    </label>
                    <input
                      type="text"
                      value={packageData.trackingNumber}
                      onChange={(e) => setPackageData({ ...packageData, trackingNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="TRK123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step={packageData.weightUnit === 'kg' ? '0.01' : '1'}
                        value={packageData.weight}
                        onChange={(e) => setPackageData({ ...packageData, weight: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder={packageData.weightUnit === 'kg' ? '2.5' : '2500'}
                        required
                      />
                      <select
                        value={packageData.weightUnit}
                        onChange={(e) => setPackageData({ ...packageData, weightUnit: e.target.value as 'kg' | 'g' })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                      </select>
                    </div>
                    <p className="text-xs text-red-500 mt-1">Required to create package</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Method
                    </label>
                    <select
                      value={packageData.shippingMethod}
                      onChange={(e) => setPackageData({ ...packageData, shippingMethod: e.target.value as 'ems' | 'fedex' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="ems">Japan Post EMS</option>
                      <option value="fedex">FedEx International</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedItem?.order?.preferredShippingCarrier && (
                        <span className="text-blue-600">
                          💡 Customer preferred: {selectedItem.order.preferredShippingCarrier.toUpperCase()}
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    {selectedItem?.domesticShippingCost > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Shipping to warehouse:</span>
                          <span className="ml-2 text-blue-600 font-semibold">¥{selectedItem.domesticShippingCost.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">This amount is already included and will be added automatically</p>
                      </div>
                    )}

                    {packageData.shippingMethod === 'ems' && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          International Shipping Cost (¥, optional)
                        </label>
                        <input
                          type="number"
                          value={packageData.shippingCost}
                          onChange={(e) => setPackageData({ ...packageData, shippingCost: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          placeholder="5000"
                        />
                        <a
                          href="https://www.post.japanpost.jp/cgi-charge/index.php?lang=_en"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Calculate shipping cost (Japan Post)
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={packageData.notes}
                      onChange={(e) => setPackageData({ ...packageData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                {/* Right Column - Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📦 Package Photo (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPackageData({ ...packageData, packagePhoto: file });
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100
                        cursor-pointer border border-gray-300 rounded-lg"
                    />
                    {packageData.packagePhoto ? (
                      <div className="mt-3 relative">
                        <img
                          src={URL.createObjectURL(packageData.packagePhoto)}
                          alt="Package preview"
                          className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setPackageData({ ...packageData, packagePhoto: null })}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">No photo selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Upload a photo of the package exterior</p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!packageData.weight || parseFloat(packageData.weight) <= 0}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm hover:shadow-md transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 disabled:shadow-none"
                >
                  Create & Notify User
                </button>
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consolidation Modal */}
      {showConsolidationModal && selectedConsolidationPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Consolidation</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Customer:</p>
              <p className="font-medium text-gray-900">{selectedConsolidationPackage.user.email}</p>
              {selectedConsolidationPackage.shippingAddress && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Shipping Destination:</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedConsolidationPackage.shippingAddress.country}
                    {selectedConsolidationPackage.shippingAddress.postalCode &&
                      ` - ${selectedConsolidationPackage.shippingAddress.postalCode}`}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {(selectedConsolidationPackage.consolidateWith ? JSON.parse(selectedConsolidationPackage.consolidateWith).length : 0) + 1} packages will be combined
              </p>
              {selectedConsolidationPackage.futureConsolidatedId && (
                <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <p className="text-xs font-semibold text-purple-700 mb-1">📦 New Consolidated Package ID:</p>
                  <p className="text-sm font-mono font-bold text-purple-900">{selectedConsolidationPackage.futureConsolidatedId}</p>
                  <p className="text-xs text-purple-600 mt-1">Use this ID for the package label</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step={consolidationWeightUnit === 'kg' ? '0.01' : '1'}
                  value={consolidationWeight}
                  onChange={(e) => setConsolidationWeight(e.target.value)}
                  placeholder={consolidationWeightUnit === 'kg' ? 'e.g., 2.5' : 'e.g., 2500'}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
                <select
                  value={consolidationWeightUnit}
                  onChange={(e) => setConsolidationWeightUnit(e.target.value as 'kg' | 'g')}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-white outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the total weight of the consolidated package
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Shipping Cost (¥)
              </label>
              <input
                type="number"
                value={consolidationShippingCost}
                onChange={(e) => setConsolidationShippingCost(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the total shipping cost for the consolidated package
              </p>
              <a
                href={selectedConsolidationPackage.shippingMethod === 'fedex'
                  ? 'https://www.fedex.com/en-us/online/rating.html'
                  : 'https://www.post.japanpost.jp/cgi-charge/index.php?lang=_en'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
              >
                📦 Calculate shipping cost
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  // Устанавливаем timestamp ДО запроса
                  lastUpdateTimeRef.current.consolidation = Date.now();

                  try {
                    const token = localStorage.getItem('auth_token');
                    console.log('Sending consolidation request for package:', selectedConsolidationPackage.id);
                    console.log('Package consolidateWith:', selectedConsolidationPackage.consolidateWith);

                    // Конвертируем вес в килограммы если введён в граммах
                    let weightInKg = consolidationWeight ? parseFloat(consolidationWeight) : undefined;
                    if (weightInKg && consolidationWeightUnit === 'g') {
                      weightInKg = weightInKg / 1000; // Граммы в килограммы
                    }

                    const response = await fetch(`/api/admin/packages/${selectedConsolidationPackage.id}/complete-consolidation`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        shippingCost: parseInt(consolidationShippingCost) || 0,
                        weight: weightInKg
                      })
                    });

                    if (response.ok) {
                      const data = await response.json();
                      const newPackageId = data.newPackageId;

                      // Обновляем state МГНОВЕННО - удаляем пакет из списка consolidation requests
                      setConsolidationPackages(prev => prev.filter(pkg => pkg.id !== selectedConsolidationPackage.id));

                      setShowConsolidationModal(false);
                      setSelectedConsolidationPackage(null);
                      setConsolidationWeight("");
                      setConsolidationWeightUnit("kg");
                      setConsolidationShippingCost("");

                      // Уведомляем другие вкладки об обновлении
                      console.log('[ADMIN] 📡 Broadcasting consolidation complete...');
                      broadcastUpdate('admin-data');
                      broadcastUpdate('packages'); // Также отправляем broadcast для профиля

                      // Показываем alert с новым ID
                      setTimeout(() => {
                        alert(`✅ Consolidation completed!\n\n📦 New Package ID: ${newPackageId}\n\nYou can print this ID for the consolidated package label.`);
                      }, 0);
                    } else {
                      const error = await response.json();
                      console.error('Consolidation error:', error);
                      alert('Error: ' + JSON.stringify(error));
                    }
                  } catch (error) {
                    console.error('Error completing consolidation:', error);
                    alert('Failed to complete consolidation');
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowConsolidationModal(false);
                  setSelectedConsolidationPackage(null);
                  setConsolidationWeight("");
                  setConsolidationWeightUnit("kg");
                  setConsolidationShippingCost("");
                }}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Number Modal */}
      {showTrackingModal && selectedShippingPackage && (
        <TrackingNumberModal
          package={selectedShippingPackage}
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedShippingPackage(null);
          }}
          onPackageUpdate={(updatedPackage: any) => {
            setSelectedShippingPackage(updatedPackage);
            setShippingRequests(prev => prev.map(pkg =>
              pkg.id === updatedPackage.id ? updatedPackage : pkg
            ));
          }}
          onSubmit={async (trackingNumber: string) => {
            // Устанавливаем timestamp ДО запроса
            lastUpdateTimeRef.current.shipping = Date.now();

            try {
              const token = localStorage.getItem('auth_token');
              const response = await fetch(`/api/admin/packages/${selectedShippingPackage.id}/mark-shipped`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ trackingNumber })
              });

              if (response.ok) {
                // Обновляем state МГНОВЕННО - удаляем пакет из списка shipping requests
                setShippingRequests(prev => prev.filter(pkg => pkg.id !== selectedShippingPackage.id));

                setShowTrackingModal(false);
                setSelectedShippingPackage(null);

                // Уведомляем другие вкладки об обновлении
                broadcastUpdate('admin-data');

                // Показываем alert после обновления UI
                setTimeout(() => {
                  alert('✅ Package marked as shipped! User has been notified.');
                }, 0);
              } else {
                const error = await response.json();
                alert('Error: ' + error.error);
              }
            } catch (error) {
              console.error('Error marking as shipped:', error);
              alert('Failed to mark as shipped');
            }
          }}
        />
      )}

      {/* Refund Amount Modal */}
      {showRefundModal && selectedCancelPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enter Refund Amount</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Customer:</p>
              <p className="font-medium text-gray-900">{selectedCancelPackage.user.email}</p>
              <p className="text-xs text-gray-500 mt-2">
                Package: {selectedCancelPackage.orderItem.title}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount (¥)
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the amount to refund to the customer
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!refundAmount || parseFloat(refundAmount) <= 0) {
                    alert('Please enter a valid amount');
                    return;
                  }

                  // Устанавливаем timestamp ДО запроса
                  lastUpdateTimeRef.current.cancelPurchase = Date.now();

                  try {
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(`/api/admin/packages/${selectedCancelPackage.id}/update-cancel-purchase`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        status: 'approved',
                        refundAmount: parseFloat(refundAmount)
                      })
                    });

                    if (response.ok) {
                      // Обновляем state МГНОВЕННО - удаляем из списка (approved = завершено)
                      setCancelPurchaseRequests(prev => prev.filter(p => p.id !== selectedCancelPackage.id));

                      // Уведомляем другие вкладки об обновлении
                      console.log('[ADMIN] 📡 Broadcasting cancellation completed...');
                      broadcastUpdate('admin-data');
                      broadcastUpdate('packages');

                      setShowRefundModal(false);
                      setRefundAmount("");
                      setSelectedCancelPackage(null);

                      // Показываем alert после обновления UI
                      setTimeout(() => {
                        alert(`✅ Refund completed! ¥${refundAmount} credited to customer.`);
                      }, 0);
                    } else {
                      const data = await response.json();
                      alert(`Error: ${data.error}`);
                    }
                  } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to process refund');
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Confirm Refund
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount("");
                  setSelectedCancelPackage(null);
                }}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
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

// Функция для парсинга материалов из текста (японского или английского)
function parseMaterialFromText(text: string): string {
  if (!text) return '';

  // Убираем HTML теги
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  // Паттерны для поиска материалов
  const patterns = [
    // Паттерны с процентами: "綿97%＆ポリウレタン3％" или "Cotton 97% & Polyurethane 3%"
    /([一-龯ぁ-んァ-ヶーa-zA-Z\s]+[\d]+[%％][\s&＆・]+[一-龯ぁ-んァ-ヶーa-zA-Z\s]+[\d]+[%％])/gi,
    /([一-龯ぁ-んァ-ヶーa-zA-Z\s]+[\d]+[%％])/gi,
    // Паттерны "素材：" или "Material:" или "材質："
    /(?:素材|材質|material|fabric|composition)[:：\s]+([^\n\r。、]+)/gi,
    // Паттерн для "綿100%" без дополнительных слов
    /([一-龯ぁ-んァ-ヶー]{1,10}[\d]+[%％])/g,
  ];

  const materials: string[] = [];

  for (const pattern of patterns) {
    const matches = cleanText.matchAll(pattern);
    for (const match of matches) {
      const material = (match[1] || match[0]).trim();
      // Фильтруем слишком длинные совпадения (вероятно не материалы)
      if (material.length > 0 && material.length < 150) {
        materials.push(material);
      }
    }
  }

  // Удаляем дубликаты и возвращаем первое совпадение
  const uniqueMaterials = [...new Set(materials)];
  return uniqueMaterials.length > 0 ? uniqueMaterials.join(' | ') : '';
}

// Модальное окно для ввода трекинг номера
function TrackingNumberModal({ package: pkg, onClose, onSubmit, onPackageUpdate }: any) {
  const [trackingNumber, setTrackingNumber] = useState(pkg.trackingNumber || '');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [materialNotes, setMaterialNotes] = useState<Record<number, string>>({});
  const [parsingMaterial, setParsingMaterial] = useState<Record<number, boolean>>({});

  // Additional shipping costs
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [additionalShippingCost, setAdditionalShippingCost] = useState(pkg.additionalShippingCost || 0);
  const [additionalShippingReason, setAdditionalShippingReason] = useState(pkg.additionalShippingReason || '');
  const [chargingAdditional, setChargingAdditional] = useState(false);
  const [hasChargedAdditional, setHasChargedAdditional] = useState(pkg.additionalShippingCost > 0 && !pkg.additionalShippingPaid);

  // Sync hasChargedAdditional with pkg updates
  useEffect(() => {
    setHasChargedAdditional(pkg.additionalShippingCost > 0 && !pkg.additionalShippingPaid);
    setAdditionalShippingCost(pkg.additionalShippingCost || 0);
    setAdditionalShippingReason(pkg.additionalShippingReason || '');
  }, [pkg.additionalShippingCost, pkg.additionalShippingPaid, pkg.additionalShippingReason]);

  // Функция для парсинга материала товара со страницы
  const handleParseMaterial = async (item: any, index: number) => {
    if (!item.itemUrl) {
      alert('No item URL available');
      return;
    }

    setParsingMaterial({ ...parsingMaterial, [index]: true });

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/parse-material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemUrl: item.itemUrl })
      });

      if (!response.ok) throw new Error('Failed to parse material');

      const data = await response.json();

      if (data.material) {
        setMaterialNotes({ ...materialNotes, [index]: data.material });
      } else {
        alert('Material not found on the page');
      }
    } catch (error) {
      console.error('Error parsing material:', error);
      alert('Failed to parse material');
    } finally {
      setParsingMaterial({ ...parsingMaterial, [index]: false });
    }
  };

  const handleChargeAdditional = async () => {
    if (!additionalShippingCost || additionalShippingCost <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!additionalShippingReason || additionalShippingReason.trim() === '') {
      alert('Please enter a reason');
      return;
    }

    setChargingAdditional(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/packages/${pkg.id}/charge-additional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          additionalShippingCost,
          additionalShippingReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to charge additional shipping');
      }

      const data = await response.json();
      alert('Additional shipping cost charged successfully. Customer will be notified.');
      setHasChargedAdditional(true);
      setShowChargeForm(false);

      // Update parent component with new package data
      if (onPackageUpdate && data.package) {
        onPackageUpdate(data.package);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error charging additional shipping. Please try again.');
    } finally {
      setChargingAdditional(false);
    }
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      // Если есть файл инвойса, сначала загружаем его
      if (invoiceFile) {
        const formData = new FormData();
        formData.append('invoice', invoiceFile);
        formData.append('packageId', pkg.id);

        const token = localStorage.getItem('auth_token');
        const uploadResponse = await fetch('/api/admin/upload-invoice', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload invoice');
        }
      }

      // Теперь отправляем tracking number
      await onSubmit(trackingNumber);
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading invoice. Please try again.');
      setUploading(false);
    }
  };

  // Собираем все товары для отображения
  const allItems = [];
  if (pkg.consolidated && pkg.consolidatedPackages) {
    // Только консолидированные товары, без главного
    pkg.consolidatedPackages.forEach((consolidatedPkg: any) => {
      allItems.push({
        ...consolidatedPkg.orderItem,
        weight: consolidatedPkg.weight,
        isMain: false
      });
    });
  } else {
    // Обычная посылка - один товар
    allItems.push({
      ...pkg.orderItem,
      weight: pkg.weight,
      isMain: true
    });
  }

  // Подсчет общей стоимости
  const totalItemsCost = allItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  // Для консолидированной посылки используем вес самого пакета (который был введен при консолидации)
  // Для обычной посылки - вес из item
  const totalWeight = pkg.consolidated
    ? (parseFloat(pkg.weight) || 0)
    : allItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">📦 Shipment Details</h2>
              <p className="text-blue-100">Review order information before shipping</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer & Shipping Address */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Information
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-900 text-lg">{pkg.user?.email || 'Unknown User'}</p>
                <div className="pt-2 border-t border-gray-300">
                  <p className="text-gray-600 text-xs mb-1">Shipping Method</p>
                  <p className="font-bold text-blue-600 uppercase">{pkg.shippingMethod || 'EMS'}</p>
                </div>

                {/* Insurance Coverage */}
                {pkg.additionalInsurance > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-white font-bold text-sm">🛡️ INSURANCE COVERAGE</p>
                      </div>
                      <p className="text-white text-2xl font-black">¥{(20000 + pkg.additionalInsurance).toLocaleString()}</p>
                      <p className="text-green-100 text-xs mt-1">Standard ¥20,000 + Additional ¥{pkg.additionalInsurance.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {pkg.shippingAddress && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address
                  </h3>
                </div>

                {/* Formatted Address for Invoice */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Formatted Address (for invoice)</p>
                      <p className="text-sm font-mono text-gray-900 leading-relaxed">
                        {pkg.shippingAddress.address}
                        {pkg.shippingAddress.apartment ? `, ${pkg.shippingAddress.apartment}` : ''}, {pkg.shippingAddress.city}, {pkg.shippingAddress.state} {pkg.shippingAddress.postalCode}, {pkg.shippingAddress.country}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const formattedAddress = `${pkg.shippingAddress.address}${pkg.shippingAddress.apartment ? `, ${pkg.shippingAddress.apartment}` : ''}, ${pkg.shippingAddress.city}, ${pkg.shippingAddress.state} ${pkg.shippingAddress.postalCode}, ${pkg.shippingAddress.country}`;
                        navigator.clipboard.writeText(formattedAddress);
                        alert('✓ Address copied to clipboard!');
                      }}
                      className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {/* Recipient Name */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recipient Name</p>
                    <p className="font-bold text-gray-900 text-base">{pkg.shippingAddress.name}</p>
                  </div>

                  {/* Phone Number */}
                  {pkg.shippingAddress.phoneNumber && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                      <p className="flex items-center gap-2 text-gray-900 font-medium">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {pkg.shippingAddress.phoneNumber}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-blue-200 space-y-2">
                    {/* Street Address */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Street Address</p>
                      <p className="text-gray-900 font-medium">{pkg.shippingAddress.address}</p>
                    </div>

                    {/* Apartment/Suite */}
                    {pkg.shippingAddress.apartment && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Apartment/Suite</p>
                        <p className="text-gray-900 font-medium">{pkg.shippingAddress.apartment}</p>
                      </div>
                    )}

                    {/* City */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">City</p>
                      <p className="text-gray-900 font-medium">{pkg.shippingAddress.city}</p>
                    </div>

                    {/* State/Province */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">State/Province</p>
                      <p className="text-gray-900 font-medium">{pkg.shippingAddress.state}</p>
                    </div>

                    {/* Postal Code */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Postal Code</p>
                      <p className="text-gray-900 font-medium">{pkg.shippingAddress.postalCode}</p>
                    </div>

                    {/* Country */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Country</p>
                      <p className="font-bold text-blue-600 text-base">{pkg.shippingAddress.country}</p>
                    </div>

                    {/* SSN or Tax ID */}
                    {(pkg.shippingAddress.ssnNumber || pkg.shippingAddress.taxIdNumber) && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          {pkg.shippingAddress.ssnNumber ? 'SSN Number' : `Tax ID (${pkg.shippingAddress.taxIdType || 'Other'})`}
                        </p>
                        <p className="font-mono text-gray-900 font-semibold bg-yellow-50 px-2 py-1 rounded inline-block">
                          {pkg.shippingAddress.ssnNumber || pkg.shippingAddress.taxIdNumber}
                        </p>
                      </div>
                    )}

                    {/* Company Information */}
                    {pkg.shippingAddress.companyName && (
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company Name</p>
                        <p className="text-gray-900 font-semibold">{pkg.shippingAddress.companyName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b-2 border-green-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Items {pkg.consolidated && <span className="text-sm text-green-600">(Consolidated)</span>}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight (kg)</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">{item.marketplace === 'yahoo' ? '💜 Yahoo' : '🛍️ Rakuten'}</p>
                              {item.itemUrl && (
                                <a
                                  href={item.itemUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View
                                </a>
                              )}
                            </div>
                            {/* Admin-only material note - only for FedEx shipments */}
                            {pkg.shippingMethod?.toLowerCase() === 'fedex' && (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={materialNotes[index] || ''}
                                  onChange={(e) => setMaterialNotes({ ...materialNotes, [index]: e.target.value })}
                                  placeholder="Material (admin only, not saved)"
                                  className="flex-1 px-2 py-1 text-xs border border-amber-300 rounded bg-amber-50 text-amber-900 placeholder-amber-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                                />
                                <button
                                  onClick={() => handleParseMaterial(item, index)}
                                  disabled={parsingMaterial[index] || !item.itemUrl}
                                  className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors flex items-center gap-1"
                                  title="Parse material from product page"
                                >
                                  {parsingMaterial[index] ? (
                                    <>
                                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Parsing...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                      </svg>
                                      Parse
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ¥{(item.price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          {item.weight || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600 text-lg">
                        ¥{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">TOTAL:</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-full font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        {totalWeight.toFixed(2)} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600 text-xl">
                      ¥{totalItemsCost.toLocaleString()}
                    </td>
                  </tr>
                  {(pkg.domesticShippingCost || 0) > 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-600">Domestic Shipping (до склада):</td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">
                        ¥{(pkg.domesticShippingCost || 0).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-right text-sm text-gray-600">International Shipping:</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-700">
                      ¥{(pkg.shippingCost || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={4} className="px-6 py-3 text-right font-bold text-gray-900">Total Shipping Cost:</td>
                    <td className="px-6 py-3 text-right font-bold text-green-600 text-lg">
                      ¥{((pkg.shippingCost || 0) + (pkg.domesticShippingCost || 0)).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Shipping Costs */}
          {pkg.additionalShippingPaid ? (
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900">✅ Additional Payment Completed</h3>
                  <p className="text-sm text-green-800 mt-1">Customer has paid the additional shipping costs. You can now confirm shipment.</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Additional Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-700">¥{pkg.additionalShippingCost.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-semibold block mb-1">Reason:</span>
                  <p className="text-gray-600 text-sm">{pkg.additionalShippingReason}</p>
                </div>
              </div>
            </div>
          ) : hasChargedAdditional ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-900">⚠️ Waiting for Additional Payment</h3>
                  <p className="text-sm text-yellow-800 mt-1">Customer needs to pay additional shipping costs before you can confirm shipment</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Additional Amount:</span>
                  <span className="text-2xl font-bold text-yellow-700">¥{additionalShippingCost.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-semibold block mb-1">Reason:</span>
                  <p className="text-gray-600 text-sm">{additionalShippingReason}</p>
                </div>
              </div>
            </div>
          ) : !showChargeForm ? (
            <div>
              <button
                onClick={() => setShowChargeForm(true)}
                className="w-full py-4 px-6 border-2 border-dashed border-orange-400 text-orange-600 rounded-xl hover:bg-orange-50 font-semibold transition-all text-lg flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                💰 Charge More for Shipping
              </button>
            </div>
          ) : (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-900">💰 Charge Additional Shipping</h3>
                  <p className="text-sm text-orange-700 mt-1">Customer will be notified and must pay before shipment</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (¥)
                  </label>
                  <input
                    type="number"
                    value={additionalShippingCost}
                    onChange={(e) => setAdditionalShippingCost(Number(e.target.value))}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={additionalShippingReason}
                    onChange={(e) => setAdditionalShippingReason(e.target.value)}
                    placeholder="e.g., Package weight exceeded estimated weight, additional fees required..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowChargeForm(false)}
                    disabled={chargingAdditional}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChargeAdditional}
                    disabled={chargingAdditional}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chargingAdditional ? 'Charging...' : 'Charge Customer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tracking & Invoice Upload */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., EJ123456789JP"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the tracking number for this shipment
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 Upload Invoice (PDF, Excel, Word)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setInvoiceFile(file);
                    }
                  }}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {invoiceFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {invoiceFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all text-lg"
            >
              ← Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || (hasChargedAdditional && !pkg.additionalShippingPaid) || !trackingNumber.trim() || !invoiceFile}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : !trackingNumber.trim() ? (
                '⚠️ Tracking Number Required'
              ) : !invoiceFile ? (
                '⚠️ Invoice Required'
              ) : (hasChargedAdditional && !pkg.additionalShippingPaid) ? (
                '⚠️ Waiting for Customer Payment'
              ) : (
                '✓ Confirm Shipment & Send to Customer'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для reinforcement requests
function ReinforcementRequestCard({ pkg, lastUpdateTimeRef, onCompleted }: any) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (!confirm('Mark this reinforcement as completed?')) {
      return;
    }

    setCompleting(true);

    // Устанавливаем timestamp ДО запроса
    if (lastUpdateTimeRef) {
      lastUpdateTimeRef.current.reinforcement = Date.now();
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/packages/${pkg.id}/complete-reinforcement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Вызываем callback с обновлённым пакетом
        if (onCompleted) {
          onCompleted(result.package);
        }

        // Уведомляем другие вкладки об обновлении
        console.log('[ADMIN] 📡 Broadcasting reinforcement complete...');
        broadcastUpdate('admin-data');
        broadcastUpdate('packages'); // Также отправляем broadcast для профиля

        // Показываем alert после обновления UI
        setTimeout(() => {
          alert('✅ Reinforcement completed! User has been notified.');
        }, 0);
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error completing reinforcement:', error);
      alert('Failed to complete reinforcement');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
          <p className="text-sm font-mono">
            Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</span>
          </p>
          <p className="text-xs text-purple-600 font-mono font-bold mt-1">Package ID: {pkg.id}</p>
          {pkg.consolidated && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              ✓ Consolidated Package
            </span>
          )}
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          📦 Pending Reinforcement
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex gap-4">
          {pkg.orderItem.image && (
            <img
              src={pkg.orderItem.image}
              alt={pkg.orderItem.title}
              className="w-24 h-24 object-cover rounded border border-gray-200"
            />
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{pkg.orderItem.title}</h4>
            <p className="text-sm text-gray-600">Quantity: {pkg.orderItem.quantity}</p>

            {/* Предупреждение о фото сервисе */}
            {pkg.photoService && pkg.photoServiceStatus === 'pending' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-300 rounded flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-800">📸 Photo Service Also Ordered</p>
                  <p className="text-xs text-blue-700 mt-1">
                    This package also has a pending photo service request. Please check the Photos tab to upload photos before completing reinforcement.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p className="text-sm text-amber-800">
                <strong>Instructions:</strong> Reinforce corners with cardboard edges and add bubble wrap for fragile items.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleComplete}
          disabled={completing}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            completing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {completing ? 'Completing...' : '✅ Mark as Completed'}
        </button>
      </div>
    </div>
  );
}

// Компонент для загрузки фотографий
function PhotoRequestCard({ pkg, lastUpdateTimeRef, onPhotoUploaded }: any) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (pkg.photos) {
      try {
        setPhotoUrls(JSON.parse(pkg.photos));
      } catch (e) {
        setPhotoUrls([]);
      }
    }
  }, [pkg.photos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoUrls.length >= 3) {
      alert('Maximum 3 photos allowed');
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Проверка размера (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📸 Upload successful, URL:', data.url);

        // Добавляем timestamp для обхода кэша
        const imageUrl = data.url + '?t=' + Date.now();
        console.log('🔗 Full image URL:', imageUrl);

        setPhotoUrls([...photoUrls, imageUrl]);
        // Очищаем input
        e.target.value = '';
      } else {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
        alert('Upload failed: ' + error.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSavePhotos = async () => {
    if (photoUrls.length === 0) {
      alert('Please add at least one photo');
      return;
    }

    setUploading(true);

    // Устанавливаем timestamp ДО запроса
    if (lastUpdateTimeRef) {
      lastUpdateTimeRef.current.photos = Date.now();
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/packages/${pkg.id}/upload-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ photos: photoUrls })
      });

      if (response.ok) {
        const result = await response.json();

        // Вызываем callback с обновлённым пакетом
        if (onPhotoUploaded) {
          onPhotoUploaded(result.package);
        }

        // Очищаем состояние
        setPhotoUrls([]);

        // Уведомляем другие вкладки об обновлении
        console.log('[ADMIN] 📡 Broadcasting photos uploaded...');
        broadcastUpdate('admin-data');
        broadcastUpdate('packages'); // Также отправляем broadcast для профиля

        // Показываем alert после обновления UI
        setTimeout(() => {
          alert('✅ Photos uploaded successfully! User has been notified.');
        }, 0);
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{pkg.user?.email || 'Unknown User'}</h3>
          <p className="text-sm font-mono">
            Order <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow">#{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</span>
          </p>
          <p className="text-xs text-gray-400 font-mono mt-1">Package ID: {pkg.id}</p>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
          📸 Photo Request • ¥500 Paid
        </span>
      </div>

      {/* Package Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3">
          {pkg.orderItem.image && (
            <img src={pkg.orderItem.image} alt={pkg.orderItem.title} className="w-20 h-20 rounded object-cover" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{pkg.orderItem.title}</p>
            <p className="text-xs text-gray-500">Qty: {pkg.orderItem.quantity}</p>
            <p className="text-xs text-blue-600 font-mono">Order #{pkg.orderItem.order?.orderNumber ? String(pkg.orderItem.order.orderNumber).padStart(6, '0') : pkg.orderItem.orderId.slice(0, 8)}</p>
            {pkg.trackingNumber && (
              <p className="text-xs text-gray-600 font-mono mt-1">Tracking: {pkg.trackingNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          ⏳ Waiting for Photos
        </span>
      </div>

      {/* Photo Upload Section */}
      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📁 Upload Photos from Computer (Max 3 photos, 10MB each)
          </label>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={photoUrls.length >= 3 || uploadingFile}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploadingFile && (
              <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Uploading...
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ✨ Click "Choose File" to select photos from your computer
          </p>
        </div>

        {/* Photo Preview */}
        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photoUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                  onLoad={(e) => {
                    console.log('✅ Image loaded successfully:', url);
                  }}
                  onError={(e) => {
                    console.error('❌ Image failed to load:', url);
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <p className="text-xs text-gray-600 mt-1 text-center truncate px-1" title={url}>Photo {index + 1}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSavePhotos}
            disabled={uploading || photoUrls.length === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : '✓ Upload Photos & Notify User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Admin Messages Section Component
function AdminMessagesSection({
  messages,
  selectedUser,
  setSelectedUser,
  onRefresh
}: {
  messages: any[],
  selectedUser: string | null,
  setSelectedUser: (id: string | null) => void,
  onRefresh: (userId?: string) => void
}) {
  // const { socket, isConnected } = useSocket(); // DISABLED - using polling instead
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch list of users with messages
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    };

    fetchUsers();
  }, []);

  // Poll for message updates every 3 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!document.hidden && selectedUser) {
        onRefresh(selectedUser);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedUser, onRefresh]);

  // Mark user messages as read when viewing conversation
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedUser || messages.length === 0) return;

      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const unreadUserMessages = messages.filter(
        m => m.userId === selectedUser && m.senderType === 'user' && !m.read
      );

      if (unreadUserMessages.length === 0) return;

      try {
        for (const msg of unreadUserMessages) {
          await fetch('/api/messages', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messageId: msg.id })
          });
        }
        // Refresh after marking as read
        setTimeout(() => onRefresh(selectedUser), 500);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    // Mark messages as read after a short delay
    const timer = setTimeout(() => markMessagesAsRead(), 1000);
    return () => clearTimeout(timer);
  }, [selectedUser, messages]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Уведомляем другие вкладки об обновлении
        broadcastUpdate('admin-data');
        onRefresh(selectedUser);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get unread count for a user
  const getUnreadCount = (userId: string) => {
    return messages.filter(m => m.userId === userId && m.senderType === 'user' && !m.read).length;
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      {/* Users List */}
      <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Users</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No users yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => {
                const unreadCount = getUnreadCount(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user.id);
                      onRefresh(user.id);
                    }}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedUser === user.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a user to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {users.find(u => u.id === selectedUser)?.name ||
                   users.find(u => u.id === selectedUser)?.email ||
                   'User'}
                </h3>
                <p className="text-xs text-purple-100">
                  {users.find(u => u.id === selectedUser)?.email}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.senderType === 'admin'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.senderType === 'admin' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  disabled={sending}
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
