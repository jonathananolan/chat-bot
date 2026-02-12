import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import ViteExpress from "vite-express";
import { SqliteStorage, SupabaseStorage } from "./storage.js";
import { createApp } from "./app.js";
import { runMigrations } from "./db.js";

const storage = new SupabaseStorage();
const app = createApp(storage);

await runMigrations();

ViteExpress.listen(app, 3005, () =>
  console.log("Server is listening on port 3005..."),
);
