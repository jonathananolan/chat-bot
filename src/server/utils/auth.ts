import { betterAuth } from "better-auth";
import { Pool } from "pg";

let _auth: ReturnType<typeof betterAuth>;

export function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
      emailAndPassword: {
        enabled: true,
      },
    });
  }
  return _auth;
}
