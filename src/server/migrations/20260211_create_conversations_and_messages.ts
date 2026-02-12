import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("conversations", (table) => {
    table.text("session_id").primary();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("messages", (table) => {
    table.text("id").primary();
    table
      .text("session_id")
      .notNullable()
      .references("session_id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table.text("role").notNullable();
    table.text("content").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversations");
}
