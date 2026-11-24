import { useQuery } from "@tanstack/react-query";
import { createEngineApi, queryKeys } from "@/api";
import { createHttpClient } from "@/api/client";

/** Pings /health on a given base URL (used by Settings before saving an override). */
export function useEngineHealth(url: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.health(url),
    queryFn: ({ signal }) => createEngineApi(createHttpClient({ getBaseUrl: () => url, timeoutMs: 5000 })).meta.health({ signal }),
    enabled,
    retry: false,
    staleTime: 0,
  });
}
