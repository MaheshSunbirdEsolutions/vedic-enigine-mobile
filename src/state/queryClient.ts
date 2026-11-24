/** React Query defaults: no retries on 4xx, short backoff otherwise. */
import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/errors";

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && !error.isRetryable) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay: (n) => Math.min(1000 * 2 ** n, 5000),
        staleTime: 5 * 60_000, // charts never change for the same birth data
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
