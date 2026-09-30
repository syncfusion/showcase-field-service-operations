import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toEasternWallTime, fromEasternWallTime } from './time.ts';
test('Eastern wall times are independent of the machine timezone', () => {
  const date = toEasternWallTime('2026-09-15T15:00:00Z');
  assert.equal(date.getHours(), 11);
  assert.equal(fromEasternWallTime(date), '2026-09-15T15:00:00.000Z');
});
test('standard time uses the correct winter offset', () => {
  assert.equal(fromEasternWallTime(new Date(2026, 0, 15, 11, 0)), '2026-01-15T16:00:00.000Z');
});
test('nonexistent and ambiguous Eastern DST wall times are rejected', () => {
  assert.throws(() => fromEasternWallTime(new Date(2026, 2, 8, 2, 30)), /daylight|ambiguous/i);
  assert.throws(() => fromEasternWallTime(new Date(2026, 10, 1, 1, 30)), /daylight|ambiguous/i);
  assert.throws(() => fromEasternWallTime(new Date('invalid')), /valid/i);
});
