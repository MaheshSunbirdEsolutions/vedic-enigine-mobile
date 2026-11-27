import type { HttpClient } from "../client";
import type { EmailHoroscopeRequest, EmailPreviewResponse, EmailSendResponse, EmailStatus } from "@/types/api";

type Opt = { signal?: AbortSignal };

/** SMTP email status, preview, and sharing for daily horoscope. */
export const emailEndpoints = (c: HttpClient) => ({
  status: (o: Opt = {}) => c.request<EmailStatus>("/email/status", { signal: o.signal }),
  previewHoroscope: (req: EmailHoroscopeRequest, o: Opt = {}) =>
    c.request<EmailPreviewResponse>("/email/horoscope", { body: { ...req, preview_only: true }, signal: o.signal }),
  sendHoroscope: (req: EmailHoroscopeRequest, o: Opt = {}) =>
    c.request<EmailSendResponse>("/email/horoscope", { body: { ...req, preview_only: false }, signal: o.signal }),
});
