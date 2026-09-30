import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseDataset, type Dataset } from '../../../../shared/contracts/domain.ts';
import { commitSessionCommand, loadSession, resetSession, saveSession, STORAGE_KEY, type StorageLike } from './session.ts';

function baseline(): Dataset {
  return parseDataset(JSON.parse(readFileSync(new URL('../../../../shared/fixtures/work-orders.json', import.meta.url), 'utf8')));
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const items = new Map(Object.entries(initial));
  return {
    getItem: key => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value); },
    removeItem: key => { items.delete(key); },
  };
}

const inaccessibleStorage: StorageLike = {
  getItem() { throw new Error('private internal storage failure'); },
  setItem() { throw new Error('private internal storage failure'); },
  removeItem() { throw new Error('private internal storage failure'); },
};

test('public load, save and reset never access persistence and each tab receives a clone', () => {
  const original = baseline();
  const first = loadSession(original, 'public', inaccessibleStorage);
  const second = loadSession(original, 'public', inaccessibleStorage);
  assert.equal(first.blocked, false);
  assert.equal(first.warning, null);
  first.dataset.workOrders[0].title = 'Private tab change';
  assert.deepEqual(second.dataset, original);
  assert.doesNotThrow(() => saveSession(first.dataset, 'public', inaccessibleStorage));
  const reset = resetSession(original, 'public', inaccessibleStorage);
  assert.deepEqual(reset, original);
  assert.notEqual(reset, original);
  assert.notEqual(reset.workOrders, original.workOrders);
});

test('customer without a snapshot gets a fresh baseline without a persistence write', () => {
  const original = baseline();
  const storage = memoryStorage();
  const restored = loadSession(original, 'customer', storage);
  assert.deepEqual(restored, { dataset: original, warning: null, blocked: false });
  assert.notEqual(restored.dataset, original);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('customer valid snapshot survives reload and does not modify the immutable baseline', () => {
  const original = baseline();
  const changed = structuredClone(original);
  const job = changed.workOrders.find(workOrder => workOrder.status === 'Unscheduled')!;
  job.title = 'Customer-only appointment';
  job.revision += 1;
  const storage = memoryStorage();
  saveSession(changed, 'customer', storage);
  const restored = loadSession(original, 'customer', storage);
  assert.equal(restored.blocked, false);
  assert.equal(restored.warning, null);
  assert.deepEqual(restored.dataset, changed);
  assert.notEqual(restored.dataset, changed);
  assert.notDeepEqual(restored.dataset, original);
});

test('malformed customer snapshot is retained, with editing blocked until explicit reset', () => {
  const original = baseline();
  for (const invalid of ['{ broken', 'null', '{}', '[]', '']) {
    const storage = memoryStorage({ [STORAGE_KEY]: invalid });
    const result = loadSession(original, 'customer', storage);
    assert.equal(result.blocked, true);
    assert.match(result.warning!, /reset/i);
    assert.deepEqual(result.dataset, original);
    assert.equal(storage.getItem(STORAGE_KEY), invalid);
  }
});

test('storage-read failure shows a recoverable warning without leaking internal details', () => {
  const original = baseline();
  const result = loadSession(original, 'customer', inaccessibleStorage);
  assert.equal(result.blocked, true);
  assert.deepEqual(result.dataset, original);
  assert.match(result.warning!, /storage/i);
  assert.doesNotMatch(result.warning!, /private internal/);
});

test('schema, dataset identity and dataset revision mismatches cannot replay stale data', () => {
  const original = baseline();
  for (const field of ['schemaVersion', 'datasetId', 'datasetVersion'] as const) {
    const changed = JSON.parse(JSON.stringify(original));
    changed[field] = field === 'schemaVersion' ? 999 : 'other-dataset-revision';
    const raw = JSON.stringify(changed);
    const storage = memoryStorage({ [STORAGE_KEY]: raw });
    const result = loadSession(original, 'customer', storage);
    assert.equal(result.blocked, true, field);
    assert.deepEqual(result.dataset, original);
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('customer snapshots cannot replace technicians, sites or scenario metadata', () => {
  const original = baseline();
  const alterations = [
    (changed: Dataset) => { changed.technicians[0].name = 'Altered reference'; },
    (changed: Dataset) => { changed.sites[0].name = 'Altered reference'; },
    (changed: Dataset) => { changed.demoNow = '2026-09-16T13:00:00Z'; },
  ];
  for (const alter of alterations) {
    const changed = structuredClone(original);
    alter(changed);
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(changed) });
    const result = loadSession(original, 'customer', storage);
    assert.equal(result.blocked, true);
    assert.deepEqual(result.dataset, original);
  }
});

test('snapshot work-order references are validated, not only metadata', () => {
  const original = baseline();
  const changed = structuredClone(original);
  changed.workOrders[0].siteId = 'missing-site';
  const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(changed) });
  assert.equal(loadSession(original, 'customer', storage).blocked, true);
});

test('failed customer persistence throws a friendly error and leaves caller state unchanged', () => {
  const original = baseline();
  const previous = structuredClone(original);
  assert.throws(() => saveSession(original, 'customer', inaccessibleStorage), /not saved/i);
  assert.deepEqual(original, previous);
});

test('invalid customer dataset cannot overwrite an existing valid snapshot', () => {
  const original = baseline();
  const storage = memoryStorage();
  saveSession(original, 'customer', storage);
  const previous = storage.getItem(STORAGE_KEY);
  const invalid = structuredClone(original);
  invalid.workOrders[0].siteId = 'missing-site';
  assert.throws(() => saveSession(invalid, 'customer', storage), /not saved/i);
  assert.equal(storage.getItem(STORAGE_KEY), previous);
});

test('explicit customer reset removes only this app snapshot and returns a fresh baseline', () => {
  const original = baseline();
  const storage = memoryStorage({ [STORAGE_KEY]: 'broken', 'another-app': 'keep me' });
  const reset = resetSession(original, 'customer', storage);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('another-app'), 'keep me');
  assert.deepEqual(reset, original);
  assert.notEqual(reset, original);
  assert.equal(loadSession(original, 'customer', storage).blocked, false);
});

test('failed customer reset does not falsely return a successful reset', () => {
  assert.throws(() => resetSession(baseline(), 'customer', inaccessibleStorage), /could not reset/i);
});

test('a session command returns a validated next snapshot only after customer persistence succeeds', () => {
  const original = baseline();
  const storage = memoryStorage();
  const updated = commitSessionCommand(original, 'customer', storage, dataset => ({ ...dataset, workOrders: dataset.workOrders.map(job => job.id === 'WO-1001' ? { ...job, title: 'Updated only after save', revision: job.revision + 1 } : job) }));
  assert.equal(updated.workOrders[0]!.title, 'Updated only after save');
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)!).workOrders[0].title, 'Updated only after save');
  assert.throws(() => commitSessionCommand(original, 'customer', inaccessibleStorage, dataset => dataset), /not saved/i);
  assert.equal(original.workOrders[0]!.title, 'Configure reception printer');
});
