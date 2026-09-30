import { GridComponent, ColumnsDirective, ColumnDirective, Inject, Page, Sort } from '@syncfusion/ej2-react-grids';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { statusLabels, type Dataset, type WorkOrder } from '../../../../shared/contracts/domain.ts';
import { formatDate } from '../state/time.ts';
export function StatusBadge({job}: {job:WorkOrder}) { return <span className="status-badge" data-status={job.status}>{statusLabels[job.status]}</span>; }
export function WorkOrderGrid({dataset,rows,onAssign,onManage,blocked=false,compact=false}: {dataset:Dataset;rows:WorkOrder[];onAssign:(job:WorkOrder)=>void;onManage?:(job:WorkOrder)=>void;blocked?:boolean;compact?:boolean}) {
  const data = rows.map(job=>({...job,siteName:dataset.sites.find(site=>site.id===job.siteId)?.name,technicianName:dataset.technicians.find(tech=>tech.id===job.technicianId)?.name ?? 'Unassigned'}));
  return <div className="grid-scroll"><GridComponent dataSource={data} allowPaging={!compact} pageSettings={{pageSize:8}} allowSorting enableHtmlSanitizer rowHeight={compact?80:72} width="100%" gridLines="Horizontal" aria-label="Work orders">
    <ColumnsDirective>
      <ColumnDirective field="id" headerText="Work order" width="260" template={(job:WorkOrder)=><div className="work-order-cell"><span className="job-title">{job.title}</span><span className="job-subtitle">{job.id} · {job.territoryId}</span></div>} />
      <ColumnDirective field="siteName" headerText="Site" width="160" />
      <ColumnDirective field="status" headerText="Status" width="140" template={(job:WorkOrder)=><StatusBadge job={job}/>} />
      {!compact && <ColumnDirective field="technicianName" headerText="Technician" width="160" />}
      {!compact && <ColumnDirective field="dueAt" headerText="Due · Eastern" width="175" template={(job:WorkOrder)=><span>{formatDate(job.dueAt)}</span>} />}
      <ColumnDirective headerText="Action" width="136" allowSorting={false} template={(job:WorkOrder)=><div className="grid-actions">{['Unscheduled','Scheduled'].includes(job.status) && <ButtonComponent cssClass="action-button" disabled={blocked} aria-label={`Assign ${job.id}`} onClick={()=>onAssign(job)}>{job.status==='Scheduled'?'Reschedule':'Assign'}</ButtonComponent>}{onManage && <ButtonComponent cssClass="action-button" disabled={blocked} aria-label={`Manage ${job.id}`} onClick={()=>onManage(job)}>Manage</ButtonComponent>}</div>} />
    </ColumnsDirective><Inject services={[Page,Sort]}/>
  </GridComponent></div>;
}
