/**
 * Per-sub-tab report print and PDF download state management.
 * Tracks busy action and errors keyed by the active sub-tab (`key:year:lang`), so switching
 * sub-tabs never leaks busy/error UI across tabs.
 */
import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { buildReportHtml, type ReportExportKey } from "@/domain/reportHtml";
import { useI18n } from "@/i18n/I18nProvider";
import type { Chart, Kundli } from "@/types/api";

export type ExportAction = "print" | "pdf";

type ExportInput = {
  key: ReportExportKey;
  title: string;
  kundli: Kundli;
  data: unknown;
  chart?: Chart;
  year: number;
};

export function useReportExport(tabKey: string) {
  const tr = useI18n();
  const [busyByTab, setBusyByTab] = useState<Record<string, ExportAction | null>>({});
  const [errorByTab, setErrorByTab] = useState<Record<string, string | null>>({});

  const run = useCallback(async (action: ExportAction, input: ExportInput) => {
    const k = `${input.key}:${input.year}:${tr.lang}`;
    setBusyByTab((prev) => ({ ...prev, [k]: action }));
    setErrorByTab((prev) => ({ ...prev, [k]: null }));
    try {
      const html = buildReportHtml({ ...input, translator: tr });
      if (action === "print" || Platform.OS === "web") {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: `${input.kundli.name} – ${input.title}` });
        } else {
          await Print.printAsync({ html });
        }
      }
    } catch {
      setErrorByTab((prev) => ({ ...prev, [k]: tr.t("report_export_failed") }));
    } finally {
      setBusyByTab((prev) => ({ ...prev, [k]: null }));
    }
  }, [tr]);

  return {
    busyAction: busyByTab[tabKey] ?? null,
    exportError: errorByTab[tabKey] ?? null,
    printReport: (input: ExportInput) => run("print", input),
    downloadPdf: (input: ExportInput) => run("pdf", input),
  };
}
