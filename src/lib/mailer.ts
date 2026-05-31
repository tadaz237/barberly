import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function readBooleanEnv(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim() || user;
  const rawPort = process.env.SMTP_PORT?.trim();
  const rawSecure = process.env.SMTP_SECURE?.trim();
  const port = Number(rawPort || (readBooleanEnv(rawSecure) ? 465 : 587));
  const secure =
    rawSecure === undefined ? port === 465 : readBooleanEnv(rawSecure);
  const authDisabled = readBooleanEnv(process.env.SMTP_AUTH_DISABLED);
  const hasCompleteAuth = Boolean(user && pass);
  const hasPartialAuth = Boolean(user || pass) && !hasCompleteAuth;

  if (
    !host ||
    !from ||
    !Number.isInteger(port) ||
    port <= 0 ||
    hasPartialAuth ||
    (!authDisabled && !hasCompleteAuth)
  ) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: hasCompleteAuth
      ? { user: user as string, pass: pass as string }
      : undefined,
    from,
  };
}

export function isSmtpConfigured() {
  return readSmtpConfig() !== null;
}

export async function sendTransactionalEmail(email: TransactionalEmail) {
  const config = readSmtpConfig();

  if (!config) {
    throw new Error("SMTP is not configured.");
  }

  const transportOptions: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
  const transporter = nodemailer.createTransport(transportOptions);

  await transporter.sendMail({
    from: config.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}
