import { useState } from 'react';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { Search } from 'lucide-react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { type Dataset, type WorkOrder, type Status, statusLabels } from '../../../../shared/contracts/domain.ts';
import { WorkOrderGrid } from '../components/WorkOrderGrid.tsx';
export function WorkOrders({dataset,onAssign,onManage,onCreate,filter,setFilter,blocked}: {dataset:Dataset;onAssign:(job:WorkOrder)=>void;onManage:(job:WorkOrder)=>void;onCreate:()=>void;filter:string;setFilter:(value:string)=>void;blocked:boolean}) {
  const [search,setSearch] = useState('');
  const rows = dataset.workOrders.filter(job => {
    const active = ['Unscheduled','Scheduled','InProgress'].includes(job.status);
    const matches = filter==='all' || (filter==='open'&&active) || (filter==='unassigned'&&job.status==='Unscheduled') || (filter==='overdue'&&active&&job.dueAt<dataset.demoNow) || (filter==='completedToday'&&job.status==='Completed'&&new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York'}).format(new Date(job.completedAt!))===new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York'}).format(new Date(dataset.demoNow))) || job.status===filter;
    const site = dataset.sites.find(site=>site.id===job.siteId)?.name ?? '';
    const technician = dataset.technicians.find(tech=>tech.id===job.technicianId)?.name ?? 'unassigned';
    return matches && [job.id,job.title,job.territoryId,site,technician].join(' ').toLowerCase().includes(search.toLowerCase().trim());
  });
  // Only offer the status entries that actually occur in the current dataset,
  // so the dropdown never shows a status with zero matching work orders.
  const presentStatuses = new Set(dataset.workOrders.map(job => job.status));
  const filters = [{id:'all',label:'All work orders'},{id:'open',label:'Open work orders'},{id:'unassigned',label:'Awaiting assignment'},{id:'overdue',label:'Past due'},{id:'completedToday',label:'Completed today'},...Object.entries(statusLabels).filter(([id])=>presentStatuses.has(id as Status)).map(([id,label])=>({id,label}))];
  return <><section className="panel"><div className="toolbar">
    <div className="field"><label htmlFor="search-orders">Search work orders</label><TextBoxComponent id="search-orders" placeholder="ID, site, title or technician" input={args=>setSearch(args.value ?? '')}/></div>
    <div className="field"><label id="filter-label" htmlFor="filter-orders">Show</label><DropDownListComponent id="filter-orders" htmlAttributes={{'aria-labelledby':'filter-label'}} dataSource={filters} fields={{text:'label',value:'id'}} value={filter} change={args=>setFilter(String(args.value ?? 'all'))}/></div>
    <span className="toolbar-note" role="status">{rows.length} of {dataset.workOrders.length} work orders</span>
    <ButtonComponent cssClass="primary-button" disabled={blocked} onClick={onCreate}>New work order</ButtonComponent>
  </div>{rows.length ? <WorkOrderGrid dataset={dataset} rows={rows} onAssign={onAssign} onManage={onManage} blocked={blocked}/> : <div className="empty-state" role="status"><Search size={32}/><h2>No matching work orders</h2><p>Try another search or change the Show filter.</p></div>}</section>
  <p className="page-footnote">Public changes remain in this tab; customer-mode changes are saved only in this browser.</p></>;
}
