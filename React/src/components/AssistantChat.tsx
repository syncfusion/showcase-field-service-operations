import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { ButtonComponent, FabComponent } from '@syncfusion/ej2-react-buttons';
import { SidebarComponent } from '@syncfusion/ej2-react-navigations';
import { AIAssistViewComponent } from '@syncfusion/ej2-react-interactive-chat';
import type { PromptRequestEventArgs } from '@syncfusion/ej2-interactive-chat';
import type { Dataset } from '../../../../shared/contracts/domain.ts';
import { DeterministicAssistantProvider } from '../assistant/provider.ts';

const provider = new DeterministicAssistantProvider();
const FAB_ID = 'assistant-fab';
const PANEL_ID = 'assistant-panel';

// Assistant on every page: a Syncfusion Floating Action Button at the bottom right opens a right-side
// Syncfusion Sidebar holding the AI AssistView. The view mounts on first open and then stays mounted,
// so the conversation survives closing the panel and changing page.
export function AssistantChat({ dataset, initiallyOpen = false }: { dataset: Dataset; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [everOpened, setEverOpened] = useState(initiallyOpen);
  const assist = useRef<AIAssistViewComponent>(null);
  const controller = useRef<AbortController | null>(null);
  // The prompt handler reads the latest session data through a ref, so answers follow board changes.
  const latest = useRef(dataset);
  latest.current = dataset;
  const show = () => { setEverOpened(true); setOpen(true); };
  const hide = () => {
    setOpen(false);
    controller.current?.abort();
    // The button is hidden while the panel is open; wait for it to come back before focusing it.
    window.setTimeout(() => document.getElementById(FAB_ID)?.focus(), 50);
  };
  async function answer(args: PromptRequestEventArgs) {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    try { assist.current?.addPromptResponse(await provider.answer(args.prompt ?? '', latest.current, current.signal)); }
    catch (error) { if (!current.signal.aborted) assist.current?.addPromptResponse(error instanceof Error ? error.message : 'The sample response could not be created.'); }
  }
  // The chat button is drawn by Syncfusion; name it and tie it to the panel for assistive technology.
  useEffect(() => {
    const fab = document.getElementById(FAB_ID);
    if (!fab) return;
    fab.setAttribute('aria-label', 'Open AI assistant');
    fab.setAttribute('title', 'Open AI assistant');
    fab.setAttribute('aria-controls', PANEL_ID);
    fab.setAttribute('aria-expanded', String(open));
  });
  // Escape closes the panel wherever focus is, unless a dialog is open on top of the page. Listen in the
  // capture phase: the AssistView's prompt box handles Escape itself and stops it from bubbling.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('.e-dialog.e-popup-open')) hide();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);
  // On wide screens the open panel is pinned beside the page (styles.css reserves its width); controls
  // that measure their container re-measure on a window resize once the layout has settled.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-assistant-open', open);
    const timer = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => () => document.documentElement.removeAttribute('data-assistant-open'), []);
  return <>
    <FabComponent id={FAB_ID} iconCss="assistant-fab-icon" position="BottomRight" isPrimary visible={!open} onClick={show} />
    <SidebarComponent id={PANEL_ID} position="Right" type="Over" width="400px" isOpen={open} enableDock={false} showBackdrop={false} closeOnDocumentClick={false} enableGestures={false} zIndex={900} close={() => setOpen(false)} open={() => setOpen(true)}>
      <section className="assistant" aria-label="AI assistant">
        <header className="assistant-header"><h2>AI assistant</h2><span className="scope-label">Sample responses</span><ButtonComponent cssClass="icon-button assistant-close" aria-label="Close AI assistant" onClick={hide}><X size={17} /></ButtonComponent></header>
        <div className="assistant-body">{everOpened && <AIAssistViewComponent id="assistant-view" ref={assist} height="100%" width="100%" showHeader={false} promptSuggestions={['Summarize current workload', 'Which jobs await assignment?', 'Explain technician eligibility']} promptSuggestionsHeader="Try a sample question" promptRequest={answer} />}</div>
        <p className="assistant-note"><ShieldCheck size={16} aria-hidden="true" /><span>Grounded only in the current session. Deterministic sample provider through IoC: no external model call, browser model key, or automatic data change.</span></p>
      </section>
    </SidebarComponent>
  </>;
}
