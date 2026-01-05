import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const QueryClientContext = createContext(null);

const serializeKey = (key) => JSON.stringify(key ?? []);

class QueryStore {
  constructor() {
    this.data = new Map();
    this.keyMap = new Map();
    this.listeners = new Map();
  }

  subscribe(keyString, listener) {
    const listeners = this.listeners.get(keyString) ?? new Set();
    listeners.add(listener);
    this.listeners.set(keyString, listeners);
    return () => {
      listeners.delete(listener);
    };
  }

  notify(keyString) {
    const listeners = this.listeners.get(keyString);
    listeners?.forEach((listener) => listener());
  }

  setQueryData(key, updater) {
    const keyString = serializeKey(key);
    const current = this.data.get(keyString);
    const nextValue = typeof updater === 'function' ? updater(current) : updater;
    this.data.set(keyString, nextValue);
    this.keyMap.set(keyString, key);
    this.notify(keyString);
  }

  getQueryData(key) {
    return this.data.get(serializeKey(key));
  }

  getQueriesData(partialKey) {
    const prefix = serializeKey(partialKey);
    return Array.from(this.data.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [this.keyMap.get(key) ?? JSON.parse(key), value]);
  }

  invalidateQueries(partialKey) {
    const prefix = serializeKey(partialKey);
    Array.from(this.listeners.entries())
      .filter(([key]) => key.startsWith(prefix))
      .forEach(([, listeners]) => {
        listeners.forEach((listener) => listener());
      });
  }

  cancelQueries() {
    // no-op placeholder for parity
    return Promise.resolve();
  }
}

export class QueryClient {
  constructor() {
    this.store = new QueryStore();
  }

  getQueriesData(partialKey) {
    return this.store.getQueriesData(partialKey);
  }

  setQueryData(key, updater) {
    this.store.setQueryData(key, updater);
    return this.store.getQueryData(key);
  }

  getQueryData(key) {
    return this.store.getQueryData(key);
  }

  invalidateQueries({ queryKey }) {
    this.store.invalidateQueries(queryKey);
    return Promise.resolve();
  }

  cancelQueries({ queryKey } = {}) {
    return this.store.cancelQueries(queryKey);
  }
}

const defaultClient = new QueryClient();

export const QueryClientProvider = ({ client, children }) => {
  const value = useMemo(() => client ?? new QueryClient(), [client]);
  return React.createElement(QueryClientContext.Provider, { value }, children);
};

export const useQueryClient = () => {
  const context = useContext(QueryClientContext);
  return context ?? defaultClient;
};

export const useQuery = ({ queryKey, queryFn, staleTime = 0 }) => {
  const client = useQueryClient();
  const keyString = useMemo(() => serializeKey(queryKey), [queryKey]);
  const [state, setState] = useState(() => {
    const cached = client.getQueryData(queryKey);
    return {
      data: cached,
      error: null,
      isLoading: !cached,
      updatedAt: cached ? Date.now() : 0,
    };
  });

  const refreshCounter = useRef(0);

  useEffect(() => {
    const unsubscribe = client.store.subscribe(keyString, () => {
      refreshCounter.current += 1;
      setState((prev) => ({ ...prev }));
    });
    return unsubscribe;
  }, [client, keyString]);

  useEffect(() => {
    let cancelled = false;
    const shouldRefetch = !state.updatedAt || Date.now() - state.updatedAt > staleTime;

    const execute = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await queryFn();
        if (cancelled) return;
        client.setQueryData(queryKey, data);
        setState({ data, error: null, isLoading: false, updatedAt: Date.now() });
      } catch (error) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, error: error ?? null, isLoading: false }));
      }
    };

    if (shouldRefetch) {
      void execute();
    }

    return () => {
      cancelled = true;
    };
  }, [client, queryFn, queryKey, staleTime, state.updatedAt, refreshCounter.current]);

  const refetch = async () => {
    await client.store.cancelQueries(queryKey);
    client.store.invalidateQueries(queryKey);
  };

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    refetch,
  };
};

export const useMutation = ({ mutationFn, onMutate, onError, onSuccess, onSettled }) => {
  const client = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async (variables) => {
    setIsPending(true);
    setError(null);
    let context;
    try {
      context = onMutate ? await onMutate(variables) : undefined;
      const data = await mutationFn(variables);
      onSuccess?.(data, variables, context);
      onSettled?.(data, null, variables, context);
      setIsPending(false);
      return data;
    } catch (err) {
      setError(err);
      onError?.(err, variables, context);
      onSettled?.(undefined, err, variables, context);
      setIsPending(false);
      throw err;
    }
  };

  return { mutateAsync, isPending, error, client };
};

export const useIsMutating = () => 0;

export const hashQueryKey = serializeKey;
