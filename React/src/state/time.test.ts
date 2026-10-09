import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addHours, fromPickerDate, toPickerDate } from './time.ts';
test('picker dates round-trip to the same UTC instant in the viewer zone', () => {
  const date = toPickerDate('2026-09-15T15:00:00Z');
  assert.equal(date.getTime(), Date.UTC(2026, 8, 15, 15));
  assert.equal(fromPickerDate(date), '2026-09-15T15:00:00.000Z');
});
test('invalid picker values are rejected', () => {
  assert.throws(() => fromPickerDate(new Date('invalid')), /valid/i);
});
test('addHours offsets an instant by whole or half hours', () => {
  assert.equal(addHours('2026-09-15T13:00:00Z', 1.5), '2026-09-15T14:30:00.000Z');
});
