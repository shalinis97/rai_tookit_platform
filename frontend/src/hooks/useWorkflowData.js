import { useState, useEffect, useCallback, useRef } from 'react';
import { workflowsApi, normalizeNode, normalizeEdge } from '../api/workflows';
import useWorkflowStore from '../store/workflowStore';

function normalize(wf) {
  return {
    ...wf,
    nodes: (wf.nodes || []).map(normalizeNode),
    edges: (wf.edges || []).map(normalizeEdge),
  };
}

/**
 * On every call to fetchAll:
 *   1. GET /workflows  → list of workflow stubs
 *   2. For each workflow, GET /workflows/:id → full nodes + edges
 *   3. Merge everything into the store
 *
 * This runs on mount AND is exported so callers (goBack, etc.)
 * can trigger it directly without a page reload.
 */
export function useWorkflowData() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const fetchingRef           = useRef(false);   // prevent concurrent fetches

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      // Step 1: get the list (stubs only, no nodes/edges from this endpoint)
      const stubs = await workflowsApi.list();

      // Step 2: fetch full detail for every workflow in parallel
      const fulls = await Promise.all(
        stubs.map(stub =>
          workflowsApi.get(stub.id)
            .then(normalize)
            .catch(() => normalize(stub))   // fallback to stub if detail fails
        )
      );

      // Step 3: replace store wholesale
      useWorkflowStore.getState().setWorkflows(fulls);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Run once on mount
  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { loading, error, refetch: fetchAll };
}
