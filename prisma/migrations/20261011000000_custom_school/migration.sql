-- Custom school add-on: own logo/colours/domain, paid yearly
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "customUntil" TIMESTAMP(3);
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "School_customDomain_key" ON "School"("customDomain");
ALTER TABLE "BillingPayment" ADD COLUMN IF NOT EXISTS "addon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BillingPayment" ADD COLUMN IF NOT EXISTS "addonAmount" INTEGER NOT NULL DEFAULT 0;

-- Free (complimentary) schools keep their branding
UPDATE "School" SET "customUntil" = '2099-01-01' WHERE "comped" = true AND "customUntil" IS NULL;
