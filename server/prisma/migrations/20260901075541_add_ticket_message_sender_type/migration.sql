-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('customer', 'agent');

-- AlterTable
ALTER TABLE "ticket_message" ADD COLUMN     "senderType" "SenderType" NOT NULL DEFAULT 'customer';
