import webpush, {
  type PushSubscription as WebPushSubscription,
} from "web-push";
import { prisma } from "@/src/lib/prisma";

export type BrowserPushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

type IncomingPushSubscription = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

const DEFAULT_PUSH_ICON = "/icon";
let webPushConfigured = false;

function getVapidConfig() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return null;

  return { publicKey, privateKey, subject };
}

export function isBrowserPushConfigured() {
  return Boolean(getVapidConfig());
}

function configureWebPush() {
  if (webPushConfigured) return true;

  const config = getVapidConfig();
  if (!config) return false;

  webpush.setVapidDetails(
    config.subject,
    config.publicKey,
    config.privateKey,
  );
  webPushConfigured = true;
  return true;
}

function normalizeSubscription(subscription: IncomingPushSubscription) {
  const endpoint =
    typeof subscription.endpoint === "string"
      ? subscription.endpoint.trim()
      : "";
  const p256dh =
    typeof subscription.keys?.p256dh === "string"
      ? subscription.keys.p256dh
      : "";
  const auth =
    typeof subscription.keys?.auth === "string" ? subscription.keys.auth : "";

  if (!endpoint || !p256dh || !auth) return null;

  return { endpoint, p256dh, auth };
}

export async function saveBrowserPushSubscription(input: {
  userId: string;
  subscription: IncomingPushSubscription;
  userAgent?: string | null;
}) {
  const normalized = normalizeSubscription(input.subscription);
  if (!normalized) return false;

  await prisma.pushSubscription.upsert({
    where: { endpoint: normalized.endpoint },
    create: {
      userId: input.userId,
      endpoint: normalized.endpoint,
      p256dh: normalized.p256dh,
      auth: normalized.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId: input.userId,
      p256dh: normalized.p256dh,
      auth: normalized.auth,
      userAgent: input.userAgent ?? null,
    },
  });

  return true;
}

export async function deleteBrowserPushSubscription(input: {
  userId: string;
  endpoint: unknown;
}) {
  if (typeof input.endpoint !== "string" || !input.endpoint.trim()) {
    return false;
  }

  await prisma.pushSubscription.deleteMany({
    where: { userId: input.userId, endpoint: input.endpoint.trim() },
  });

  return true;
}

function toWebPushSubscription(row: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): WebPushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

function getPushErrorStatusCode(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) {
    return null;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : null;
}

export async function sendBrowserPushToUser(
  userId: string | null | undefined,
  payload: BrowserPushPayload,
) {
  if (!userId || !configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          toWebPushSubscription(subscription),
          JSON.stringify({
            ...payload,
            icon: DEFAULT_PUSH_ICON,
          }),
        );
      } catch (error) {
        const statusCode = getPushErrorStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: subscription.id },
          });
          return;
        }

        console.error("Browser push notification failed", error);
      }
    }),
  );
}
