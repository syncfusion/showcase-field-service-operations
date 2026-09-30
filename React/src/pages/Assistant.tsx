import { useRef } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { AIAssistViewComponent } from '@syncfusion/ej2-react-interactive-chat';
import type { PromptRequestEventArgs } from '@syncfusion/ej2-interactive-chat';
import type { Dataset } from '../../../../shared/contracts/domain.ts';
import { DeterministicAssistantProvider } from '../assistant/provider.ts';

const provider = new DeterministicAssistantProvider();
export function Assistant({ dataset }: { dataset: Dataset }) {
  const assist = useRef<AIAssistViewComponent>(null);
  const controller = useRef<AbortController | null>(null);
  async function answer(args: PromptRequestEventArgs) {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    try { assist.current?.addPromptResponse(await provider.answer(args.prompt ?? '', dataset, current.signal)); }
    catch (error) { if (!current.signal.aborted) assist.current?.addPromptResponse(error instanceof Error ? error.message : 'The sample response could not be created.'); }
  }
  return <section className="panel scope-box"><div className="inline"><Sparkles size={28}/><span className="scope-label">Sample responses</span></div><h2>AI assistant</h2><p className="muted">Grounded only in the current session—not an autonomous dispatcher.</p><AIAssistViewComponent ref={assist} promptSuggestions={['Summarize current workload', 'Which jobs await assignment?', 'Explain technician eligibility']} promptSuggestionsHeader="Try a sample question" promptRequest={answer}/><div className="notice"><ShieldCheck size={18} aria-hidden="true"/><p>Deterministic sample provider through IoC. No external model call, browser model key, or automatic data change.</p></div></section>;
}
