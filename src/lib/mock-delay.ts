/** Optional short delay for mock write actions in production demos only. */
export function mockWriteDelay(ms: number): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, Math.min(ms, 120)));
}
