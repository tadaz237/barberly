import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim() || user;
  const secure = ["1", "true", "yes"].includes(
    (process.env.SMTP_SECURE ?? "").toLowerCase(),
  );
  const port = Number(process.env.SMTP_PORT ?? (secure ? 465 : 587));

  if (!host || !from || !Number.isInteger(port) || port <= 0) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
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
