import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistentForm } from './usePersistentForm';
import * as idbKeyval from 'idb-keyval';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('usePersistentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(idbKeyval.get).mockResolvedValue(undefined);
    vi.mocked(idbKeyval.set).mockResolvedValue(undefined);
    vi.mocked(idbKeyval.del).mockResolvedValue(undefined);
  });

  it('should initialize with initial values when no draft exists', async () => {
    const initialValues = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      usePersistentForm({
        storageKey: 'test-form',
        initialValues,
      })
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftStatus).toBe('idle');
  });

  it('should load stored draft when available', async () => {
    const initialValues = { name: 'John', email: 'john@example.com' };
    const storedDraft = {
      data: { name: 'Jane', email: 'jane@example.com' },
      lastSavedAt: Date.now(),
    };

    vi.mocked(idbKeyval.get).mockResolvedValue(storedDraft);

    const { result } = renderHook(() =>
      usePersistentForm({
        storageKey: 'test-form',
        initialValues,
      })
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.values).toEqual(storedDraft.data);
    expect(result.current.isDirty).toBe(true);
    expect(result.current.draftStatus).toBe('saved_locally');
    expect(result.current.lastSavedAt).toBe(storedDraft.lastSavedAt);
  });

  it('should reset to new initial values when storageKey changes without draft', async () => {
    const initialValues1 = { name: 'John', email: 'john@example.com' };
    const initialValues2 = { name: 'Bob', email: 'bob@example.com' };

    // First render with storageKey 'form-1' and a stored draft
    const storedDraft = {
      data: { name: 'Jane', email: 'jane@example.com' },
      lastSavedAt: Date.now(),
    };
    vi.mocked(idbKeyval.get).mockResolvedValue(storedDraft);

    const { result, rerender } = renderHook(
      ({ storageKey, initialValues }) =>
        usePersistentForm({
          storageKey,
          initialValues,
        }),
      {
        initialProps: {
          storageKey: 'form-1',
          initialValues: initialValues1,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    // Verify initial draft is loaded
    expect(result.current.values).toEqual(storedDraft.data);
    expect(result.current.isDirty).toBe(true);

    // Change storageKey to 'form-2' with no stored draft
    vi.mocked(idbKeyval.get).mockResolvedValue(undefined);

    rerender({
      storageKey: 'form-2',
      initialValues: initialValues2,
    });

    await waitFor(() => {
      // Values should reset to new initialValues
      expect(result.current.values).toEqual(initialValues2);
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftStatus).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
  });

  it('should reset to new initial values when storageKey changes with different draft', async () => {
    const initialValues1 = { name: 'John', email: 'john@example.com' };
    const initialValues2 = { name: 'Bob', email: 'bob@example.com' };

    // First render with storageKey 'form-1' and a stored draft
    const storedDraft1 = {
      data: { name: 'Jane', email: 'jane@example.com' },
      lastSavedAt: Date.now(),
    };
    vi.mocked(idbKeyval.get).mockResolvedValue(storedDraft1);

    const { result, rerender } = renderHook(
      ({ storageKey, initialValues }) =>
        usePersistentForm({
          storageKey,
          initialValues,
        }),
      {
        initialProps: {
          storageKey: 'form-1',
          initialValues: initialValues1,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    // Verify first draft is loaded
    expect(result.current.values).toEqual(storedDraft1.data);

    // Change storageKey to 'form-2' with a different stored draft
    const storedDraft2 = {
      data: { name: 'Alice', email: 'alice@example.com' },
      lastSavedAt: Date.now(),
    };
    vi.mocked(idbKeyval.get).mockResolvedValue(storedDraft2);

    rerender({
      storageKey: 'form-2',
      initialValues: initialValues2,
    });

    await waitFor(() => {
      // Values should load from new draft
      expect(result.current.values).toEqual(storedDraft2.data);
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.draftStatus).toBe('saved_locally');
  });

  it('should clear draft and reset to initial values', async () => {
    const initialValues = { name: 'John', email: 'john@example.com' };
    const storedDraft = {
      data: { name: 'Jane', email: 'jane@example.com' },
      lastSavedAt: Date.now(),
    };

    vi.mocked(idbKeyval.get).mockResolvedValue(storedDraft);

    const { result } = renderHook(() =>
      usePersistentForm({
        storageKey: 'test-form',
        initialValues,
      })
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.values).toEqual(storedDraft.data);

    await act(async () => {
      await result.current.clearDraft();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftStatus).toBe('idle');
    expect(result.current.lastSavedAt).toBeNull();
    expect(idbKeyval.del).toHaveBeenCalledWith('test-form');
  });

  it('should persist changes after debounce period', async () => {
    const initialValues = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      usePersistentForm({
        storageKey: 'test-form',
        initialValues,
        debounceMs: 100, // Use shorter debounce for test
      })
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setValues({ name: 'Jane', email: 'jane@example.com' });
    });

    // Should not persist immediately
    expect(idbKeyval.set).not.toHaveBeenCalled();

    // Wait for debounce period + a bit more
    await waitFor(() => {
      expect(idbKeyval.set).toHaveBeenCalledWith('test-form', expect.objectContaining({
        data: { name: 'Jane', email: 'jane@example.com' },
      }));
    }, { timeout: 1000 });
  });

  it('should not persist when enabled is false', async () => {
    const initialValues = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      usePersistentForm({
        storageKey: 'test-form',
        initialValues,
        enabled: false,
      })
    );

    expect(result.current.hydrated).toBe(true);
    expect(result.current.values).toEqual(initialValues);
    expect(idbKeyval.get).not.toHaveBeenCalled();

    act(() => {
      result.current.setValues({ name: 'Jane', email: 'jane@example.com' });
    });

    expect(idbKeyval.set).not.toHaveBeenCalled();
  });
});
