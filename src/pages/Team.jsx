import { useCallback, useMemo, useState } from 'react';
import {
  Avatar, Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { profileApi } from '../api/endpoints';
import { useQuery } from '../hooks/useQuery';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Team() {
  useDocumentTitle('Team');
  const fetcher = useCallback(() => profileApi.all().then((l) => (Array.isArray(l) ? l : [])), []);
  const { data, loading, error, reload } = useQuery(fetcher);
  const [q, setQ] = useState('');

  const people = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data || []).filter((p) => !term || [p.userName, p.department, p.designation, p.organizationName].some((v) => v?.toLowerCase().includes(term)));
  }, [data, q]);

  return (
    <>
      <PageHeader title="Team" subtitle={loading ? 'Loading…' : `${data?.length ?? 0} people`} />
      <div className="toolbar toolbar-plain">
        <div className="search">
          <Icon name="search" size={18} />
          <input id="page-search" type="search" placeholder="Search by name, department or title…  ( / )" aria-label="Search team" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {error && <ErrorState error={error} onRetry={reload} title="Could not load the team" />}
      {loading && <div className="grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} height={130} radius={14} />)}</div>}
      {!loading && !error && people.length === 0 && (
        <Card><EmptyState icon="team" title={q ? 'No one matches your search' : 'No team profiles yet'}>{q ? 'Try a different search.' : 'Profiles will appear here once they are created.'}</EmptyState></Card>
      )}
      <div className="grid-3">
        {people.map((p) => (
          <Card key={p.id} className="person">
            <div className="person-head">
              <Avatar name={p.userName || String(p.id)} size={48} />
              <div>
                <h3 className="truncate">{p.userName || 'Unnamed'}</h3>
                <p className="muted truncate">{p.designation || 'No title'}</p>
              </div>
            </div>
            <dl className="props props-tight">
              <dt>Department</dt><dd>{p.department || '—'}</dd>
              <dt>Organisation</dt><dd>{p.organizationName || '—'}</dd>
              <dt>Status</dt><dd><Badge tone={p.active ? 'green' : 'slate'} dot>{p.active ? 'Active' : 'Inactive'}</Badge></dd>
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}
