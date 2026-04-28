/**
 * Safe public-facing error message.
 *
 * In dev, surfaces the underlying message to make debugging easier.
 * In prod, returns the provided fallback so we don't leak DB / stack details.
 */
export function safeErrorMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (process.env.NODE_ENV !== 'production') {
    if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
    return String(e);
  }
  return fallback;
}
