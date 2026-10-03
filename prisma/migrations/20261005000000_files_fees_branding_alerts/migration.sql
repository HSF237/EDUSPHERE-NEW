-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "fileId" TEXT;

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "fileId" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "logoFileId" TEXT,
ADD COLUMN     "signatoryName" TEXT,
ADD COLUMN     "signatoryTitle" TEXT,
ADD COLUMN     "signatureFileId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "photoFileId" TEXT;

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "studentId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemId" TEXT,
    "amount" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "paidOn" DATE NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "receivedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,
    "phone" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSub" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_schoolId_idx" ON "File"("schoolId");

-- CreateIndex
CREATE INDEX "File_studentId_idx" ON "File"("studentId");

-- CreateIndex
CREATE INDEX "FeeItem_schoolId_classId_idx" ON "FeeItem"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "FeePayment_studentId_idx" ON "FeePayment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_schoolId_receiptNo_key" ON "FeePayment"("schoolId", "receiptNo");

-- CreateIndex
CREATE INDEX "AlertLog_schoolId_createdAt_idx" ON "AlertLog"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSub_endpoint_key" ON "PushSub"("endpoint");

-- CreateIndex
CREATE INDEX "PushSub_userId_idx" ON "PushSub"("userId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeItem" ADD CONSTRAINT "FeeItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "FeeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

