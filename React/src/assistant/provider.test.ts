import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseDataset } from '../../../../shared/contracts/domain.ts';
import { DeterministicAssistantProvider } from './provider.ts';

const dataset = () => parseDataset(JSON.parse(readFileSync(new URL('../../../../shared/fixtures/work-orders.json', import.meta.url), 'utf8')));

test('deterministic assistant summarizes the current snapshot without an external model', async () => {
  const answer = await new DeterministicAssistantProvider().answer('Summarize current workload', dataset(), new AbortController().signal);
  assert.match(answer, /24 open work orders/i);
  assert.match(answer, /10 awaiting assignment/i);
});

test('deterministic assistant rejects unsupported prompts and honors cancellation', async () => {
  const provider = new DeterministicAssistantProvider();
  assert.match(await provider.answer('Write a customer email', dataset(), new AbortController().signal), /can only answer/i);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(provider.answer('Summarize workload', dataset(), controller.signal), /canceled/i);
});
