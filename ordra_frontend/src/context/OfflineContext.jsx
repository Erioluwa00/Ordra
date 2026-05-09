import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { db } from "../lib/db";

const OfflineContext = createContext({
  isOnline: true,
  lastOnline: null,
  pendingCount: 0,
  syncing: false
});

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [lastOnline, setLastOnline] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Mutations for syncing
  const createOrder = useMutation(api.orders.createOrder);
  const updateOrder = useMutation(api.orders.updateOrder);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const updatePayment = useMutation(api.orders.updateOrderPaymentStatus);
  const deleteOrder = useMutation(api.orders.deleteOrder);

  // Refresh pending count
  const refreshPending = useCallback(async () => {
    const count = await db.sync_queue.count();
    setPendingCount(count);
  }, []);

  const processQueue = useCallback(async () => {
    if (!window.navigator.onLine || syncing) return;
    
    const queue = await db.sync_queue.toArray();
    if (queue.length === 0) return;

    setSyncing(true);
    console.log(`[OfflineSync] Processing ${queue.length} items...`);

    for (const item of queue) {
      try {
        if (item.type === 'CREATE_ORDER') {
          await createOrder(item.data);
        } else if (item.type === 'UPDATE_ORDER') {
          await updateOrder(item.data);
        } else if (item.type === 'UPDATE_STATUS') {
          await updateStatus(item.data);
        } else if (item.type === 'UPDATE_PAYMENT') {
          await updatePayment(item.data);
        } else if (item.type === 'DELETE_ORDER') {
          await deleteOrder(item.data);
        }
        
        // Remove from queue on success
        await db.sync_queue.delete(item.id);
      } catch (err) {
        console.error(`[OfflineSync] Failed to sync item ${item.id}:`, err);
        // If it's a permanent error (e.g. validation), we might want to remove it
        // but for now we just skip and let it retry later
      }
    }

    setSyncing(false);
    refreshPending();
  }, [createOrder, updateOrder, updateStatus, updatePayment, deleteOrder, syncing, refreshPending]);

  useEffect(() => {
    refreshPending();

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also poll occasionally or check on refocus
    const interval = setInterval(() => {
      if (window.navigator.onLine) processQueue();
      refreshPending();
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [processQueue, refreshPending]);

  return (
    <OfflineContext.Provider value={{ isOnline, lastOnline, pendingCount, syncing, refreshPending }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
