-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "position" TEXT,
ADD COLUMN "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Portion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Portion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Portion_classId_date_idx" ON "Portion"("classId", "date");
CREATE INDEX "Portion_schoolId_idx" ON "Portion"("schoolId");
ALTER TABLE "Portion" ADD CONSTRAINT "Portion_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Portion" ADD CONSTRAINT "Portion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Portion" ADD CONSTRAINT "Portion_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
