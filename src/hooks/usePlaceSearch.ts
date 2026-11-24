import { useQuery } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import { useDebouncedValue } from "./useDebouncedValue";

export const MIN_PLACE_QUERY = 2;

/** Debounced offline city search. Only the part before the first comma is sent. */
export function usePlaceSearch(text: string, enabled = true) {
  const q = useDebouncedValue(text.split(",")[0].trim(), 200);
  return useQuery({
    queryKey: queryKeys.places(q.toLowerCase()),
    queryFn: ({ signal }) => engineApi.meta.places(q, { signal }),
    enabled: enabled && q.length >= MIN_PLACE_QUERY,
    staleTime: Infinity,
  });
}
