-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'essential', 'pro', 'premium');

-- AlterTable
ALTER TABLE "catalogue_photos" ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'free',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
