import { prisma } from "@/src/lib/prisma";

export type ConversationMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
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
  lastMessage?: ConversationMessage;
  messages: ConversationMessage[];
};

function toMessage(row: {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date;
  sender: { name: string };
}): ConversationMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.sender.name,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

function toConversation(row: {
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
    sender: { name: string };
  }>;
}): ConversationItem {
  const messages = row.messages.map(toMessage);
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

  return conversations.map(toConversation);
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

  return conversation ? toConversation(conversation) : null;
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
