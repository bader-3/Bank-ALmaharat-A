export function withoutUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isBrowser() {
  return typeof window !== "undefined";
}

export function logFirestoreError(scope: string, error: unknown) {
  console.error(`[Firestore:${scope}]`, error);
}
