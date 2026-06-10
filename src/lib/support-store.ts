import { prisma } from "@/src/lib/prisma";

export type SupportMessage = {
  id: string;
  senderId: string;
  senderName: string;
  fromSupport: boolean;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type SupportConversation = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  updatedAt: string;
  // Messages from support the user has not read yet.
  unreadForUser: number;
  // Messages from the user the support team has not read yet.
  unreadForAdmin: number;
  lastMessage?: SupportMessage;
  messages: SupportMessage[];
};

type SupportConversationRow = {
  id: string;
  userId: string;
  updatedAt: Date;
  user: { name: string; email: string; image: string | null };
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    sender: { name: string };
  }>;
};

const SUPPORT_INCLUDE = {
  user: { select: { name: true, email: true, image: true } },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { sender: { select: { name: true } } },
  },
};

function toConversation(row: SupportConversationRow): SupportConversation {
  const messages: SupportMessage[] = row.messages.map((message) => ({
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name,
    fromSupport: message.senderId !== row.userId,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt ? message.readAt.toISOString() : null,
  }));

  const unreadForUser = messages.filter(
    (message) => message.fromSupport && message.readAt === null,
  ).length;
  const unreadForAdmin = messages.filter(
    (message) => !message.fromSupport && message.readAt === null,
  ).length;

  return {
    id: row.id,
    userId: row.userId,
    userName: row.user.name,
    userEmail: row.user.email,
    userImage: row.user.image ?? undefined,
    updatedAt: row.updatedAt.toISOString(),
    unreadForUser,
    unreadForAdmin,
    lastMessage: messages[messages.length - 1],
    messages,
  };
}

/** The current user's support thread, or null if they never wrote to support. */
export async function getSupportConversationForUser(
  userId: string,
): Promise<SupportConversation | null> {
  const conversation = await prisma.supportConversation.findUnique({
    where: { userId },
    include: SUPPORT_INCLUDE,
  });
  return conversation ? toConversation(conversation) : null;
}

/** Sends a message from the user, creating the thread on first contact. */
export async function sendUserSupportMessage(
  userId: string,
  body: string,
): Promise<SupportConversation> {
  const conversation = await prisma.supportConversation.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        body: body.trim(),
      },
    }),
    prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  const refreshed = await prisma.supportConversation.findUniqueOrThrow({
    where: { id: conversation.id },
    include: SUPPORT_INCLUDE,
  });
  return toConversation(refreshed);
}

/** Marks support replies as read for the user viewing their own thread. */
export async function markSupportReadForUser(userId: string): Promise<void> {
  const conversation = await prisma.supportConversation.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!conversation) return;

  await prisma.supportMessage.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

/** Unread support replies for a regular user (badge on their support icon). */
export async function getSupportUnreadForUser(userId: string): Promise<number> {
  return prisma.supportMessage.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { userId },
    },
  });
}

/**
 * Unread user messages across every thread (badge on the super-admin icon).
 * A message is "from a user" when its sender is not a platform admin.
 */
export async function getSupportUnreadForAdmin(
  adminUserIds: string[],
): Promise<number> {
  return prisma.supportMessage.count({
    where: {
      readAt: null,
      senderId: { notIn: adminUserIds },
    },
  });
}

/** Every support thread that has at least one message (super-admin inbox). */
export async function listSupportConversationsForAdmin(): Promise<
  SupportConversation[]
> {
  const conversations = await prisma.supportConversation.findMany({
    where: { messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: SUPPORT_INCLUDE,
  });
  return conversations.map(toConversation);
}

export async function getSupportConversationById(
  conversationId: string,
): Promise<SupportConversation | null> {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    include: SUPPORT_INCLUDE,
  });
  return conversation ? toConversation(conversation) : null;
}

/** Sends a reply from the support team (any platform admin) to a user thread. */
export async function sendAdminSupportReply(input: {
  conversationId: string;
  adminId: string;
  body: string;
}): Promise<SupportConversation | null> {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true },
  });
  if (!conversation) return null;

  await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.adminId,
        body: input.body.trim(),
      },
    }),
    prisma.supportConversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return getSupportConversationById(input.conversationId);
}

/** Marks the user's messages as read for the support team. */
export async function markSupportReadForAdmin(
  conversationId: string,
): Promise<SupportConversation | null> {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  });
  if (!conversation) return null;

  await prisma.supportMessage.updateMany({
    where: {
      conversationId,
      senderId: conversation.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return getSupportConversationById(conversationId);
}
