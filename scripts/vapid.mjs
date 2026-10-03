// Prints a new key pair for browser push notifications. Put the two values in your hosting environment:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (and VAPID_SUBJECT=mailto:you@example.com)
import { generateKeyPairSync } from "crypto";
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
const pub = publicKey.export({ format: "jwk" }), prv = privateKey.export({ format: "jwk" });
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);
console.log("VAPID_PUBLIC_KEY=" + raw.toString("base64url"));
console.log("VAPID_PRIVATE_KEY=" + prv.d);
