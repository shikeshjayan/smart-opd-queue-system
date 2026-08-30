export type ActionResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export function actionOk<T>(data: T): ActionResponse<T> {
  return { ok: true, data };
}

export function actionError(error: string): ActionResponse<never> {
  return { ok: false, error };
}
