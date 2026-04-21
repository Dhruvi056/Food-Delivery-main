import { createClient } from "@insforge/sdk";

const INSFORGE_URL = "https://8s8fn5ux.us-east.insforge.app";
const INSFORGE_ANON_KEY =
  process.env.INSFORGE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTEwOTB9.oy4SpaJNyorLUcHBHJKfPn5Ra04X3e1QOTXLxQ36dGQ";

const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

// Inject the anon key as the access token so the SDK can sign all
// server-side database requests without requiring a user login session.
insforge.auth.tokenManager.accessToken = INSFORGE_ANON_KEY;

export default insforge;
