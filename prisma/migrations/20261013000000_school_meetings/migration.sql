CREATE TABLE "SchoolMeeting" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "agenda" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "venue" TEXT,
  "classIds" TEXT[],
  "teacherIds" TEXT[],
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolMeeting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SchoolMeeting_schoolId_date_idx" ON "SchoolMeeting"("schoolId", "date");
ALTER TABLE "SchoolMeeting" ADD CONSTRAINT "SchoolMeeting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
