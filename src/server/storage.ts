import Database from "better-sqlite3";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Message, ChatRequest, Conversation, UUID } from "../shared/types.js";

export interface Storage {
  createConversation: () => Promise<UUID>;
  getConversation: (sessionId: UUID) => Promise<Conversation | null>;
  getConversations: () => Promise<UUID[]>;
  addMessageToConversation: (
    sessionId: UUID,
    message: Message,
  ) => Promise<Conversation | null>;
  deleteConversation: (sessionId: UUID) => Promise<boolean>;
}

export class InMemoryStorage implements Storage {
  private conversations = new Map<UUID, Conversation>();

  async createConversation() {
    const sessionId = crypto.randomUUID();
    const conversation: Conversation = { sessionId, messages: [] };

    this.conversations.set(sessionId, conversation);

    return sessionId;
  }

  async getConversation(sessionId: UUID) {
    return this.conversations.get(sessionId) ?? null;
  }

  async getConversations() {
    return [...this.conversations.keys()];
  }

  async deleteConversation(sessionId: UUID) {
    return this.conversations.delete(sessionId);
  }

  async addMessageToConversation(sessionId: UUID, message: Message) {
    const conversation = this.conversations.get(sessionId);

    if (!conversation) {
      return null;
    }

    conversation.messages.push(message);
    return conversation;
  }
}

export class SqliteStorage implements Storage {
  private db: InstanceType<typeof Database>;

  constructor(dbPath = "chat.db") {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        session_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES conversations(session_id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  async createConversation(): Promise<UUID> {
    const sessionId = crypto.randomUUID();
    this.db
      .prepare("INSERT INTO conversations (session_id) VALUES (?)")
      .run(sessionId);
    return sessionId;
  }

  async getConversation(sessionId: UUID): Promise<Conversation | null> {
    const row = this.db
      .prepare("SELECT session_id FROM conversations WHERE session_id = ?")
      .get(sessionId) as { session_id: string } | undefined;
    if (!row) return null;

    const messages = this.db
      .prepare(
        "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at",
      )
      .all(sessionId) as Message[];

    return { sessionId, messages };
  }

  async getConversations(): Promise<UUID[]> {
    const rows = this.db
      .prepare("SELECT session_id FROM conversations ORDER BY created_at DESC")
      .all() as { session_id: string }[];
    return rows.map((r) => r.session_id as UUID);
  }

  async deleteConversation(sessionId: UUID): Promise<boolean> {
    const result = this.db
      .prepare("DELETE FROM conversations WHERE session_id = ?")
      .run(sessionId);
    return result.changes > 0;
  }

  async addMessageToConversation(
    sessionId: UUID,
    message: Message,
  ): Promise<Conversation | null> {
    const row = this.db
      .prepare("SELECT session_id FROM conversations WHERE session_id = ?")
      .get(sessionId) as { session_id: string } | undefined;
    if (!row) return null;

    const messageId = crypto.randomUUID();
    this.db
      .prepare(
        "INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)",
      )
      .run(messageId, sessionId, message.role, message.content);

    return this.getConversation(sessionId);
  }
}

export class SupabaseStorage implements Storage {
  private client: SupabaseClient;

  constructor() {
    const url =
      process.env.SUPABASE_PROJECT_URL ??
      (process.env.SUPABASE_PROJECT_ID
        ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`
        : undefined);
    const key = process.env.SUPABASE_SECRET_API_KEY;

    if (!url || !key) {
      throw new Error(
        "SUPABASE_PROJECT_URL (or SUPABASE_PROJECT_ID) and SUPABASE_SECRET_API_KEY must be set",
      );
    }

    this.client = createClient(url, key);
  }

  async createConversation(): Promise<UUID> {
    const sessionId = crypto.randomUUID();

    const { error } = await this.client
      .from("conversations")
      .insert({ session_id: sessionId });

    if (error) throw error;
    return sessionId;
  }

  async getConversation(sessionId: UUID): Promise<Conversation | null> {
    const { data: convo } = await this.client
      .from("conversations")
      .select("session_id")
      .eq("session_id", sessionId)
      .single();

    if (!convo) return null;

    const { data: rows } = await this.client
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const messages: Message[] = (rows ?? []).map((r) => ({
      role: r.role as Message["role"],
      content: r.content,
    }));

    return { sessionId, messages };
  }

  async getConversations(): Promise<UUID[]> {
    const { data } = await this.client
      .from("conversations")
      .select("session_id")
      .order("created_at", { ascending: false });

    return (data ?? []).map((r) => r.session_id as UUID);
  }

  async deleteConversation(sessionId: UUID): Promise<boolean> {
    // Delete messages first (Supabase doesn't cascade by default)
    await this.client
      .from("messages")
      .delete()
      .eq("session_id", sessionId);

    const { data } = await this.client
      .from("conversations")
      .delete()
      .eq("session_id", sessionId)
      .select();

    return (data?.length ?? 0) > 0;
  }

  async addMessageToConversation(
    sessionId: UUID,
    message: Message,
  ): Promise<Conversation | null> {
    const convo = await this.getConversation(sessionId);
    if (!convo) return null;

    const messageId = crypto.randomUUID();

    const { error } = await this.client.from("messages").insert({
      id: messageId,
      session_id: sessionId,
      role: message.role,
      content: message.content,
    });

    if (error) throw error;

    return this.getConversation(sessionId);
  }
}
