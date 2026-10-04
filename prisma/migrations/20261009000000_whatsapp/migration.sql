-- CreateTable
CREATE TABLE "WhatsAppLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "optIn" BOOLEAN NOT NULL DEFAULT true,
    "lastInboundAt" TIMESTAMP(3),
    "lastConvId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMsg" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "dir" TEXT NOT NULL,
    "convId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMsg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLink_userId_key" ON "WhatsAppLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLink_phone_key" ON "WhatsAppLink"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppMsg_linkId_createdAt_idx" ON "WhatsAppMsg"("linkId", "createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppLink" ADD CONSTRAINT "WhatsAppLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMsg" ADD CONSTRAINT "WhatsAppMsg_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "WhatsAppLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
