/** Saved kundlis: list, detail, save (create/update) and delete, with cache invalidation. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { engineApi, queryKeys } from "@/api";
import type { Kundli } from "@/types/api";

export function useKundliList(search: string) {
  const q = search.trim();
  return useQuery({
    queryKey: queryKeys.kundlis.list(q),
    queryFn: ({ signal }) => engineApi.kundlis.list(q, { signal }),
    placeholderData: keepPreviousData, // keep the list on screen while a new search loads
    staleTime: 30_000,
  });
}

export function useKundli(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.kundlis.detail(id ?? ""),
    queryFn: ({ signal }) => engineApi.kundlis.get(id!, { signal }),
    enabled: !!id,
  });
}

/** Creates when the kundli has no id, otherwise updates. Resolves to the stored record. */
export function useSaveKundli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (k: Kundli) => (k.id ? engineApi.kundlis.update(k.id, k) : engineApi.kundlis.create(k)),
    onSuccess: (saved) => {
      if (saved.id) qc.setQueryData(queryKeys.kundlis.detail(saved.id), saved);
      void qc.invalidateQueries({ queryKey: queryKeys.kundlis.all, refetchType: "active" });
    },
  });
}

export function useDeleteKundli() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => engineApi.kundlis.remove(id),
    onSuccess: (_r, id) => {
      qc.removeQueries({ queryKey: queryKeys.kundlis.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.kundlis.all });
    },
  });
}
