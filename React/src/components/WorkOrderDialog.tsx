import { useState } from 'react';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { DateTimePickerComponent } from '@syncfusion/ej2-react-calendars';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import type { CompleteWorkOrderCommand, Dataset, EditWorkOrderCommand, RevisionCommand, WorkOrder, WorkOrderDraft } from '../../../../shared/contracts/domain.ts';
import { fromEasternWallTime, toEasternWallTime } from '../state/time.ts';

const skills = ['printer', 'meeting-room', 'workstation'] as const;

export function WorkOrderDialog({ dataset, job, onClose, onAssign, onCreate, onEdit, onUnassign, onStart, onComplete, onCancel, onRemove }: {
  dataset: Dataset; job: WorkOrder | null; onClose: () => void; onAssign: (job: WorkOrder) => void;
  onCreate: (command: WorkOrderDraft) => void; onEdit: (command: EditWorkOrderCommand) => void; onUnassign: (command: RevisionCommand) => void;
  onStart: (command: RevisionCommand) => void; onComplete: (command: CompleteWorkOrderCommand) => void; onCancel: (command: RevisionCommand) => void; onRemove: (command: RevisionCommand) => void;
}) {
  const isNew = job === null;
  const [id, setId] = useState(job?.id ?? 'WO-C-001');
  const [title, setTitle] = useState(job?.title ?? '');
  const [siteId, setSiteId] = useState(job?.siteId ?? dataset.sites[0]!.id);
  const [priority, setPriority] = useState<WorkOrderDraft['priority']>(job?.priority ?? 'Normal');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(job?.requiredSkills ?? ['printer']);
  const [dueAt, setDueAt] = useState<Date | undefined>(toEasternWallTime(job?.dueAt ?? '2026-09-15T20:00:00Z'));
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const editable = isNew || job?.status === 'Unscheduled' || job?.status === 'Scheduled';
  const revision = () => ({ id: job!.id, expectedRevision: job!.revision });
  const run = (action: () => void) => { try { action(); onClose(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'The work order could not be changed.'); } };
  function save() {
    if (!dueAt) { setError('Enter a valid due time.'); return; }
    const draft = { id, title, siteId, requiredSkills: requiredSkills as WorkOrderDraft['requiredSkills'], priority: priority as WorkOrderDraft['priority'], dueAt: fromEasternWallTime(dueAt) };
    run(() => isNew ? onCreate(draft) : onEdit({ ...draft, expectedRevision: job!.revision }));
  }
  return <DialogComponent header={isNew ? 'New work order' : `Manage ${job!.id}`} visible isModal showCloseIcon width="620px" target="#root" close={onClose} animationSettings={{ effect: 'None' }}>
    <div role="form" aria-label={isNew ? 'New work order' : `Manage ${job!.id}`}>
      <div className="form-grid">
        <div className="field"><label htmlFor="work-order-id">Work order ID</label><TextBoxComponent id="work-order-id" value={id} enabled={isNew} input={args => setId(args.value ?? '')} /></div>
        <div className="field"><label id="priority-label" htmlFor="work-order-priority">Priority</label><DropDownListComponent id="work-order-priority" value={priority} enabled={editable} dataSource={['Low', 'Normal', 'High']} htmlAttributes={{ 'aria-labelledby': 'priority-label' }} change={args => setPriority(String(args.value ?? 'Normal') as WorkOrderDraft['priority'])} /></div>
        <div className="field full"><label htmlFor="work-order-title">Title</label><TextBoxComponent id="work-order-title" value={title} enabled={editable} input={args => setTitle(args.value ?? '')} /></div>
        <div className="field"><label id="site-label" htmlFor="work-order-site">Site</label><DropDownListComponent id="work-order-site" value={siteId} enabled={editable} dataSource={dataset.sites.map(site => ({ id: site.id, name: site.name }))} fields={{ text: 'name', value: 'id' }} htmlAttributes={{ 'aria-labelledby': 'site-label' }} change={args => setSiteId(String(args.value ?? ''))} /></div>
        <div className="field"><label htmlFor="work-order-due">Due time (Eastern)</label><DateTimePickerComponent id="work-order-due" value={dueAt} enabled={editable} format="MM/dd/yyyy hh:mm a" step={30} change={args => setDueAt(args.value ?? undefined)} /></div>
        <div className="field full"><span className="field-label">Required skills</span><div className="skill-actions">{skills.map(skill => <ButtonComponent key={skill} type="button" cssClass="action-button" aria-pressed={requiredSkills.includes(skill)} disabled={!editable} onClick={() => setRequiredSkills(current => current.includes(skill) ? current.filter(value => value !== skill) : [...current, skill])}>{skill}</ButtonComponent>)}</div></div>
        {job?.status === 'InProgress' && <div className="field full"><label htmlFor="completion-summary">Completion summary</label><TextBoxComponent id="completion-summary" value={summary} multiline htmlAttributes={{ 'name': 'completion-summary', 'aria-label': 'Completion summary' }} input={args => setSummary(args.value ?? '')} /></div>}
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {confirmingDelete && <div className="notice error" role="alert"><p>Delete {job!.id}? This local work-order record cannot be recovered until you reset the sample data.</p><div className="form-actions"><ButtonComponent type="button" cssClass="action-button" onClick={() => setConfirmingDelete(false)}>Keep work order</ButtonComponent><ButtonComponent type="button" cssClass="primary-button" onClick={() => run(() => onRemove(revision()))}>Confirm delete</ButtonComponent></div></div>}
      <div className="form-actions"><ButtonComponent type="button" cssClass="action-button" onClick={onClose}>Close</ButtonComponent>
        {editable && <ButtonComponent type="button" cssClass="primary-button" onClick={save}>{isNew ? 'Create work order' : 'Save changes'}</ButtonComponent>}
        {!isNew && (job!.status === 'Unscheduled' || job!.status === 'Scheduled') && <ButtonComponent type="button" cssClass="action-button" onClick={() => onAssign(job!)}>{job!.status === 'Scheduled' ? 'Reschedule' : 'Assign technician'}</ButtonComponent>}
        {job?.status === 'Scheduled' && <><ButtonComponent type="button" cssClass="action-button" onClick={() => run(() => onUnassign(revision()))}>Return to Unscheduled</ButtonComponent><ButtonComponent type="button" cssClass="primary-button" onClick={() => run(() => onStart(revision()))}>Start work</ButtonComponent></>}
        {job?.status === 'InProgress' && <ButtonComponent type="button" cssClass="primary-button" onClick={() => run(() => onComplete({ ...revision(), completionSummary: summary }))}>Complete work</ButtonComponent>}
        {!isNew && !['Completed', 'Canceled'].includes(job!.status) && <ButtonComponent type="button" cssClass="action-button" onClick={() => run(() => onCancel(revision()))}>Cancel work order</ButtonComponent>}
        {!isNew && ['Unscheduled', 'Canceled'].includes(job!.status) && !confirmingDelete && <ButtonComponent type="button" cssClass="action-button" onClick={() => setConfirmingDelete(true)}>Delete work order</ButtonComponent>}
      </div>
    </div>
  </DialogComponent>;
}
