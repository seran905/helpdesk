-- AlterEnum
ALTER TYPE "SenderType" ADD VALUE 'ai';

-- AlterTable
ALTER TABLE "ticket" ADD COLUMN     "autoResolved" BOOLEAN NOT NULL DEFAULT false;
