// lib/sync.ts - Real-time sync between tabs without WebSocket

let broadcastChannel: BroadcastChannel | null = null;

// Initialize broadcast channel for cross-tab communication
export function initBroadcastChannel() {
  if (typeof window === 'undefined') return null;

  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel('japrix-sync');
  }

  return broadcastChannel;
}

// Broadcast update to other tabs
export function broadcastUpdate(type: 'packages' | 'orders' | 'admin-data' | 'balance', data?: any) {
  const channel = initBroadcastChannel();
  if (channel) {
    channel.postMessage({ type, data, timestamp: Date.now() });
  }

  // КРИТИЧЕСКИ ВАЖНО: Отправляем локальное событие для принудительного обновления ТЕКУЩЕЙ вкладки
  if (typeof window !== 'undefined') {
    
    // Отправляем специфичное событие
    if (type === 'packages') {
      window.dispatchEvent(new CustomEvent('packagesUpdated'));
    } else if (type === 'orders') {
      window.dispatchEvent(new CustomEvent('ordersUpdated'));
    } else if (type === 'balance') {
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
    } else if (type === 'admin-data') {
      window.dispatchEvent(new CustomEvent('adminDataUpdated'));
    }

    // Всегда отправляем общее событие
    window.dispatchEvent(new CustomEvent('dataUpdated'));
  }
}

// Listen for updates from other tabs
export function onBroadcastUpdate(callback: (event: { type: string; data?: any }) => void) {
  const channel = initBroadcastChannel();
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    callback(event.data);
  };

  channel.addEventListener('message', handler);

  return () => {
    channel.removeEventListener('message', handler);
  };
}

// Cleanup
export function closeBroadcastChannel() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}
