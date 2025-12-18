// hooks/useAutoRefresh.ts - Auto refresh data with broadcast only (no polling)
import { useEffect, useCallback, useRef } from 'react';
import { onBroadcastUpdate, broadcastUpdate } from '@/lib/sync';

interface UseAutoRefreshOptions {
  enabled?: boolean; // Enable/disable auto refresh
  onRefresh: () => void | Promise<void>; // Callback to refresh data
  broadcastType?: 'packages' | 'orders' | 'admin-data'; // Type of data to sync
}

export function useAutoRefresh({
  enabled = true,
  onRefresh,
  broadcastType
}: UseAutoRefreshOptions) {
  const refreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
    }
  }, [onRefresh]);

  // Cross-tab sync via Broadcast Channel ONLY
  useEffect(() => {
    if (!enabled || !broadcastType) return;

    const unsubscribe = onBroadcastUpdate((event) => {
      if (event.type === broadcastType) {
        console.log(`[SYNC] Received ${broadcastType} update from another tab`);
        refresh();
      }
    });

    return unsubscribe;
  }, [enabled, broadcastType, refresh]);

  // Notify other tabs when this tab makes changes
  const notifyUpdate = useCallback(() => {
    if (broadcastType) {
      broadcastUpdate(broadcastType);
    }
  }, [broadcastType]);

  return { refresh, notifyUpdate };
}
