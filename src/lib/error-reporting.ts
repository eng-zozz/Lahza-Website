// Generic client-side error reporting hook.
// Wire this up to your own error tracking (Sentry, LogRocket, etc.) when ready —
// for now it just ensures errors are consistently logged.
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[App Error]", error, context);
}
