/**
 * Renders the right state for a React Query result:
 *   pending → skeleton · error → ErrorState with retry · empty → EmptyState · data → children
 * Every data screen goes through this, so loading/empty/error look the same everywhere.
 */
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { SkeletonCards } from "./Shimmer";
import { EmptyState, ErrorState } from "./States";

export type QueryViewProps<T> = {
  query: Pick<UseQueryResult<T>, "data" | "error" | "isPending" | "isError" | "refetch">;
  children: (data: T) => ReactNode;
  skeleton?: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode | string;
};

export function QueryView<T>({ query, children, skeleton, isEmpty, empty }: QueryViewProps<T>) {
  if (query.isPending) return <>{skeleton ?? <SkeletonCards />}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const data = query.data as T;
  if (isEmpty?.(data)) return <>{typeof empty === "string" || empty === undefined ? <EmptyState message={empty ?? ""} /> : empty}</>;
  return <>{children(data)}</>;
}
