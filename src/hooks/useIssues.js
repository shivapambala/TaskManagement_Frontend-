import { useCallback } from 'react';
import { issueApi } from '../api/endpoints';
import { useQuery } from './useQuery';

/** Loads every issue (POST /api/issues/search with no filters). Re-fetches when refreshKey changes. */
export function useIssues(refreshKey = 0) {
  const fetcher = useCallback(
    () => issueApi.search({}).then((list) => (Array.isArray(list) ? list : [])),
    // refreshKey is intentionally part of the identity so a bump triggers a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey],
  );
  return useQuery(fetcher);
}
