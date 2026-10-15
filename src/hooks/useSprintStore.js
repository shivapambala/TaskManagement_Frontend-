import { useCallback, useMemo, useState } from 'react';
import { storage } from '../utils/storage';

const KEY = 'tf.sprints';

/**
 * The backend exposes no "list sprints" endpoint, so sprints created from this
 * UI are remembered locally, and sprint ids seen on issues are merged in.
 */
export function useSprintStore(issues = []) {
  const [saved, setSaved] = useState(() => storage.get(KEY, []));

  const persist = useCallback((next) => {
    setSaved(next);
    storage.set(KEY, next);
  }, []);

  const upsert = useCallback(
    (sprint) => {
      const current = storage.get(KEY, []);
      const exists = current.some((s) => s.id === sprint.id);
      persist(exists ? current.map((s) => (s.id === sprint.id ? { ...s, ...sprint } : s)) : [...current, sprint]);
    },
    [persist],
  );

  const sprints = useMemo(() => {
    const byId = new Map(saved.map((s) => [s.id, s]));
    issues.forEach((i) => {
      if (i.sprintId && !byId.has(i.sprintId)) {
        byId.set(i.sprintId, { id: i.sprintId, name: `Sprint #${i.sprintId}`, sprintState: null, discovered: true });
      }
    });
    return [...byId.values()].sort((a, b) => b.id - a.id);
  }, [saved, issues]);

  return { sprints, upsert };
}
