import { useEffect, useReducer, useState } from "react";
import type { DependencyList } from "react";

type AsyncState<T> = { data: T | null; error: string | null; isLoading: boolean };

type AsyncAction<T> =
  | { type: "loading" }
  | { type: "done"; data: T }
  | { type: "error"; message: string };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: null };
    case "done":
      return { data: action.data, isLoading: false, error: null };
    case "error":
      return { ...state, isLoading: false, error: action.message };
  }
}

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = [], initialData?: T) {
  const [state, dispatch] = useReducer(asyncReducer<T>, initialData, (init): AsyncState<T> => ({
    data: init as T,
    error: null,
    isLoading: true,
  }));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "loading" });
    loader()
      .then((result) => {
        if (!cancelled) dispatch({ type: "done", data: result });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: "error",
            message: err instanceof Error ? err.message : "Something went wrong",
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return {
    ...state,
    reload: () => setNonce((n) => n + 1),
  };
}
