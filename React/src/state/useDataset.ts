import { useEffect, useState } from 'react';
import { assignWorkOrder, cancelWorkOrder, completeWorkOrder, createWorkOrder, deleteWorkOrder, editWorkOrder, parseDataset, startWorkOrder, unassignWorkOrder, type AssignmentCommand, type CompleteWorkOrderCommand, type Dataset, type EditWorkOrderCommand, type RevisionCommand, type WorkOrderDraft } from '../../../../shared/contracts/domain.ts';
import fixtureUrl from '../../../../shared/fixtures/work-orders.json?url';
import { commitSessionCommand, loadSession, resetSession, type StorageLike } from './session.ts';

const storage: StorageLike = { getItem: key => localStorage.getItem(key), setItem: (key,value) => localStorage.setItem(key,value), removeItem: key => localStorage.removeItem(key) };
export function useDataset() {
  const [baseline,setBaseline] = useState<Dataset|null>(null);
  const [dataset,setDataset] = useState<Dataset|null>(null);
  const [error,setError] = useState('');
  const [warning,setWarning] = useState('');
  const [blocked,setBlocked] = useState(false);
  const [attempt,setAttempt] = useState(0);
  const [notice,setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setDataset(null);
    fetch(fixtureUrl,{signal:controller.signal}).then(async response => {
      if (!response.ok) throw new Error('Fixture unavailable');
      const fresh = parseDataset(await response.json());
      if (controller.signal.aborted) return;
      const loaded = loadSession(fresh,__APP_PROFILE__,storage);
      setBaseline(fresh); setDataset(loaded.dataset); setWarning(loaded.warning ?? ''); setBlocked(loaded.blocked);
    }).catch(() => { if (!controller.signal.aborted) setError('The sample data could not be loaded or validated. Check the fixture and try again.'); });
    return () => controller.abort();
  },[attempt]);
  function commit(command: (snapshot: Dataset) => Dataset, notice: string) {
    if (!dataset || blocked) throw new Error('Editing is paused. Reset the saved sample data before continuing.');
    const next = commitSessionCommand(dataset, __APP_PROFILE__, storage, command);
    setDataset(next);
    setNotice(`${notice} ${__APP_PROFILE__ === 'public' ? 'Updated in this tab only.' : 'Saved in this browser.'}`);
  }
  function assign(command: AssignmentCommand) { commit(snapshot => assignWorkOrder(snapshot, command), `${command.id} scheduled.`); }
  function create(command: WorkOrderDraft) { commit(snapshot => createWorkOrder(snapshot, command), `${command.id} created.`); }
  function edit(command: EditWorkOrderCommand) { commit(snapshot => editWorkOrder(snapshot, command), `${command.id} updated.`); }
  function unassign(command: RevisionCommand) { commit(snapshot => unassignWorkOrder(snapshot, command), `${command.id} returned to Unscheduled.`); }
  function start(command: RevisionCommand) { commit(snapshot => startWorkOrder(snapshot, command), `${command.id} started at the demo time.`); }
  function complete(command: CompleteWorkOrderCommand) { commit(snapshot => completeWorkOrder(snapshot, command), `${command.id} completed.`); }
  function cancel(command: RevisionCommand) { commit(snapshot => cancelWorkOrder(snapshot, command), `${command.id} canceled.`); }
  function remove(command: RevisionCommand) { commit(snapshot => deleteWorkOrder(snapshot, command), `${command.id} deleted.`); }
  function reset() {
    if (!baseline) return;
    const fresh = resetSession(baseline,__APP_PROFILE__,storage);
    setDataset(fresh); setBlocked(false); setWarning(''); setNotice('Sample data restored to its original baseline.');
  }
  return {dataset,error,warning,blocked,notice,assign,create,edit,unassign,start,complete,cancel,remove,reset,retry:()=>setAttempt(value=>value+1)};
}
