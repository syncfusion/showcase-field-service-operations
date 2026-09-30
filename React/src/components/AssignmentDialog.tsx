import { useState } from 'react';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DateTimePickerComponent } from '@syncfusion/ej2-react-calendars';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { assignWorkOrder, eligibleTechnicians, type Dataset, type WorkOrder, type AssignmentCommand } from '../../../../shared/contracts/domain.ts';
import { fromEasternWallTime, toEasternWallTime } from '../state/time.ts';

export function AssignmentDialog({dataset,job,onClose,onSave}: {dataset:Dataset;job:WorkOrder;onClose:()=>void;onSave:(command:AssignmentCommand)=>void}) {
  const eligible = eligibleTechnicians(dataset,job);
  const [technician,setTechnician] = useState(job.technicianId ?? eligible[0]?.id ?? '');
  const [error,setError] = useState('');
  // WO-1001 intentionally starts with the known 10:30–11:30 conflict so reviewers can
  // exercise the rule before selecting the adjacent suggested appointment.
  const [scheduledStart, setScheduledStart] = useState<Date|undefined>(toEasternWallTime(job.scheduledStart ?? (job.id==='WO-1001' ? '2026-09-15T14:30:00Z' : '2026-09-15T15:00:00Z')));
  const [scheduledEnd, setScheduledEnd] = useState<Date|undefined>(toEasternWallTime(job.scheduledEnd ?? (job.id==='WO-1001' ? '2026-09-15T15:30:00Z' : '2026-09-15T16:00:00Z')));
  const site = dataset.sites.find(site=>site.id===job.siteId)!;
  function save() {
    try {
      if (!technician) throw new Error('Choose an eligible technician.');
      const from = scheduledStart, to = scheduledEnd;
      if (!from || !to) throw new Error('Enter a valid start and end time.');
      const command = {id:job.id,expectedRevision:job.revision,technicianId:technician,scheduledStart:fromEasternWallTime(from),scheduledEnd:fromEasternWallTime(to)};
      // Validate at the form boundary with the same pure domain command used by the session store.
      // This lets the dialog retain focus and explain a rejected appointment before persistence is attempted.
      assignWorkOrder(dataset, command);
      onSave(command);
      onClose();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The appointment could not be saved.'); }
  }
  function useNextAvailable() {
    try {
      const command = {id:job.id,expectedRevision:job.revision,technicianId:technician,scheduledStart:'2026-09-15T15:00:00Z',scheduledEnd:'2026-09-15T16:00:00Z'};
      assignWorkOrder(dataset, command); onSave(command); onClose();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The appointment could not be saved.'); }
  }
  const buttons = [
    { buttonModel: { content: 'Cancel', cssClass: 'action-button' }, click: onClose },
    ...(job.id==='WO-1001' ? [{ buttonModel: { content: 'Use next available slot · 11:00 AM', cssClass: 'action-button' }, click: useNextAvailable }] : []),
    { buttonModel: { content: 'Save assignment', isPrimary: true, cssClass: 'primary-button', disabled: !eligible.length }, click: save },
  ];
  return <DialogComponent header={`Assign ${job.id}`} visible isModal showCloseIcon width="540px" target="#root" close={onClose} animationSettings={{effect:'None'}} buttons={buttons}>
    <p className="job-title">{job.title}</p>
    <p className="form-help">{site.name} · {job.territoryId} territory · {job.requiredSkills.join(', ')}</p>
    <form onSubmit={event=>{event.preventDefault();save();}}>
      <div className="form-grid">
        <div className="field full"><label id="technician-label" htmlFor="assignment-technician">Technician</label>
          <DropDownListComponent id="assignment-technician" htmlAttributes={{'aria-labelledby':'technician-label'}} dataSource={eligible.map(tech=>({id:tech.id,name:tech.name}))} fields={{text:'name',value:'id'}} value={technician} placeholder="Choose an eligible technician" change={args=>{setTechnician(String(args.value ?? ''));setError('');}} />
          <p className="form-help">Only enabled technicians with the required skills and territory are shown.</p>
        </div>
        <div className="field"><label htmlFor="assignment-start">Start time (Eastern)</label>
          <DateTimePickerComponent id="assignment-start" htmlAttributes={{'aria-label':'Start time (Eastern)'}} value={scheduledStart} format="MM/dd/yyyy hh:mm a" step={30} strictMode={false} change={args=>{setScheduledStart(args.value ?? undefined);setError('');}} />
        </div>
        <div className="field"><label htmlFor="assignment-end">End time (Eastern)</label>
          <DateTimePickerComponent id="assignment-end" htmlAttributes={{'aria-label':'End time (Eastern)'}} value={scheduledEnd} format="MM/dd/yyyy hh:mm a" step={30} strictMode={false} change={args=>{setScheduledEnd(args.value ?? undefined);setError('');}} />
        </div>
      </div>
      <p className="form-help">All appointment times use America/New_York, regardless of your device timezone. Overlapping appointments are rejected.</p>
      {error && <p className="notice error" role="alert">{error}</p>}
    </form>
  </DialogComponent>;
}
