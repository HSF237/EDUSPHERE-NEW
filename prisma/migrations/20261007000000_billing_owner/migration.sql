-- AlterTable
ALTER TABLE "School" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "compNote" TEXT,
ADD COLUMN     "comped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "compedUntil" TIMESTAMP(3),
ADD COLUMN     "introMonthsLeft" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "paidUntil" TIMESTAMP(3),
ADD COLUMN     "planCode" TEXT,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'STARTER';

-- CreateTable
CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "demo" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "paymentId" TEXT,
    "invoiceNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_orderId_key" ON "BillingPayment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_invoiceNo_key" ON "BillingPayment"("invoiceNo");

-- CreateIndex
CREATE INDEX "BillingPayment_schoolId_createdAt_idx" ON "BillingPayment"("schoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing schools stay free (founding schools)
UPDATE "School" SET "comped" = true, "compNote" = 'Founding school (free)';
