import { randomBytes } from "crypto";

/** URL-safe random token, no external deps / native binaries required. */
export function generateToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}
