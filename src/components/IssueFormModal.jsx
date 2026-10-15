import { useMemo, useState } from 'react';
import { Modal } from './Overlay';
import { Button, Field } from './ui';
import { issueApi } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  ISSUE_TYPES, PRIORITIES, STATUSES, STATUS_LABEL,
} from '../utils/constants';
import { titleCase, toLocalDateTime } from '../utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function IssueFormModal({ open, onClose, onCreated, defaultStatus = 'OPEN', defaultSprintId = '', knownAssignees = [] }) {
  const { user } = useAuth();
  const toast = useToast();
  const initial = useMemo(
    () => ({
      issueTitle: '', issueDescription: '', issueType: 'TASK', priority: 'MEDIUM', issueStatus: defaultStatus,
      assigneeEmail: '', sprintId: defaultSprintId ? String(defaultSprintId) : '', epicId: '', projectId: '', dueDate: '',
    }),
    [defaultStatus, defaultSprintId],
  );
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.issueTitle.trim().length < 3) er.issueTitle = 'Give the issue a title of at least 3 characters.';
    if (form.assigneeEmail && !EMAIL_RE.test(form.assigneeEmail)) er.assigneeEmail = 'Enter a valid email address.';
    ['sprintId', 'epicId', 'projectId'].forEach((k) => {
      if (form[k] && !/^\d+$/.test(form[k])) er[k] = 'Use a numeric id.';
    });
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const close = () => {
    if (saving) return;
    setForm(initial);
    setErrors({});
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const num = (v) => (v ? Number(v) : null);
      const payload = {
        // The backend column is NOT NULL and the real key (PROJECT-<id>) is assigned after the
        // first save, so a unique placeholder is sent to satisfy the insert.
        issueKey: `TMP-${Date.now()}`,
        issueTitle: form.issueTitle.trim(),
        issueDescription: form.issueDescription.trim() || null,
        issueType: form.issueType,
        priority: form.priority,
        assigneeEmail: form.assigneeEmail.trim() || null,
        reportEmail: user?.email ?? null,
        sprintId: num(form.sprintId),
        epicId: num(form.epicId),
        projectId: num(form.projectId),
        dueDate: toLocalDateTime(form.dueDate),
      };
      let created = await issueApi.create(payload);
      if (form.issueStatus !== 'OPEN' && created?.id) {
        created = await issueApi.updateStatus(created.id, form.issueStatus);
      }
      toast.success(`Created ${created?.issueKey || 'issue'}`);
      setForm(initial);
      onCreated?.(created);
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
      onClose={close}
      title="Create issue"
      footer={(
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" form="issue-form" loading={saving}>Create issue</Button>
        </>
      )}
    >
      <form id="issue-form" className="form-grid" onSubmit={submit} noValidate>
        <div className="span-2">
          <Field label="Title" required error={errors.issueTitle}>
            {(p) => <input {...p} data-autofocus value={form.issueTitle} onChange={set('issueTitle')} placeholder="What needs to be done?" maxLength={255} />}
          </Field>
        </div>
        <div className="span-2">
          <Field label="Description" hint="Up to 5,000 characters.">
            {(p) => <textarea {...p} rows={4} value={form.issueDescription} onChange={set('issueDescription')} maxLength={5000} placeholder="Add context, steps to reproduce, acceptance criteria…" />}
          </Field>
        </div>
        <Field label="Type">
          {(p) => <select {...p} value={form.issueType} onChange={set('issueType')}>{ISSUE_TYPES.map((t) => <option key={t} value={t}>{titleCase(t.toLowerCase())}</option>)}</select>}
        </Field>
        <Field label="Priority">
          {(p) => <select {...p} value={form.priority} onChange={set('priority')}>{PRIORITIES.map((t) => <option key={t} value={t}>{titleCase(t.toLowerCase())}</option>)}</select>}
        </Field>
        <Field label="Status">
          {(p) => <select {...p} value={form.issueStatus} onChange={set('issueStatus')}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>}
        </Field>
        <Field label="Assignee" error={errors.assigneeEmail}>
          {(p) => (
            <>
              <input {...p} type="email" list="assignee-options" value={form.assigneeEmail} onChange={set('assigneeEmail')} placeholder="name@company.com" />
              <datalist id="assignee-options">
                {[...new Set([user?.email, ...knownAssignees].filter(Boolean))].map((e) => <option key={e} value={e} />)}
              </datalist>
            </>
          )}
        </Field>
        <Field label="Due date">
          {(p) => <input {...p} type="datetime-local" value={form.dueDate} onChange={set('dueDate')} />}
        </Field>
        <Field label="Sprint ID" error={errors.sprintId}>
          {(p) => <input {...p} inputMode="numeric" value={form.sprintId} onChange={set('sprintId')} placeholder="Optional" />}
        </Field>
        <Field label="Epic ID" error={errors.epicId}>
          {(p) => <input {...p} inputMode="numeric" value={form.epicId} onChange={set('epicId')} placeholder="Optional" />}
        </Field>
        <Field label="Project ID" error={errors.projectId}>
          {(p) => <input {...p} inputMode="numeric" value={form.projectId} onChange={set('projectId')} placeholder="Optional" />}
        </Field>
      </form>
    </Modal>
  );
}
