-- Sign in with Google / ChatGPT: provider-scoped subject ("google:123…"), bound on first login.
ALTER TABLE "User" ADD COLUMN "oauthSub" TEXT;
CREATE UNIQUE INDEX "User_oauthSub_key" ON "User"("oauthSub");
