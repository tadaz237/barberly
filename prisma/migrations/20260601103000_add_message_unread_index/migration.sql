-- Speed up unread message lookups for chat notifications.

CREATE INDEX "messages_conversationId_senderId_readAt_idx"
ON "messages"("conversationId", "senderId", "readAt");
