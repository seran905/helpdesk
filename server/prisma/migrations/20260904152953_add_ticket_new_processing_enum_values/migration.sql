-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'new' BEFORE 'open';
ALTER TYPE "TicketStatus" ADD VALUE 'processing' BEFORE 'open';
