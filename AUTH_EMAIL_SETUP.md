# Barberly Auth Email Setup

This project uses:

- Vercel for hosting Next.js.
- Neon/Postgres through `DATABASE_URL`.
- Cloudinary through `CLOUDINARY_URL`.
- SMTP through `nodemailer` for two-factor login and password reset codes.

## Required Vercel environment variables

Add these variables in Vercel Project Settings -> Environment Variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled or direct Postgres URL, with SSL enabled. |
| `AUTH_SECRET` | Auth.js secret. Generate it locally with `npx auth secret`. |
| `AUTH_URL` | Production URL, for example `https://your-domain.com`. |
| `AUTH_TRUST_HOST` | Set to `true` on Vercel. |
| `AUTH_GOOGLE_ID` | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret. |
| `PLATFORM_ADMIN_EMAILS` | Comma-separated admin emails for platform review pages. |
| `APP_BASE_URL` | Public production URL, also used by payment callbacks. |
| `CLOUDINARY_URL` | Cloudinary API URL: `cloudinary://api_key:api_secret@cloud_name`. |
| `SMTP_HOST` | SMTP server hostname from your email provider. |
| `SMTP_PORT` | `587` for STARTTLS or `465` for SSL. |
| `SMTP_SECURE` | `false` for port `587`, `true` for port `465`. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASSWORD` | SMTP password or app password. |
| `SMTP_FROM` | Sender, for example `Barberly <no-reply@your-domain.com>`. |
| `SMTP_AUTH_DISABLED` | Keep `false` on Vercel. |

## Google OAuth

In Google Cloud Console, add these redirect URIs:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.com/api/auth/callback/google`

Use your real Vercel domain or custom domain in production.

## Neon database

After setting `DATABASE_URL`, apply migrations before relying on auth emails:

```bash
npx prisma migrate deploy
```

The migration must create the `verification_codes` table. This table stores hashed one-time codes for:

- `two_factor`
- `password_reset`

## SMTP behavior

Credential login is a two-step flow:

1. The user enters email and password.
2. The app sends a 6-digit email code.
3. The user enters the code to finish login.

Password reset is also code-based:

1. The user enters their email at `/reset-password`.
2. The app sends a 6-digit email code.
3. The user enters the code and a new password.

Codes expire automatically and new code requests are rate-limited to one request per minute per user and purpose.

## Local setup

Copy `.env.example` to `.env.local` and fill the real values. Do not commit `.env.local`.

If you do not configure SMTP locally, credential login and password reset will return:

```text
Impossible d'envoyer le code pour le moment.
```
