import { prisma } from "@/src/lib/prisma";

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type ConversationItem = {
  id: string;
  reservationId: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  scheduledAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: ConversationMessage;
  messages: ConversationMessage[];
};

export type ConversationNotificationSummary = {
  unreadTotal: number;
  latestUnread?: {
    id: string;
    conversationId: string;
    senderName: string;
    body: string;
    serviceName: string;
    createdAt: string;
  };
};

function toMessage(row: {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { name: string };
}): ConversationMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.sender.name,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

function toConversation(
  row: {
  id: string;
  reservationId: string;
  providerId: string;
  clientId: string;
  updatedAt: Date;
  provider: { name: string };
  client: { name: string };
  reservation: {
    scheduledAt: Date;
    service: { name: string };
  };
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    sender: { name: string };
  }>;
  },
  viewerId: string,
): ConversationItem {
  const messages = row.messages.map(toMessage);
  const unreadCount = messages.filter(
    (message) => message.senderId !== viewerId && message.readAt === null,
  ).length;

  return {
    id: row.id,
    reservationId: row.reservationId,
    providerId: row.providerId,
    providerName: row.provider.name,
    clientId: row.clientId,
    clientName: row.client.name,
    serviceName: row.reservation.service.name,
    scheduledAt: row.reservation.scheduledAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    unreadCount,
    lastMessage: messages[messages.length - 1],
    messages,
  };
}

const CONVERSATION_INCLUDE = {
  provider: { select: { name: true } },
  client: { select: { name: true } },
  reservation: {
    select: {
      scheduledAt: true,
      service: { select: { name: true } },
    },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { name: true } } },
  },
};

export async function listConversationsForUser(
  userId: string,
): Promise<ConversationItem[]> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ providerId: userId }, { clientId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: CONVERSATION_INCLUDE,
  });

  return conversations.map((conversation) => toConversation(conversation, userId));
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
): Promise<ConversationItem | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ providerId: userId }, { clientId: userId }],
    },
    include: CONVERSATION_INCLUDE,
  });

  return conversation ? toConversation(conversation, userId) : null;
}

export async function markConversationReadForUser(
  conversationId: string,
  userId: string,
): Promise<ConversationItem | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ providerId: userId }, { clientId: userId }],
    },
    select: { id: true },
  });

  if (!conversation) return null;

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return getConversationForUser(conversationId, userId);
}

export async function getConversationNotificationSummary(
  userId: string,
): Promise<ConversationNotificationSummary> {
  const unreadWhere = {
    readAt: null,
    senderId: { not: userId },
    conversation: {
      OR: [{ providerId: userId }, { clientId: userId }],
    },
  };

  const [unreadTotal, latestUnread] = await prisma.$transaction([
    prisma.message.count({ where: unreadWhere }),
    prisma.message.findFirst({
      where: unreadWhere,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { name: true } },
        conversation: {
          select: {
            id: true,
            reservation: {
              select: {
                service: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    unreadTotal,
    latestUnread: latestUnread
      ? {
          id: latestUnread.id,
          conversationId: latestUnread.conversation.id,
          senderName: latestUnread.sender.name,
          body: latestUnread.body,
          serviceName: latestUnread.conversation.reservation.service.name,
          createdAt: latestUnread.createdAt.toISOString(),
        }
      : undefined,
  };
}

export async function sendConversationMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<ConversationItem | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      OR: [{ providerId: input.senderId }, { clientId: input.senderId }],
    },
    select: { id: true },
  });

  if (!conversation) return null;

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        body: input.body.trim(),
      },
    }),
    prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return getConversationForUser(input.conversationId, input.senderId);
}
