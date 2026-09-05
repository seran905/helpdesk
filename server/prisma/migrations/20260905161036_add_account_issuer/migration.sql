-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

-- Backfill existing rows with better-auth's local-account issuer format
-- (matches createLocalAccountIssuer(providerId) for the plain-ASCII provider
-- ids used in this app, e.g. "credential")
UPDATE "account" SET "issuer" = 'local:' || "providerId" WHERE "issuer" IS NULL;

-- Now that every row has a value, enforce NOT NULL
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;
