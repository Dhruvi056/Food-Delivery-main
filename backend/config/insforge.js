import { createClient } from "@insforge/sdk";

const INSFORGE_URL = process.env.INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY;

if (!INSFORGE_URL || !INSFORGE_ANON_KEY) {
  throw new Error("CRITICAL: Missing INSFORGE_URL or INSFORGE_ANON_KEY in environment variables.");
}

const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

// Inject the anon key as the access token so the SDK can sign all
// server-side database requests without requiring a user login session.
insforge.auth.tokenManager.accessToken = INSFORGE_ANON_KEY;

export default insforge;
