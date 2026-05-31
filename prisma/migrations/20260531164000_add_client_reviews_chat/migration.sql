-- Client accounts, controlled reviews, and reservation chat.

CREATE TYPE "UserRole" AS ENUM ('client', 'professional');
CREATE TYPE "ReviewStatus" AS ENUM ('published', 'hidden');

ALTER TABLE "users"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'professional';

ALTER TABLE "reservations"
ADD COLUMN "clientId" TEXT,
ADD COLUMN "clientEmail" TEXT;

CREATE INDEX "reservations_clientId_idx" ON "reservations"("clientId");

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "reviews" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "serviceId" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "status" "ReviewStatus" NOT NULL DEFAULT 'published',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE UNIQUE INDEX "reviews_reservationId_key" ON "reviews"("reservationId");
CREATE UNIQUE INDEX "reviews_clientId_providerId_key" ON "reviews"("clientId", "providerId");
CREATE INDEX "reviews_providerId_status_idx" ON "reviews"("providerId", "status");
CREATE INDEX "reviews_clientId_idx" ON "reviews"("clientId");

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "conversations" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_reservationId_key" ON "conversations"("reservationId");
CREATE INDEX "conversations_providerId_updatedAt_idx" ON "conversations"("providerId", "updatedAt");
CREATE INDEX "conversations_clientId_updatedAt_idx" ON "conversations"("clientId", "updatedAt");

ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversations"
ADD CONSTRAINT "conversations_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

ALTER TABLE "messages"
ADD CONSTRAINT "messages_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
ADD CONSTRAINT "messages_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
