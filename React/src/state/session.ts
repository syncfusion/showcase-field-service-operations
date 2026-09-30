import { parseDataset, type Dataset } from '../../../../shared/contracts/domain.ts';

export type RuntimeProfile = 'public' | 'customer';
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = 'syncfusion.field-service-operations.customer.v1';

function referenceFingerprint(dataset: Dataset): string {
  const { workOrders, ...reference } = dataset;
  // parseDataset returns a canonical object shape; work orders are the only mutable entities.
  return JSON.stringify(reference);
}

export function loadSession(baseline: Dataset, profile: RuntimeProfile, storage: StorageLike): {
  dataset: Dataset; warning: string | null; blocked: boolean;
} {
  const fresh = structuredClone(baseline);
  if (profile === 'public') return { dataset: fresh, warning: null, blocked: false };
  let saved: string | null;
  try {
    saved = storage.getItem(STORAGE_KEY);
  } catch {
    return { dataset: fresh, blocked: true, warning: 'Browser storage is unavailable. Editing is paused. Enable storage, then reset or reload to retry.' };
  }
  if (saved === null) return { dataset: fresh, warning: null, blocked: false };
  try {
    const restored = parseDataset(JSON.parse(saved));
    if (referenceFingerprint(restored) !== referenceFingerprint(baseline)) throw new Error('Incompatible baseline');
    return { dataset: structuredClone(restored), warning: null, blocked: false };
  } catch {
    return { dataset: fresh, blocked: true, warning: 'Saved customer data is invalid or belongs to a different fixture version. Editing is paused. Reset explicitly to replace it with the current baseline.' };
  }
}

export function saveSession(dataset: Dataset, profile: RuntimeProfile, storage: StorageLike): void {
  if (profile === 'public') return;
  try {
    const valid = parseDataset(dataset);
    storage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch {
    throw new Error('Changes were not saved. Browser storage may be unavailable or full, or the data is invalid. No edit has been confirmed.');
  }
}

export function commitSessionCommand(dataset: Dataset, profile: RuntimeProfile, storage: StorageLike, command: (snapshot: Dataset) => Dataset): Dataset {
  const next = command(structuredClone(dataset));
  saveSession(next, profile, storage);
  return next;
}

export function resetSession(baseline: Dataset, profile: RuntimeProfile, storage: StorageLike): Dataset {
  if (profile === 'customer') {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      throw new Error('Could not reset customer data. Enable browser storage and try again. Your existing data has not been replaced.');
    }
  }
  return structuredClone(baseline);
}
