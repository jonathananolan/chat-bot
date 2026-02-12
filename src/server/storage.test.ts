import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  InMemoryStorage,
  SqliteStorage,
  SupabaseStorage,
  Storage,
} from "./storage.js";

const implementations: [
  string,
  () => Storage | Promise<Storage>,
  () => void | Promise<void>,
][] = [
  ["InMemoryStorage", () => new InMemoryStorage(), () => {}],
  ["SqliteStorage", () => new SqliteStorage(":memory:"), () => {}],
];

if (
  (process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_PROJECT_ID) &&
  process.env.SUPABASE_SECRET_API_KEY
) {
  let supabaseStorage: SupabaseStorage;
  let migrated = false;

  async function cleanSupabase() {
    if (!supabaseStorage) return;
    const ids = await supabaseStorage.getConversations();
    for (const id of ids) {
      await supabaseStorage.deleteConversation(id);
    }
  }

  implementations.push([
    "SupabaseStorage",
    async () => {
      if (!migrated) {
        const { runMigrations } = await import("./db.js");
        await runMigrations();
        migrated = true;
      }
      if (!supabaseStorage) {
        supabaseStorage = new SupabaseStorage();
      }
      await cleanSupabase();
      return supabaseStorage;
    },
    () => cleanSupabase(),
  ]);
}

describe.each(implementations)("%s", (_name, createStorage, cleanup) => {
  let storage: Storage;

  beforeEach(async () => {
    storage = await createStorage();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe("createConversation", () => {
    it("should return a sessionId", async () => {
      const sessionId = await storage.createConversation();

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe("string");
    });

    it("should create conversations with unique sessionIds", async () => {
      const id1 = await storage.createConversation();
      const id2 = await storage.createConversation();

      expect(id1).not.toBe(id2);
    });
  });

  describe("getConversation", () => {
    it("should return a conversation that exists", async () => {
      const sessionId = await storage.createConversation();
      const retrieved = await storage.getConversation(sessionId);

      expect(retrieved).toEqual({ sessionId, messages: [] });
    });

    it("should return null for a sessionId that doesn't exist", async () => {
      const result = await storage.getConversation(
        "fake-id-that-does-not-exist",
      );

      expect(result).toBeNull();
    });
  });

  describe("getConversations", () => {
    it("should return empty array when no conversations exist", async () => {
      expect(await storage.getConversations()).toEqual([]);
    });

    it("should return all sessionIds", async () => {
      const id1 = await storage.createConversation();
      const id2 = await storage.createConversation();

      const ids = await storage.getConversations();

      expect(ids).toHaveLength(2);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });
  });

  describe("addMessageToConversation", () => {
    it("should add a message to an existing conversation", async () => {
      const sessionId = await storage.createConversation();
      const message = { role: "user" as const, content: "Hello!" };

      const result = await storage.addMessageToConversation(
        sessionId,
        message,
      );

      expect(result).not.toBeNull();
      expect(result!.messages).toHaveLength(1);
      expect(result!.messages[0]).toEqual({ role: "user", content: "Hello!" });
    });

    it("should return null when conversation doesn't exist", async () => {
      const message = { role: "user" as const, content: "Hello!" };
      const result = await storage.addMessageToConversation(
        "fake-id-nope-nope" as any,
        message,
      );

      expect(result).toBeNull();
    });

    it("should keep messages in order", async () => {
      const sessionId = await storage.createConversation();

      await storage.addMessageToConversation(sessionId, {
        role: "user",
        content: "Hi",
      });
      await storage.addMessageToConversation(sessionId, {
        role: "assistant",
        content: "Hello! How can I help?",
      });
      await storage.addMessageToConversation(sessionId, {
        role: "user",
        content: "What is TypeScript?",
      });

      const result = await storage.getConversation(sessionId);

      expect(result!.messages).toHaveLength(3);
      expect(result!.messages[0].role).toBe("user");
      expect(result!.messages[1].role).toBe("assistant");
      expect(result!.messages[2].content).toBe("What is TypeScript?");
    });
  });

  describe("deleteConversation", () => {
    it("should delete an existing conversation", async () => {
      const sessionId = await storage.createConversation();

      const deleted = await storage.deleteConversation(sessionId);

      expect(deleted).toBe(true);
      expect(await storage.getConversation(sessionId)).toBeNull();
    });

    it("should return false for non-existent conversation", async () => {
      const deleted = await storage.deleteConversation(
        "fake-id-nope-nope" as any,
      );

      expect(deleted).toBe(false);
    });
  });
});
