-- AlterTable
ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'new';
ALTER TABLE "ticket" DROP COLUMN "autoResolved";
