import { useMemo, useState } from 'react';
import {
  Badge, Button, Card, EmptyState, ErrorState, Field, PageHeader, ProgressBar, Skeleton, StatusBadge,
} from '../components/ui';
import { Modal } from '../components/Overlay';
import { sprintApi } from '../api/endpoints';
import { useIssues } from '../hooks/useIssues';
import { useSprintStore } from '../hooks/useSprintStore';
import { useAppContext } from '../hooks/useAppContext';
import { useToast } from '../hooks/useToast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDate, toLocalDateTime } from '../utils/format';

function SprintForm({ open, onClose, onSaved }) {
  const toast = useToast();
  const blank = { name: '', goal: '', startDate: '', endDate: '', projectId: '' };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Give the sprint a name.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) er.endDate = 'End must be after the start date.';
    if (form.projectId && !/^\d+$/.test(form.projectId)) er.projectId = 'Use a numeric id.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const saved = await sprintApi.create({
        name: form.name.trim(),
        goal: form.goal.trim() || null,
        startDate: toLocalDateTime(form.startDate),
        endDate: toLocalDateTime(form.endDate),
        projectId: form.projectId ? Number(form.projectId) : null,
      });
      toast.success(`Sprint “${saved.name}” created`);
      onSaved(saved);
      setForm(blank);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create sprint"
      footer={<><Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" form="sprint-form" loading={saving}>Create sprint</Button></>}
    >
      <form id="sprint-form" className="form-grid" onSubmit={submit} noValidate>
        <div className="span-2"><Field label="Name" required error={errors.name}>{(p) => <input {...p} data-autofocus value={form.name} onChange={set('name')} placeholder="Sprint 12" />}</Field></div>
        <div className="span-2"><Field label="Goal">{(p) => <textarea {...p} rows={3} value={form.goal} onChange={set('goal')} placeholder="What should this sprint achieve?" />}</Field></div>
        <Field label="Start">{(p) => <input {...p} type="datetime-local" value={form.startDate} onChange={set('startDate')} />}</Field>
        <Field label="End" error={errors.endDate}>{(p) => <input {...p} type="datetime-local" value={form.endDate} onChange={set('endDate')} />}</Field>
        <Field label="Project ID" error={errors.projectId}>{(p) => <input {...p} inputMode="numeric" value={form.projectId} onChange={set('projectId')} placeholder="Optional" />}</Field>
      </form>
    </Modal>
  );
}

export default function Sprints() {
  useDocumentTitle('Sprints');
  const toast = useToast();
  const { issuesVersion } = useAppContext();
  const [version, setVersion] = useState(0);
  const { data: issues, loading, error, reload } = useIssues(issuesVersion + version);
  const { sprints, upsert } = useSprintStore(issues || []);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [pick, setPick] = useState({});

  const backlog = useMemo(() => (issues || []).filter((i) => !i.sprintId), [issues]);

  const act = async (sprint, kind) => {
    setBusy(`${kind}-${sprint.id}`);
    try {
      const res = kind === 'start' ? await sprintApi.start(sprint.id) : await sprintApi.end(sprint.id);
      upsert({ ...sprint, ...res });
      toast.success(kind === 'start' ? `${sprint.name} started` : `${sprint.name} completed`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const assign = async (sprint) => {
    const issueId = pick[sprint.id];
    if (!issueId) return;
    setBusy(`assign-${sprint.id}`);
    try {
      await sprintApi.assign(sprint.id, issueId);
      toast.success('Issue added to sprint');
      setPick((p) => ({ ...p, [sprint.id]: '' }));
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Sprints"
        subtitle="Plan, start and close time-boxed iterations."
        actions={<Button icon="plus" onClick={() => setFormOpen(true)}>New sprint</Button>}
      />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && <div className="grid-2"><Skeleton height={180} radius={14} /><Skeleton height={180} radius={14} /></div>}
      {!loading && !error && sprints.length === 0 && (
        <Card>
          <EmptyState icon="sprint" title="No sprints yet" action={<Button icon="plus" onClick={() => setFormOpen(true)}>Create a sprint</Button>}>
            Sprints you create here are listed on this page.
          </EmptyState>
        </Card>
      )}
      <div className="grid-2">
        {!loading && sprints.map((s) => {
          const list = (issues || []).filter((i) => i.sprintId === s.id);
          const done = list.filter((i) => i.issueStatus === 'DONE').length;
          const pct = list.length ? (done / list.length) * 100 : 0;
          const state = s.sprintState;
          return (
            <Card
              key={s.id}
              title={s.name}
              actions={state ? <StatusBadge status={state} /> : <Badge>Unknown state</Badge>}
            >
              {s.goal && <p className="prewrap">{s.goal}</p>}
              <p className="muted">
                {s.startDate ? `${formatDate(s.startDate)} → ${formatDate(s.endDate)}` : 'No dates set'} · ID #{s.id}
              </p>
              <ProgressBar value={pct} tone="green" label={`${s.name} progress`} />
              <p className="muted progress-caption">{done} of {list.length} issues done</p>
              <div className="actions-row">
                <Button size="sm" icon="play" variant="secondary" disabled={state !== 'PLANNED' && state !== null} loading={busy === `start-${s.id}`} onClick={() => act(s, 'start')}>Start</Button>
                <Button size="sm" icon="stop" variant="secondary" disabled={state === 'CMPLETED'} loading={busy === `end-${s.id}`} onClick={() => act(s, 'end')}>Complete</Button>
              </div>
              {state !== 'CMPLETED' && (
                <div className="assign-row">
                  <select aria-label={`Add backlog issue to ${s.name}`} value={pick[s.id] || ''} onChange={(e) => setPick((p) => ({ ...p, [s.id]: e.target.value }))}>
                    <option value="">Add a backlog issue…</option>
                    {backlog.map((i) => <option key={i.id} value={i.id}>{i.issueKey} · {i.issueTitle}</option>)}
                  </select>
                  <Button size="sm" disabled={!pick[s.id]} loading={busy === `assign-${s.id}`} onClick={() => assign(s)}>Add</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <SprintForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={upsert} />
    </>
  );
}
