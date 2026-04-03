import emailjs from "@emailjs/browser";

// Loaded from frontend/.env.local — never hardcode secrets in source
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface EmailPayload {
  to_email: string;
  employee_name: string;
  status: string;
  merchant: string;
  currency: string;
  amount: string;
  message: string;
  [key: string]: string;
}

export async function sendClaimEmail(payload: EmailPayload): Promise<void> {
  console.log("EmailJS config:", { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY });
  console.log("Sending to:", payload.to_email);
  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, payload, PUBLIC_KEY);
    console.log("EmailJS success:", result);
  } catch (err: unknown) {
    const e = err as { status?: number; text?: string };
    console.error("EmailJS failed — status:", e.status, "text:", e.text);
    throw err;
  }}
