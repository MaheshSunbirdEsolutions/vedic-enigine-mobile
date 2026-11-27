/**
 * Public API surface. Screens and hooks import `engineApi` (or `createEngineApi` in tests).
 *
 *   engineApi.kundlis.list("ram")
 *   engineApi.astro.chart(birth)
 *   engineApi.reports.simple({ ...birth, lang: "en", at })
 */
import type { HttpClient } from "./client";
import { http } from "./http";
import { askEndpoints } from "./endpoints/ask";
import { astroEndpoints } from "./endpoints/astro";
import { authEndpoints } from "./endpoints/auth";
import { kundliEndpoints } from "./endpoints/kundlis";
import { metaEndpoints } from "./endpoints/meta";
import { reportEndpoints } from "./endpoints/reports";

export const createEngineApi = (client: HttpClient) => ({
  auth: authEndpoints(client),
  kundlis: kundliEndpoints(client),
  astro: astroEndpoints(client),
  reports: reportEndpoints(client),
  ask: askEndpoints(client),
  meta: metaEndpoints(client),
});

export type EngineApi = ReturnType<typeof createEngineApi>;

export const engineApi: EngineApi = createEngineApi(http);

export { ApiError, isApiError, errorMessageKey } from "./errors";
export { queryKeys } from "./queryKeys";
export type { ReportId } from "./endpoints/reports";
