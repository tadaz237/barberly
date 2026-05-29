-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "gender" "Gender";

-- AlterTable
ALTER TABLE "kyc_submissions"
ADD COLUMN "gender" "Gender",
ALTER COLUMN "idType" DROP NOT NULL,
ALTER COLUMN "idFront" DROP NOT NULL;

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "coiffeurId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_coiffeurId_idx" ON "reservations"("coiffeurId");

-- CreateIndex
CREATE INDEX "reservations_scheduledAt_idx" ON "reservations"("scheduledAt");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
