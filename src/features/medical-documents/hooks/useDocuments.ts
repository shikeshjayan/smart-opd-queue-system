import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAsync } from "@/lib/use-async";
import type { SessionUser } from "@/features/auth/types/auth.types";
import { documentsMockApi } from "../api/documents.mock";
import type {
  DocumentFilters,
  DocumentSort,
} from "../types/medical-document.types";

const EMPTY_FILTERS: DocumentFilters = { keyword: "" };

export function useDocuments(patientId: string, filters: DocumentFilters, sort: DocumentSort) {
  const { user } = useAuth();
  const deps = useMemo(
    () => [
      user?.id,
      user?.role,
      user?.scope?.hospitalId,
      patientId,
      filters.keyword,
      filters.type,
      filters.category,
      filters.hospitalId,
      filters.encounterId,
      filters.status,
      filters.year,
      sort,
    ],
    [user, patientId, filters, sort]
  );
  return useAsync(
    () =>
      user
        ? documentsMockApi.listDocuments(user, patientId, filters, sort)
        : Promise.resolve(null),
    deps
  );
}

export function useRecentDocuments(patientId: string) {
  const { user } = useAuth();
  return useAsync(
    () => (user ? documentsMockApi.listForHistory(user, patientId) : Promise.resolve(null)),
    [user?.id, user?.role, user?.scope?.hospitalId, patientId]
  );
}

export function useDocument(documentId: string) {
  const { user } = useAuth();
  return useAsync(
    () => (user ? documentsMockApi.getDocument(user, documentId) : Promise.resolve(null)),
    [user?.id, user?.role, user?.scope?.hospitalId, documentId]
  );
}

export function useDocumentActions() {
  const { user } = useAuth();
  const [state, setState] = useState<{
    busy: boolean;
    error: string | null;
    successId: string | null;
  }>({ busy: false, error: null, successId: null });

  const run = useCallback(
    async (task: (user: SessionUser) => Promise<{ id: string } | null | undefined>) => {
      if (!user) return null;
      setState({ busy: true, error: null, successId: null });
      try {
        const result = await task(user);
        if (result?.id) setState({ busy: false, error: null, successId: result.id });
        else setState({ busy: false, error: null, successId: null });
        return result ?? null;
      } catch (err) {
        setState({
          busy: false,
          error: err instanceof Error ? err.message : "Operation failed.",
          successId: null,
        });
        return null;
      }
    },
    [user]
  );

  const archive = useCallback(
    (documentId: string) => run((u) => documentsMockApi.archiveDocument(u, documentId)),
    [run]
  );
  const restore = useCallback(
    (documentId: string) => run((u) => documentsMockApi.restoreDocument(u, documentId)),
    [run]
  );

  useEffect(() => {
    if (!state.successId) return;
    const t = setTimeout(() => setState((s) => ({ ...s, successId: null })), 2500);
    return () => clearTimeout(t);
  }, [state.successId]);

  return { ...state, archive, restore, clearError: () => setState((s) => ({ ...s, error: null })) };
}

export { EMPTY_FILTERS };