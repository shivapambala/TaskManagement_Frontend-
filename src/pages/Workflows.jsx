import { useCallback, useState } from 'react';
import {
  Badge, Button, Card, EmptyState, ErrorState, Field, PageHeader, Skeleton,
} from '../components/ui';
import { ConfirmDialog, Modal } from '../components/Overlay';
import { Icon } from '../components/Icon';
import { workflowApi } from '../api/endpoints';
import { useQuery } from '../hooks/useQuery';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ROLES, STATUSES, STATUS_LABEL } from '../utils/constants';
import { formatDate, titleCase } from '../utils/format';

const blankStep = () => ({ key: Math.random().toString(36).slice(2), name: '', from: 'OPEN', to: 'TODO', allowedRole: [] });

function WorkflowForm({ open, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [descriptions, setDescriptions] = useState('');
  const [steps, setSteps] = useState([blankStep()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const patch = (key, p) => setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...p } : s)));
  const toggleRole = (step, role) => patch(step.key, { allowedRole: step.allowedRole.includes(role) ? step.allowedRole.filter((r) => r !== role) : [...step.allowedRole, role] });

  const reset = () => { setName(''); setDescriptions(''); setSteps([blankStep()]); setErrors({}); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (name.trim().length < 2) er.name = 'Give the workflow a name.';
    if (steps.some((s) => s.from === s.to)) er.steps = 'A transition must move between two different statuses.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await workflowApi.create({
        name: name.trim(),
        descriptions: descriptions.trim() || null,
        transactions: steps.map(({ key: _key, ...s }) => ({ ...s, name: s.name.trim() || `${STATUS_LABEL[s.from]} → ${STATUS_LABEL[s.to]}` })),
      });
      toast.success('Workflow created');
      reset();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.status === 500 ? 'Could not save. A workflow with that name may already exist.' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create workflow"
      footer={<><Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="wf-form" loading={saving}>Create workflow</Button></>}
    >
      <form id="wf-form" className="stack" onSubmit={submit} noValidate>
        <Field label="Name" required error={errors.name}>{(p) => <input {...p} data-autofocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Default software workflow" />}</Field>
        <Field label="Description">{(p) => <textarea {...p} rows={2} value={descriptions} onChange={(e) => setDescriptions(e.target.value)} />}</Field>
        <fieldset className="steps">
          <legend>Transitions</legend>
          {errors.steps && <p className="field-msg">{errors.steps}</p>}
          {steps.map((s, idx) => (
            <div key={s.key} className="step">
              <div className="step-row">
                <label>From<select value={s.from} onChange={(e) => patch(s.key, { from: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</select></label>
                <Icon name="chevron" size={18} />
                <label>To<select value={s.to} onChange={(e) => patch(s.key, { to: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABEL[x]}</option>)}</select></label>
                <button type="button" className="icon-btn" aria-label={`Remove transition ${idx + 1}`} disabled={steps.length === 1} onClick={() => setSteps((l) => l.filter((x) => x.key !== s.key))}><Icon name="trash" size={16} /></button>
              </div>
              <input aria-label={`Transition ${idx + 1} name`} value={s.name} onChange={(e) => patch(s.key, { name: e.target.value })} placeholder="Transition name (optional)" />
              <div className="chips" role="group" aria-label="Roles allowed to make this transition">
                {ROLES.map((r) => (
                  <label key={r} className={`chip ${s.allowedRole.includes(r) ? 'chip-on' : ''}`}>
                    <input type="checkbox" checked={s.allowedRole.includes(r)} onChange={() => toggleRole(s, r)} />{titleCase(r.toLowerCase())}
                  </label>
                ))}
                <span className="muted">{s.allowedRole.length === 0 ? 'Any role' : ''}</span>
              </div>
            </div>
          ))}
          <Button variant="secondary" size="sm" icon="plus" onClick={() => setSteps((l) => [...l, blankStep()])}>Add transition</Button>
        </fieldset>
      </form>
    </Modal>
  );
}

export default function Workflows() {
  useDocumentTitle('Workflows');
  const toast = useToast();
  const fetcher = useCallback(() => workflowApi.all().then((l) => (Array.isArray(l) ? l : [])), []);
  const { data, loading, error, reload } = useQuery(fetcher);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await workflowApi.remove(toDelete.id);
      toast.success('Workflow deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Workflows"
        subtitle="Define which status changes are allowed, and by whom."
        actions={<Button icon="plus" onClick={() => setFormOpen(true)}>New workflow</Button>}
      />
      {error && <ErrorState error={error} onRetry={reload} title="Could not load workflows" />}
      {loading && <div className="grid-2"><Skeleton height={140} radius={14} /><Skeleton height={140} radius={14} /></div>}
      {!loading && !error && data?.length === 0 && (
        <Card><EmptyState icon="flow" title="No workflows yet" action={<Button icon="plus" onClick={() => setFormOpen(true)}>Create a workflow</Button>}>Workflows control how issues move between statuses.</EmptyState></Card>
      )}
      <div className="grid-2">
        {(data || []).map((w) => (
          <Card key={w.id} title={w.name} actions={<Button size="sm" variant="ghost" icon="trash" onClick={() => setToDelete(w)} aria-label={`Delete ${w.name}`}>Delete</Button>}>
            {w.descriptions && <p>{w.descriptions}</p>}
            <p className="muted">Created {formatDate(w.createdAt)}</p>
            <ul className="mini-list">
              {(w.transactions || []).map((t) => (
                <li key={t.id}>
                  <Badge>{STATUS_LABEL[t.from] || t.from}</Badge><Icon name="chevron" size={14} /><Badge tone="blue">{STATUS_LABEL[t.to] || t.to}</Badge>
                  <span className="muted truncate">{t.name}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <WorkflowForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete workflow?"
        message={`“${toDelete?.name}” and its transitions will be permanently removed.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
