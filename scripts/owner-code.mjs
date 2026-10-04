// Generates a secret owner code and the hash to store in OWNER_CODE_HASH. Only the hash goes on the server.
import crypto from "node:crypto";
const code = process.argv[2] || crypto.randomBytes(9).toString("base64url");
const hash = crypto.createHash("sha256").update(code).digest("hex");
console.log("\nYour secret code (keep it private, do not store it in the repo):\n  " + code);
console.log("\nAdd these to your hosting environment variables:\n  OWNER_CODE_HASH=" + hash + "\n  OWNER_EMAILS=your-owner-login@email.com\n");
