import { useEffect, useState, type MouseEvent } from 'react';
import { Activity, LayoutDashboard, ClipboardList, Columns3, Sparkles, Moon, Sun, RotateCcw, Menu } from 'lucide-react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import type { Status, WorkOrder } from '../../../shared/contracts/domain.ts';
import { useDataset } from './state/useDataset.ts';
import { applyTheme, type Theme } from './theme.ts';
import { AssignmentDialog } from './components/AssignmentDialog.tsx';
import { WorkOrderDialog } from './components/WorkOrderDialog.tsx';
import { Overview } from './pages/Overview.tsx';
import { WorkOrders } from './pages/WorkOrders.tsx';
import { Dispatch } from './pages/Dispatch.tsx';
import { Assistant } from './pages/Assistant.tsx';
import { getPublicBasePath } from './basePath.ts';

const routes = [
  {id:'overview',label:'Overview',title:'Operations overview',description:'Your service desk, in one clear view.',icon:LayoutDashboard},
  {id:'work-orders',label:'Work Orders',title:'Work orders',description:'Find the right job. Make the next move.',icon:ClipboardList},
  {id:'dispatch',label:'Dispatch Board',title:'Dispatch board',description:'Coordinate appointments by stage and technician.',icon:Columns3},
  {id:'assistant',label:'AI Assistant',title:'AI assistant',description:'Sample-data assistance, with a clear boundary.',icon:Sparkles},
] as const;
// Resolve the base path at runtime from the browser's pathname (runtime helper
// in basePath.ts) so a single build works both at the App Service root (/) and
// through the vanity mount path (/field-service-ops/react) without rebuilding.
// `getPublicBasePath` returns the mount path when the URL is under it, otherwise
// `/`, so `href` always emits a single slash before the route id and `readRoute`
// slices off the slash-terminated base for deep-link resolution.
const href = (id:string) => {
  const base = getPublicBasePath();
  return `${base}${base.endsWith('/') ? '' : '/'}${id}`;
};
const readRoute = () => {
  const base = getPublicBasePath();
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const path = location.pathname.startsWith(normalizedBase) ? location.pathname.slice(normalizedBase.length) : '';
  return path.replace(/\/$/,'') || 'overview';
};
export function App({initialTheme}: {initialTheme:Theme}) {
  const [route,setRoute] = useState(readRoute);
  const [theme,setTheme] = useState(initialTheme);
  const [themeBusy,setThemeBusy] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [selected,setSelected] = useState<WorkOrder|null>(null);
  const [managed,setManaged] = useState<WorkOrder|null|undefined>(undefined);
  const [filter,setFilter] = useState('all');
  const [resetOpen,setResetOpen] = useState(false);
  const [actionError,setActionError] = useState('');
  const data = useDataset();
  const current = routes.find(item=>item.id===route);
  useEffect(()=>{const pop=()=>{setRoute(readRoute());setSelected(null);};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[]);
  function navigate(id:string,event?:MouseEvent<HTMLAnchorElement>) {
    if (event&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)) return;
    event?.preventDefault(); history.pushState({},'',href(id)); setRoute(id);setMenuOpen(false);setSelected(null);
    requestAnimationFrame(()=>document.getElementById('main-heading')?.focus());
  }
  async function toggleTheme() {
    setThemeBusy(true);setActionError('');
    try {const next=theme==='light'?'dark':'light';await applyTheme(next);setTheme(next);} catch {setActionError('The theme could not be loaded. Please try again.');} finally {setThemeBusy(false);}
  }
  function moveDispatchWorkOrder(job:WorkOrder,target:Status) {
    setActionError('');
    try {
      if (job.status==='Unscheduled' && target==='Scheduled') { setSelected(job); return; }
      if (job.status==='Scheduled' && target==='Unscheduled') { data.unassign({id:job.id,expectedRevision:job.revision}); return; }
      if (job.status==='Scheduled' && target==='InProgress') { data.start({id:job.id,expectedRevision:job.revision}); return; }
      if (job.status==='InProgress' && target==='Completed') { data.complete({id:job.id,expectedRevision:job.revision,completionSummary:'Completed from the dispatch board.'}); return; }
      if (target==='Canceled' && !['Completed','Canceled'].includes(job.status)) { data.cancel({id:job.id,expectedRevision:job.revision}); return; }
      throw new Error(`Dragging ${job.status} work to ${target} is not a valid lifecycle change.`);
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : 'The dispatch board could not apply that change.'); }
  }
  const navigation = <nav className="navigation" aria-label="Main navigation">{routes.map(({id,label,icon:Icon})=><a key={id} href={href(id)} aria-current={route===id?'page':undefined} onClick={event=>navigate(id,event)}><Icon size={18} aria-hidden="true"/>{label}</a>)}</nav>;
  return <><a className="skip-link" href="#main-content" onClick={()=>requestAnimationFrame(()=>document.getElementById('main-heading')?.focus())}>Skip to content</a><div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-icon"><Activity size={24}/></span><div><strong>FIELD SERVICE</strong><small>Operations workspace</small></div></div><div><div className="nav-label">Workspace</div>{navigation}</div><div className="sidebar-footer"><strong>Built with Syncfusion</strong><p>React · JSON data</p><span className="prototype-tag">SYNTHETIC DATA</span></div></aside>
    <div className="workspace"><header className="topbar"><div className="topbar-left"><ButtonComponent cssClass="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMenuOpen(true)}><Menu size={18}/></ButtonComponent><span className="muted">Workspace / <strong>{current?.label ?? 'Not found'}</strong></span></div><div className="topbar-actions"><div className="demo-clock"><strong>Demo time · Sep 15, 2026</strong>9:00 AM · America/New_York</div><span className="profile-pill">{__APP_PROFILE__==='public'?'Private session':'Browser-local data'}</span><ButtonComponent cssClass="icon-button" aria-label={`Switch to ${theme==='light'?'dark':'light'} theme`} disabled={themeBusy} onClick={toggleTheme}>{theme==='light'?<Moon size={17}/>:<Sun size={17}/>}</ButtonComponent><ButtonComponent cssClass="icon-button" aria-label="Reset sample data" disabled={!data.dataset} onClick={()=>setResetOpen(true)}><RotateCcw size={17}/></ButtonComponent></div></header>
      <main id="main-content" className="page-content"><div className="page-heading"><div><div className="eyebrow">Field Service Operations</div><h1 id="main-heading" tabIndex={-1}>{current?.title ?? 'Page not found'}</h1><p>{current?.description ?? 'Choose a page from the workspace navigation.'}</p></div></div>
        {actionError&&<div className="notice error" role="alert">{actionError}</div>}
        {data.warning&&<div className="notice error" role="alert">{data.warning}</div>}
        {data.notice&&<div className="notice success" role="status">{data.notice}</div>}
        {data.error ? <section className="panel empty-state" role="alert"><h2>Unable to load sample data</h2><p>{data.error}</p><ButtonComponent cssClass="primary-button" onClick={data.retry}>Retry loading</ButtonComponent></section> : !data.dataset ? <section aria-busy="true" aria-label="Loading sample data"><div className="skeleton skeleton-title"/><div className="skeleton"/><p role="status">Loading sample data…</p></section> : <>
          {route==='overview'&&<Overview dataset={data.dataset} theme={theme} onFilter={value=>{setFilter(value);navigate('work-orders');}} onAssign={setSelected} blocked={data.blocked}/>}
          {route==='work-orders'&&<WorkOrders dataset={data.dataset} filter={filter} setFilter={setFilter} onAssign={setSelected} onManage={setManaged} onCreate={()=>setManaged(null)} blocked={data.blocked}/>}
          {route==='dispatch'&&<Dispatch dataset={data.dataset} onAssign={setSelected} onStatusChange={moveDispatchWorkOrder} blocked={data.blocked}/>}
          {route==='assistant'&&<Assistant dataset={data.dataset}/>}
        </>}
        <p className="page-footnote">{__APP_PROFILE__==='public'?'Changes stay in this tab. Reload or reset restores the original JSON data.':'Customer preview: assignments persist in this browser only, not a shared database.'} Demo clock: September 15, 2026, 9:00 AM Eastern.</p>
      </main></div></div>
      {menuOpen&&<DialogComponent header="Workspace navigation" visible isModal showCloseIcon width="300px" target="#root" close={()=>setMenuOpen(false)} animationSettings={{effect:'None'}}>{navigation}</DialogComponent>}
      {selected&&data.dataset&&<AssignmentDialog dataset={data.dataset} job={selected} onClose={()=>setSelected(null)} onSave={data.assign}/>}
      {managed!==undefined&&data.dataset&&<WorkOrderDialog dataset={data.dataset} job={managed} onClose={()=>setManaged(undefined)} onAssign={job=>{setManaged(undefined);setSelected(job);}} onCreate={data.create} onEdit={data.edit} onUnassign={data.unassign} onStart={data.start} onComplete={data.complete} onCancel={data.cancel} onRemove={data.remove}/>}
      {resetOpen&&<DialogComponent header="Reset sample data?" visible isModal showCloseIcon width="440px" target="#root" close={()=>setResetOpen(false)} animationSettings={{effect:'None'}}><p>This replaces your {__APP_PROFILE__==='public'?'current tab changes':'saved browser-local changes'} with the original synthetic dataset. It does not affect any database.</p><div className="form-actions"><ButtonComponent cssClass="action-button" onClick={()=>setResetOpen(false)}>Keep changes</ButtonComponent><ButtonComponent cssClass="primary-button" onClick={()=>{try{data.reset();setResetOpen(false);setActionError('');}catch(error){setActionError(error instanceof Error?error.message:'Reset failed.');setResetOpen(false);}}}>Reset demo</ButtonComponent></div></DialogComponent>}
    </>;
}
