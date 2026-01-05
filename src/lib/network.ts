import { useEffect, useState } from 'react';

export type NetworkStatusReason = 'browser_offline' | 'api_unreachable' | null;

export interface NetworkStatus {
  isOnline: boolean;
  reason: NetworkStatusReason;
}

let currentStatus: NetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  reason: null,
};

const listeners = new Set<(status: NetworkStatus) => void>();
let hasInitializedBrowserEvents = false;

const notifyListeners = () => {
  listeners.forEach((listener) => listener(currentStatus));
};

const handleBrowserConnectivityChange = (isOnline: boolean) => {
  currentStatus = { isOnline, reason: isOnline ? null : 'browser_offline' };
  notifyListeners();
};

const ensureBrowserListeners = () => {
  if (hasInitializedBrowserEvents || typeof window === 'undefined') return;

  window.addEventListener('online', () => handleBrowserConnectivityChange(true));
  window.addEventListener('offline', () => handleBrowserConnectivityChange(false));
  hasInitializedBrowserEvents = true;
};

export const reportApiOffline = () => {
  if (!currentStatus.isOnline && currentStatus.reason === 'api_unreachable') return;

  currentStatus = { isOnline: false, reason: 'api_unreachable' };
  notifyListeners();
};

export const reportApiOnline = () => {
  if (currentStatus.isOnline && currentStatus.reason === null) return;

  currentStatus = { isOnline: true, reason: null };
  notifyListeners();
};

export const getNetworkStatus = () => currentStatus;

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(currentStatus);

  useEffect(() => {
    ensureBrowserListeners();
    const listener = (nextStatus: NetworkStatus) => setStatus(nextStatus);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return status;
};
