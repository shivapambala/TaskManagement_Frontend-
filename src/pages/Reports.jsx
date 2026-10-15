import { useCallback, useState } from 'react';
import {
  Button, Card, EmptyState, ErrorState, Field, PageHeader, ProgressBar, Skeleton,
} from '../components/ui';
import { BarList, DonutChart, LineChart } from '../components/Charts';
import { reportApi } from '../api/endpoints';
import { useQuery } from '../hooks/useQuery';
import { useIssues } from '../hooks/useIssues';
import { useSprintStore } from '../hooks/useSprintStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { STATUS_LABEL } from '../utils/constants';

function Panel({ title, query, children }) {
  return (
    <Card title={title}>
      {query.loading && <Skeleton height={180} radius={12} />}
      {query.error && <ErrorState error={query.error} onRetry={query.reload} title="Report unavailable" />}
      {!query.loading && !query.error && children(query.data)}
    </Card>
  );
}

function SprintReports({ sprintId }) {
  const burn = useQuery(useCallback(() => reportApi.burnDown(sprintId), [sprintId]));
  const summary = useQuery(useCallback(() => reportApi.sprint(sprintId), [sprintId]));
  const load = useQuery(useCallback(() => reportApi.workLoad(sprintId), [sprintId]));
  const flow = useQuery(useCallback(() => reportApi.flow(sprintId), [sprintId]));

  return (
    <div className="grid-2">
      <Panel title="Burndown" query={burn}>
        {(d) => {
          const points = Object.entries(d?.burnDownData || {}).map(([label, value]) => ({ label, value }));
          return points.length
            ? <LineChart points={points} />
            : <EmptyState icon="chart" title="No burndown data">Start the sprint and set its dates to see progress.</EmptyState>;
        }}
      </Panel>
      <Panel title="Completion" query={summary}>
        {(d) => {
          const completed = d?.completed ?? 0;
          const incomplete = d?.Incomplete ?? d?.incomplete ?? 0;
          return (
            <DonutChart
              centerValue={completed + incomplete ? `${Math.round((completed / (completed + incomplete)) * 100)}%` : '0%'}
              centerLabel="done"
              segments={[{ label: 'Completed', value: completed, color: '#22c55e' }, { label: 'Incomplete', value: incomplete, color: '#cbd5e1' }]}
            />
          );
        }}
      </Panel>
      <Panel title="Workload by assignee" query={load}>
        {(d) => <BarList items={Object.entries(d?.workLoad || {}).map(([label, value]) => ({ label, value }))} emptyText="No issues in this sprint." />}
      </Panel>
      <Panel title="Flow by status" query={flow}>
        {(d) => <BarList items={Object.entries(d?.flowChat || {}).map(([k, value]) => ({ label: STATUS_LABEL[k] || k, value }))} tone="violet" emptyText="No issues in this sprint." />}
      </Panel>
    </div>
  );
}

function Velocity() {
  const [input, setInput] = useState('');
  const [projectId, setProjectId] = useState(null);
  const fetcher = useCallback(() => (projectId ? reportApi.velocity(projectId) : Promise.resolve(null)), [projectId]);
  const q = useQuery(fetcher);
  return (
    <Card title="Velocity by project">
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (/^\d+$/.test(input)) setProjectId(Number(input)); }}>
        <Field label="Project ID">{(p) => <input {...p} inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. 1" />}</Field>
        <Button type="submit" variant="secondary" disabled={!/^\d+$/.test(input)}>Load</Button>
      </form>
      {projectId && q.error && <ErrorState error={q.error} onRetry={q.reload} />}
      {projectId && !q.loading && !q.error && (
        <BarList items={Object.entries(q.data?.velocity || {}).map(([label, value]) => ({ label, value }))} tone="green" emptyText="No completed sprints for this project yet." />
      )}
    </Card>
  );
}

function Epic() {
  const [input, setInput] = useState('');
  const [epicId, setEpicId] = useState(null);
  const fetcher = useCallback(() => (epicId ? reportApi.epic(epicId) : Promise.resolve(null)), [epicId]);
  const q = useQuery(fetcher);
  return (
    <Card title="Epic progress">
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (/^\d+$/.test(input)) setEpicId(Number(input)); }}>
        <Field label="Epic ID">{(p) => <input {...p} inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. 4" />}</Field>
        <Button type="submit" variant="secondary" disabled={!/^\d+$/.test(input)}>Load</Button>
      </form>
      {epicId && q.error && <ErrorState error={q.error} onRetry={q.reload} />}
      {epicId && !q.loading && !q.error && q.data && (
        <>
          <ProgressBar value={q.data.progresspercent ?? 0} tone="green" label="Epic progress" />
          <p className="muted progress-caption">{q.data.completedStories} of {q.data.totalStories} stories complete ({q.data.progresspercent}%)</p>
        </>
      )}
    </Card>
  );
}

export default function Reports() {
  useDocumentTitle('Reports');
  const { data: issues } = useIssues(0);
  const { sprints } = useSprintStore(issues || []);
  const [sprintId, setSprintId] = useState('');
  const [manual, setManual] = useState('');

  return (
    <>
      <PageHeader title="Reports" subtitle="Understand sprint health, workload and team velocity." />
      <Card title="Sprint reports">
        <div className="inline-form">
          <Field label="Sprint">
            {(p) => (
              <select {...p} value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
                <option value="">Choose a sprint…</option>
                {sprints.map((s) => <option key={s.id} value={s.id}>{s.name} (#{s.id})</option>)}
              </select>
            )}
          </Field>
          <Field label="…or enter a sprint ID">
            {(p) => <input {...p} inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 3" />}
          </Field>
          <Button variant="secondary" disabled={!/^\d+$/.test(manual)} onClick={() => { setSprintId(manual); setManual(''); }}>Open</Button>
        </div>
      </Card>
      {sprintId
        ? <SprintReports key={sprintId} sprintId={sprintId} />
        : <Card><EmptyState icon="chart" title="Choose a sprint">Select a sprint above to see its burndown, completion, workload and flow.</EmptyState></Card>}
      <div className="grid-2">
        <Velocity />
        <Epic />
      </div>
    </>
  );
}
