import { randomBytes } from "crypto";
import type { PaidPlan } from "@/src/lib/plans";
import { PLAN_DISPLAY_NAME } from "@/src/lib/plans";

const PAYMENT_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

export type CinetPayCheckoutResponse = {
  paymentToken: string;
  paymentUrl: string;
  rawResponse: Record<string, unknown>;
};

export type CinetPayVerificationResponse = {
  amount?: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  operatorId?: string;
  paymentDate?: string;
  rawResponse: Record<string, unknown>;
};

export class CinetPayConfigError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Configuration CinetPay manquante: ${missing.join(", ")}`);
    this.name = "CinetPayConfigError";
    this.missing = missing;
  }
}

type CinetPayConfig = {
  apiKey: string;
  siteId: string;
  currency: string;
  channels: string;
  customerCountry: string;
  defaultCity: string;
  defaultZipCode: string;
  defaultAddress: string;
};

type CheckoutInput = {
  transactionId: string;
  paymentId: string;
  plan: PaidPlan;
  amount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  baseUrl: string;
};

export function createCinetPayTransactionId() {
  return `BRB${Date.now()}${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function readCinetPayConfig(): CinetPayConfig {
  const missing = ["CINETPAY_API_KEY", "CINETPAY_SITE_ID"].filter(
    (key) => !process.env[key]?.trim(),
  );
  if (missing.length > 0) {
    throw new CinetPayConfigError(missing);
  }

  return {
    apiKey: process.env.CINETPAY_API_KEY as string,
    siteId: process.env.CINETPAY_SITE_ID as string,
    currency: (process.env.CINETPAY_CURRENCY || "XAF").trim(),
    channels: (process.env.CINETPAY_CHANNELS || "MOBILE_MONEY").trim(),
    customerCountry: (process.env.CINETPAY_CUSTOMER_COUNTRY || "CM").trim(),
    defaultCity: (process.env.CINETPAY_DEFAULT_CITY || "Douala").trim(),
    defaultZipCode: (process.env.CINETPAY_DEFAULT_ZIP_CODE || "00000").trim(),
    defaultAddress: (process.env.CINETPAY_DEFAULT_ADDRESS || "Non renseigne").trim(),
  };
}

export function getAppBaseUrl(request: Request) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export async function initializeCinetPayCheckout(
  input: CheckoutInput,
): Promise<CinetPayCheckoutResponse> {
  const config = readCinetPayConfig();
  const [customerName, customerSurname] = splitName(input.customer.name);
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const returnUrl = new URL("/api/cinetpay/return", baseUrl);
  returnUrl.searchParams.set("transactionId", input.transactionId);

  const response = await fetch(PAYMENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Barberly/1.0",
    },
    body: JSON.stringify({
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: input.transactionId,
      amount: input.amount,
      currency: config.currency,
      description: `Abonnement Barberly ${PLAN_DISPLAY_NAME[input.plan]}`,
      notify_url: `${baseUrl}/api/cinetpay/notify`,
      return_url: returnUrl.toString(),
      channels: config.channels,
      lang: "FR",
      metadata: input.paymentId,
      customer_id: input.customer.id,
      customer_name: customerName,
      customer_surname: customerSurname,
      customer_email: input.customer.email,
      customer_phone_number: input.customer.phone ?? "",
      customer_address: config.defaultAddress,
      customer_city: config.defaultCity,
      customer_country: config.customerCountry,
      customer_state: config.customerCountry,
      customer_zip_code: config.defaultZipCode,
      invoice_data: {
        Plan: PLAN_DISPLAY_NAME[input.plan],
        Montant: `${input.amount} ${config.currency}`,
        Periode: "1 mois",
      },
    }),
  });

  const raw = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || !raw) {
    throw new Error("CinetPay n'a pas retourne une reponse valide.");
  }

  const data = raw.data as { payment_token?: unknown; payment_url?: unknown } | undefined;
  if (
    String(raw.code) !== "201" ||
    typeof data?.payment_token !== "string" ||
    typeof data?.payment_url !== "string"
  ) {
    const message =
      typeof raw.description === "string"
        ? raw.description
        : "Initialisation CinetPay impossible.";
    throw new Error(message);
  }

  return {
    paymentToken: data.payment_token,
    paymentUrl: data.payment_url,
    rawResponse: raw,
  };
}

export async function verifyCinetPayTransaction(
  transactionId: string,
): Promise<CinetPayVerificationResponse> {
  const config = readCinetPayConfig();
  const response = await fetch(CHECK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Barberly/1.0",
    },
    body: JSON.stringify({
      apikey: config.apiKey,
      site_id: config.siteId,
      transaction_id: transactionId,
    }),
  });

  const raw = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || !raw) {
    throw new Error("Verification CinetPay impossible.");
  }

  const data = raw.data as Record<string, unknown> | undefined;
  return {
    amount: parseCinetPayAmount(data?.amount),
    currency: typeof data?.currency === "string" ? data.currency : undefined,
    status: typeof data?.status === "string" ? data.status : undefined,
    paymentMethod:
      typeof data?.payment_method === "string" ? data.payment_method : undefined,
    operatorId: typeof data?.operator_id === "string" ? data.operator_id : undefined,
    paymentDate: typeof data?.payment_date === "string" ? data.payment_date : undefined,
    rawResponse: raw,
  };
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["Client", "Barberly"];
  if (parts.length === 1) return [parts[0], "Barberly"];
  return [parts[0], parts.slice(1).join(" ")];
}

function parseCinetPayAmount(amount: unknown) {
  const value = Number(amount);
  return Number.isFinite(value) ? value : undefined;
}
