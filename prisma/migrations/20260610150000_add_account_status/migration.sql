CREATE TYPE "AccountStatus" AS ENUM ('active', 'blocked');

ALTER TABLE "users"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedBy" TEXT,
ADD COLUMN "blockedReason" TEXT;

CREATE INDEX "users_accountStatus_idx" ON "users"("accountStatus");
