import { useCallback, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { documentsMockApi } from "../api/documents.mock";
import type { MedicalDocument } from "../types/medical-document.types";

export function useDocumentUpload() {
  const { user } = useAuth();
  const [state, setState] = useState<{
    uploading: boolean;
    error: string | null;
    uploaded: MedicalDocument | null;
  }>({ uploading: false, error: null, uploaded: null });

  const upload = useCallback(
    async (input: Parameters<typeof documentsMockApi.uploadDocument>[1]) => {
      if (!user) return null;
      setState({ uploading: true, error: null, uploaded: null });
      try {
        const doc = await documentsMockApi.uploadDocument(user, input);
        setState({ uploading: false, error: null, uploaded: doc });
        return doc;
      } catch (err) {
        setState({
          uploading: false,
          error: err instanceof Error ? err.message : "Upload failed.",
          uploaded: null,
        });
        return null;
      }
    },
    [user]
  );

  const reset = useCallback(() => setState({ uploading: false, error: null, uploaded: null }), []);

  return { ...state, upload, reset };
}