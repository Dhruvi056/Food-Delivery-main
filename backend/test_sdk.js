import { createClient } from "@insforge/sdk";
import dotenv from "dotenv";

dotenv.config();

const INSFORGE_URL = process.env.INSFORGE_URL;
const INSFORGE_ANON_KEY = process.env.INSFORGE_ANON_KEY;

const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

insforge.auth.tokenManager.accessToken = INSFORGE_ANON_KEY;

console.log("Fetching foods...");
insforge.database.from("foods").select()
  .then(res => {
    console.log("Success:", res);
    process.exit(0);
  })
  .catch(err => {
    console.log("Error:", err);
    process.exit(1);
  });
