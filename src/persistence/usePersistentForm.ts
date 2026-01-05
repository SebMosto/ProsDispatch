import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { del, get, set } from 'idb-keyval';

export type DraftStatus = 'idle' | 'saved_locally';

interface PersistedDraft<T> {
  data: T;
  lastSavedAt: number;
}

interface UsePersistentFormOptions<T> {
  storageKey: string;
  initialValues: T;
  debounceMs?: number;
  enabled?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 400;

export function usePersistentForm<T>({
  storageKey,
  initialValues,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  enabled = true,
}: UsePersistentFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [isDirty, setIsDirty] = useState(false);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(!enabled);
  const initialSerialized = useRef(JSON.stringify(initialValues));

  useEffect(() => {
    initialSerialized.current = JSON.stringify(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!enabled) return undefined;

    let isActive = true;

    get<PersistedDraft<T>>(storageKey)
      .then((storedDraft) => {
        if (!isActive || !storedDraft) return;

        setValues(storedDraft.data);
        setDraftStatus('saved_locally');
        setIsDirty(true);
        setLastSavedAt(storedDraft.lastSavedAt ?? null);
      })
      .catch(() => {
        // IndexedDB may be unavailable (SSR or private mode). Fail silently.
      })
      .finally(() => {
        if (isActive) {
          setHydrated(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !hydrated) return undefined;

    const serialized = JSON.stringify(values);
    setIsDirty(serialized !== initialSerialized.current);

    const timeout = window.setTimeout(() => {
      const draftPayload: PersistedDraft<T> = {
        data: values,
        lastSavedAt: Date.now(),
      };

      set(storageKey, draftPayload)
        .then(() => {
          setDraftStatus('saved_locally');
          setLastSavedAt(draftPayload.lastSavedAt);
        })
        .catch(() => {
          // Ignore write errors to avoid crashing the form while offline.
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [debounceMs, enabled, hydrated, storageKey, values]);

  const clearDraft = useCallback(async () => {
    if (!enabled) return;

    await del(storageKey).catch(() => undefined);
    setDraftStatus('idle');
    setIsDirty(false);
    setLastSavedAt(null);
    setValues(initialValues);
    initialSerialized.current = JSON.stringify(initialValues);
  }, [enabled, initialValues, storageKey]);

  const draftState = useMemo(
    () => ({
      values,
      setValues,
      isDirty,
      draftStatus,
      lastSavedAt,
      clearDraft,
      hydrated,
    }),
    [values, isDirty, draftStatus, lastSavedAt, clearDraft, hydrated],
  );

  return draftState;
}

export type UsePersistentFormReturn<T> = ReturnType<typeof usePersistentForm<T>>;
