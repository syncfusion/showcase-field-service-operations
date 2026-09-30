import { useState } from 'react';
import { KanbanComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-kanban';
import type { DragEventArgs } from '@syncfusion/ej2-kanban';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { statusLabels, type Dataset, type Status, type WorkOrder } from '../../../../shared/contracts/domain.ts';
import { StatusBadge } from '../components/WorkOrderGrid.tsx';
import { formatDate } from '../state/time.ts';
export function Dispatch({dataset,onAssign,onStatusChange,blocked}: {dataset:Dataset;onAssign:(job:WorkOrder)=>void;onStatusChange:(job:WorkOrder,target:Status)=>void;blocked:boolean}) {
  const [technician,setTechnician] = useState('all');
  const rows = dataset.workOrders.filter(job=>technician==='all'||job.technicianId===technician||(technician==='unassigned'&&!job.technicianId)).map(job=>({...job,technicianName:dataset.technicians.find(tech=>tech.id===job.technicianId)?.name ?? 'Unassigned'}));
  function dragStop(args: DragEventArgs) {
    // Syncfusion updates its in-memory data before this callback. React remains
    // the source of truth, so cancel that update and commit a validated command.
    args.cancel = true;
    const moved = args.data[0] as Partial<WorkOrder> | undefined;
    const job = moved?.id ? dataset.workOrders.find(item=>item.id===moved.id) : undefined;
    const target = moved?.status;
    if (!job || !target || target===job.status || !(target in statusLabels)) return;
    onStatusChange(job,target as Status);
  }
  return <><section className="panel"><div className="toolbar"><div className="field"><label htmlFor="board-technician">Technician</label><DropDownListComponent id="board-technician" value={technician} dataSource={[{id:'all',name:'All technicians'},{id:'unassigned',name:'Unassigned'},...dataset.technicians.map(({id,name})=>({id,name}))]} fields={{text:'name',value:'id'}} change={args=>setTechnician(String(args.value ?? 'all'))}/></div><span className="toolbar-note">Manual dispatch · {rows.length} appointments</span></div>
    {!rows.length ? <div className="empty-state" role="status"><h2>No appointments assigned</h2><p>Select another technician or assign a work order.</p></div> : <div className="board-scroll"><KanbanComponent id="dispatch-board" keyField="status" dataSource={rows} allowDragAndDrop={!blocked} dragStop={dragStop} dialogOpen={args=>{args.cancel=true;}} swimlaneSettings={{keyField:'technicianName',allowDragAndDrop:false,showEmptyRow:false}} cardSettings={{headerField:'id',contentField:'title',template:(job:WorkOrder)=><div className="board-card" data-testid={`card-${job.id}`}><span className="board-id">{job.id} · {job.territoryId}</span><h3>{job.title}</h3><StatusBadge job={job}/><p>{dataset.sites.find(site=>site.id===job.siteId)?.name}</p><p>{job.scheduledStart?formatDate(job.scheduledStart):'No appointment yet'}</p>{['Unscheduled','Scheduled'].includes(job.status)&&<ButtonComponent cssClass="action-button" disabled={blocked} onClick={()=>onAssign(job)} aria-label={`Assign ${job.id}`}>{job.status==='Scheduled'?'Reschedule':'Assign technician'}</ButtonComponent>}</div>}}>
      <ColumnsDirective>{Object.entries(statusLabels).map(([status,label])=><ColumnDirective key={status} headerText={label} keyField={status}/>)}</ColumnsDirective>
    </KanbanComponent></div>}
  </section><p className="page-footnote">Drag a card to make a validated lifecycle change. Moving Unscheduled work to Scheduled opens the assignment form; swimlane changes remain unavailable.</p></>;
}
