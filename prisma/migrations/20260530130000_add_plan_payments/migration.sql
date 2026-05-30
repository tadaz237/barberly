-- CreateEnum
CREATE TYPE "PlanPaymentStatus" AS ENUM ('pending', 'waiting', 'accepted', 'refused', 'cancelled', 'failed');

-- CreateTable
CREATE TABLE "plan_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "provider" TEXT NOT NULL DEFAULT 'cinetpay',
    "transactionId" TEXT NOT NULL,
    "paymentToken" TEXT,
    "paymentUrl" TEXT,
    "status" "PlanPaymentStatus" NOT NULL DEFAULT 'pending',
    "providerStatus" TEXT,
    "paymentMethod" TEXT,
    "providerReference" TEXT,
    "rawResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_payments_transactionId_key" ON "plan_payments"("transactionId");

-- CreateIndex
CREATE INDEX "plan_payments_userId_idx" ON "plan_payments"("userId");

-- CreateIndex
CREATE INDEX "plan_payments_status_idx" ON "plan_payments"("status");

-- AddForeignKey
ALTER TABLE "plan_payments" ADD CONSTRAINT "plan_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
