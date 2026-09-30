import { summarize, type Dataset } from '../../../../shared/contracts/domain.ts';

export interface AssistantProvider { answer(prompt: string, dataset: Dataset, signal: AbortSignal): Promise<string>; }

export class DeterministicAssistantProvider implements AssistantProvider {
  async answer(prompt: string, dataset: Dataset, signal: AbortSignal): Promise<string> {
    if (signal.aborted) throw new Error('Assistant request canceled.');
    const query = prompt.toLowerCase();
    const totals = summarize(dataset);
    if (query.includes('workload') || query.includes('summary') || query.includes('unassigned')) {
      return `Sample response from the current session: ${totals.open} open work orders, ${totals.unassigned} awaiting assignment, ${totals.overdue} past due, and ${totals.completedToday} completed today.`;
    }
    if (query.includes('eligib') || query.includes('technician')) return 'Sample response: technician eligibility requires an enabled technician with the work order’s territory coverage and every required skill. Use Manage or Assign technician to apply the normal validation rules.';
    return 'This sample assistant can only answer current workload, assignment, and technician-eligibility questions from this session. It cannot contact customers, call an external model, or change data.';
  }
}
