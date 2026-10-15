import { useOutletContext } from 'react-router-dom';

/** { openCreate(options?), issuesVersion } provided by <AppLayout>. */
export function useAppContext() {
  return useOutletContext();
}
