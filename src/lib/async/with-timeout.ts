export class AsyncTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`انتهت مهلة ${label} (${Math.round(ms / 1000)} ث)`);
    this.name = "AsyncTimeoutError";
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = "العملية",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new AsyncTimeoutError(label, ms)), ms);
    }),
  ]);
}
