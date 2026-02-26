import dotenv from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";

// Ensure env is loaded even when cwd is not the server folder.
dotenv.config({ path: new URL("../.env", import.meta.url) });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to server/.env before starting the server."
  );
}

// Use the host from DATABASE_URL for fetch endpoints to avoid DNS issues.
neonConfig.fetchEndpoint = (host) => `https://${host}/sql`;

const sql = neon(process.env.DATABASE_URL);

export default sql;
