/** Test helpers: render with the same providers as the app, minus the network. */
import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/Toast";
import { StaticI18nProvider } from "@/i18n/I18nProvider";
import { createTranslator } from "@/i18n/translate";
import type { I18nBundle, Lang } from "@/types/api";
import en from "@/__fixtures__/i18n_en.json";
import hi from "@/__fixtures__/i18n_hi.json";

export const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } }); // no GC timers keeping Jest alive

export async function renderWithProviders(ui: ReactElement, opts: { lang?: Lang; client?: QueryClient } & RenderOptions = {}) {
  const client = opts.client ?? testQueryClient();
  const translator = createTranslator(opts.lang ?? "en", (opts.lang === "hi" ? hi : en) as I18nBundle);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
    <QueryClientProvider client={client}>
      <StaticI18nProvider translator={translator}>
        <ToastProvider>{children}</ToastProvider>
      </StaticI18nProvider>
    </QueryClientProvider>
    </SafeAreaProvider>
  );
  const result = await render(ui, { wrapper: Wrapper, ...opts });
  return { client, ...result };
}

/** A fetch stand-in that answers with a status and JSON/text body. */
export function fakeResponse(status: number, body: unknown): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: () => Promise.resolve(text) } as unknown as Response;
}
