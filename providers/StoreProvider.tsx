// src/providers/counter-store-provider.tsx
'use client';

import { createContext, ReactNode, useContext, useRef } from 'react';
import { useStore } from 'zustand';

import { createApiCallStore, initApiCallStore, TApiCallStore } from '@/stores/apiCall';

export type ApiCallStoreApi = ReturnType<typeof createApiCallStore>;

export const ApiCallStoreContext = createContext<ApiCallStoreApi | null>(null);

export interface ApiCallStoreProviderProps {
  children: ReactNode;
}

export const ApiStoreProvider = ({ children }: ApiCallStoreProviderProps) => {
  const storeRef = useRef<ApiCallStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createApiCallStore(initApiCallStore());
  }

  return (
    <ApiCallStoreContext.Provider value={storeRef.current}>{children}</ApiCallStoreContext.Provider>
  );
};

export const useApiCallStore = <T,>(selector: (store: TApiCallStore) => T): T => {
  const apiCallStoreContext = useContext(ApiCallStoreContext);

  if (!apiCallStoreContext) {
    throw new Error(`useApiCallStore must be used within ApiStoreProvider`);
  }

  return useStore(apiCallStoreContext, selector);
};
