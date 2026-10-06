-- AlterTable
ALTER TABLE "School" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "maxDailyPeriods" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "maxSubstitutePeriods" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "AiProposal" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("schoolId","userId","day")
);

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiProposal_schoolId_userId_status_createdAt_idx" ON "AiProposal"("schoolId", "userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TeacherAvailability_schoolId_date_idx" ON "TeacherAvailability"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAvailability_teacherId_date_kind_startTime_key" ON "TeacherAvailability"("teacherId", "date", "kind", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_schoolId_id_key" ON "Teacher"("schoolId", "id");

-- AddForeignKey
ALTER TABLE "AiProposal" ADD CONSTRAINT "AiProposal_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_schoolId_teacherId_fkey" FOREIGN KEY ("schoolId", "teacherId") REFERENCES "Teacher"("schoolId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guard runtime state and availability semantics even for service-level writes.
ALTER TABLE "AiProposal" ADD CONSTRAINT "AiProposal_status_check" CHECK ("status" IN ('PENDING','EXECUTED','CANCELLED'));
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_ai_limits_check" CHECK ("maxDailyPeriods" >= 0 AND "maxSubstitutePeriods" >= 0);
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_kind_check" CHECK (
  ("kind" = 'ABSENT' AND "startTime" IS NULL AND "endTime" IS NULL) OR
  ("kind" = 'BLOCKED' AND "startTime" IS NOT NULL AND "endTime" IS NOT NULL AND
    "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" > "startTime")
);
CREATE UNIQUE INDEX "TeacherAvailability_absence_unique" ON "TeacherAvailability" ("schoolId","teacherId","date") WHERE "kind" = 'ABSENT';
