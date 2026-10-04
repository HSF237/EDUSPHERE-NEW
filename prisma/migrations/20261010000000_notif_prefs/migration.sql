-- Per-user notification settings; WhatsApp link tables removed
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifPrefs" JSONB;

DROP TABLE IF EXISTS "WhatsAppMsg";
DROP TABLE IF EXISTS "WhatsAppLink";
