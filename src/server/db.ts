import knex, { type Knex } from "knex";

let db: Knex;

function getDb() {
  if (!db) {
    db = knex({
      client: "pg",
      connection: {
        host: process.env.SUPABASE_PROJECT_HOST,
        port: Number(process.env.SUPABASE_PORT),
        user: process.env.SUPABASE_USER,
        password: process.env.SUPABASE_DB_PASSWORD,
        database: process.env.SUPABASE_DATABASE,
      },
      migrations: {
        directory: "./src/server/migrations",
      },
    });
  }
  return db;
}

export async function runMigrations() {
  await getDb().migrate.latest();
  console.log("Database migrations complete.");
}
