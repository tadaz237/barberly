import { sendTransactionalEmail } from "@/src/lib/mailer";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function codeHtml(title: string, code: string, note: string) {
  const safeTitle = escapeHtml(title);
  const safeNote = escapeHtml(note);

  return `
    <div style="font-family:Arial,sans-serif;color:#18181b;line-height:1.5">
      <h1 style="font-size:20px;margin:0 0 16px">${safeTitle}</h1>
      <p style="margin:0 0 16px">${safeNote}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:0 0 16px">${code}</p>
      <p style="color:#71717a;font-size:13px;margin:0">Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
    </div>
  `;
}

export async function sendTwoFactorCodeEmail(email: string, code: string) {
  await sendTransactionalEmail({
    to: email,
    subject: "Code de connexion Barberly",
    text: `Votre code de connexion Barberly est ${code}. Il expire dans quelques minutes.`,
    html: codeHtml(
      "Code de connexion Barberly",
      code,
      "Utilisez ce code pour terminer votre connexion.",
    ),
  });
}

export async function sendPasswordResetCodeEmail(email: string, code: string) {
  await sendTransactionalEmail({
    to: email,
    subject: "Reinitialisation du mot de passe Barberly",
    text: `Votre code de reinitialisation Barberly est ${code}. Il expire dans quelques minutes.`,
    html: codeHtml(
      "Reinitialisation du mot de passe",
      code,
      "Utilisez ce code pour choisir un nouveau mot de passe.",
    ),
  });
}
