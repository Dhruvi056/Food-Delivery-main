/**
 * Decode JWT payload (handles base64url used in real tokens; atob alone often fails).
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function resolveSocketUserId(explicitUserId) {
  if (explicitUserId != null && String(explicitUserId).length > 0) {
    return String(explicitUserId);
  }
  const fromLs = localStorage.getItem("userId");
  if (fromLs) return String(fromLs);
  const payload = decodeJwtPayload(localStorage.getItem("token"));
  if (payload?.id != null) return String(payload.id);
  return null;
}
