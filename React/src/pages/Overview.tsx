import type { KeyboardEvent } from 'react';
import { useRef } from 'react';
import { ClipboardList, UserRound, Clock3, CircleCheck } from 'lucide-react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, Category, Tooltip, DataLabel } from '@syncfusion/ej2-react-charts';
import { GridComponent, ColumnsDirective, ColumnDirective, Inject as GridInject, Sort } from '@syncfusion/ej2-react-grids';
import { summarize, statusLabels, type Dataset, type WorkOrder } from '../../../../shared/contracts/domain.ts';
import { WorkOrderGrid } from '../components/WorkOrderGrid.tsx';
export function Overview({dataset,theme,onFilter,onAssign,blocked}: {dataset:Dataset;theme:'light'|'dark';onFilter:(filter:string)=>void;onAssign:(job:WorkOrder)=>void;blocked:boolean}) {
  const totals = summarize(dataset);
  const chartRef = useRef<ChartComponent | null>(null);
  // The chart panel's height resolves via CSS flex AFTER the chart mounts, so
  // Syncfusion measures a stale container height on first render and bakes a
  // small SVG. Refreshing once on `loaded` forces a re-measure against the now-
  // settled layout, so the chart fills the panel without needing a user zoom.
  const refreshChartOnLoad = () => {
    requestAnimationFrame(() => { chartRef.current?.refresh(); });
  };
  const metrics = [{key:'open',label:'Open work orders',note:'Across all active stages',icon:ClipboardList},{key:'unassigned',label:'Awaiting assignment',note:'Ready for the dispatch desk',icon:UserRound},{key:'overdue',label:'Past due',note:'Open jobs before demo time',icon:Clock3},{key:'completedToday',label:'Completed today',note:'September 15 · Eastern',icon:CircleCheck}] as const;
  const chart = Object.entries(statusLabels).map(([status,label])=>({label,count:dataset.workOrders.filter(job=>job.status===status).length}));
  const technicianWorkload = dataset.technicians.map(technician => ({
    id: technician.id,
    name: technician.name,
    territory: technician.territoryIds.join(' / '),
    availability: technician.enabled ? 'Available' : 'Unavailable',
    activeJobs: dataset.workOrders.filter(job => job.technicianId===technician.id && ['Scheduled','InProgress'].includes(job.status)).length,
  }));
  function activateMetric(event: KeyboardEvent<HTMLElement>, key: typeof metrics[number]['key']) {
    if (event.key==='Enter' || event.key===' ') { event.preventDefault(); onFilter(key); }
  }
  return <>
    <div className="metrics">{metrics.map(({key,label,note,icon:Icon})=><section key={key} className="e-card metric metric-interactive" role="button" tabIndex={0} aria-label={`${label}: ${totals[key]}. View work orders`} onClick={()=>onFilter(key)} onKeyDown={event=>activateMetric(event,key)}><div className="e-card-content"><span className="metric-label">{label}</span><span className="metric-icon" aria-hidden="true"><Icon size={17}/></span><span className="metric-number" data-testid={`metric-${key}`}>{totals[key]}</span><span className="metric-note">{note}</span></div></section>)}</div>
    <div className="overview-grid"><section className="panel" aria-labelledby="workload-heading"><div className="panel-heading"><div><h2 id="workload-heading">Workload at a glance</h2><p>All {dataset.workOrders.length} work orders · current session</p></div></div><div className="chart-wrap">
      <ChartComponent key={theme} ref={chartRef} id="workload-chart" height="100%" loaded={refreshChartOnLoad} theme={theme==='dark'?'Tailwind3Dark':'Tailwind3'} background="transparent" primaryXAxis={{valueType:'Category',majorGridLines:{width:0},labelIntersectAction:'Wrap'}} primaryYAxis={{minimum:0,interval:5,title:'Work orders',lineStyle:{width:0},majorTickLines:{width:0}}} chartArea={{border:{width:0}}} tooltip={{enable:true}} legendSettings={{visible:false}}>
        <Inject services={[ColumnSeries,Category,Tooltip,DataLabel]}/><SeriesCollectionDirective><SeriesDirective dataSource={chart} type="Column" xName="label" yName="count" name="Work orders" fill="var(--chart-series-primary)" cornerRadius={{topLeft:3,topRight:3}} marker={{dataLabel:{visible:true,position:'Top'}}} animation={{enable:false}}/></SeriesCollectionDirective>
      </ChartComponent>
    </div></section><section className="panel" aria-labelledby="technician-workload-heading"><div className="panel-heading"><div><h2 id="technician-workload-heading">Technician workload</h2><p>Scheduled and in-progress appointments</p></div></div><div className="grid-scroll"><GridComponent id="technician-workload-grid" dataSource={technicianWorkload} allowSorting enableHtmlSanitizer rowHeight={52} width="100%" gridLines="Horizontal" aria-label="Technician workload"><ColumnsDirective><ColumnDirective field="name" headerText="Technician" width="150"/><ColumnDirective field="territory" headerText="Territory" width="120"/><ColumnDirective field="availability" headerText="Availability" width="120"/><ColumnDirective field="activeJobs" headerText="Active jobs" textAlign="Left" width="100"/></ColumnsDirective><GridInject services={[Sort]}/></GridComponent></div></section></div>
    <section className="panel"><div className="panel-heading"><div><h2>Ready to dispatch</h2><p>Start with the next unassigned appointments</p></div><ButtonComponent cssClass="action-button" onClick={()=>onFilter('unassigned')}>View all</ButtonComponent></div><WorkOrderGrid dataset={dataset} rows={dataset.workOrders.filter(job=>job.status==='Unscheduled').slice(0,4)} compact onAssign={onAssign} blocked={blocked}/></section>
    <p className="page-footnote">Metrics use the complete current dataset, not a filtered page. All names and appointments are synthetic.</p>
  </>;
}
