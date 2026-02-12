import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { InMemoryStorage } from "./storage.js";

vi.mock("./services/chat.js", () => ({
  sendChatMessage: vi.fn().mockResolvedValue("mocked response"),
}));

describe("API routes", () => {
  let storage: InMemoryStorage;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    storage = new InMemoryStorage();
    app = createApp(storage);
  });

  describe("POST /create-conversation", () => {
    it("should create a conversation and return a sessionId", async () => {
      const res = await request(app).post("/create-conversation");

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBeDefined();
    });
  });

  describe("GET /get-conversations", () => {
    it("should return empty array when no conversations exist", async () => {
      const res = await request(app).get("/get-conversations");

      expect(res.status).toBe(200);
      expect(res.body.sessionIds).toEqual([]);
    });

    it("should return all conversation ids", async () => {
      const res1 = await request(app).post("/create-conversation");
      const res2 = await request(app).post("/create-conversation");

      const res = await request(app).get("/get-conversations");

      expect(res.body.sessionIds).toHaveLength(2);
      expect(res.body.sessionIds).toContain(res1.body.sessionId);
      expect(res.body.sessionIds).toContain(res2.body.sessionId);
    });
  });

  describe("GET /get-conversation/:sessionId", () => {
    it("should return a conversation by sessionId", async () => {
      const created = await request(app).post("/create-conversation");
      const sessionId = created.body.sessionId;

      const res = await request(app).get(`/get-conversation/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.messages).toEqual([]);
    });

    it("should return 404 for unknown sessionId", async () => {
      const res = await request(app).get(
        "/get-conversation/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      );

      expect(res.status).toBe(404);
    });
  });

  describe("POST /send-message", () => {
    it("should send a message and get a response", async () => {
      const created = await request(app).post("/create-conversation");
      const sessionId = created.body.sessionId;

      const res = await request(app)
        .post("/send-message")
        .send({ sessionId, message: "Hello" });

      expect(res.status).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0]).toEqual({
        role: "user",
        content: "Hello",
      });
      expect(res.body.messages[1]).toEqual({
        role: "assistant",
        content: "mocked response",
      });
    });

    it("should return 404 when conversation does not exist", async () => {
      const res = await request(app)
        .post("/send-message")
        .send({
          sessionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          message: "Hello",
        });

      expect(res.status).toBe(404);
    });

    it("should accumulate messages across multiple sends", async () => {
      const created = await request(app).post("/create-conversation");
      const sessionId = created.body.sessionId;

      await request(app)
        .post("/send-message")
        .send({ sessionId, message: "First" });

      const res = await request(app)
        .post("/send-message")
        .send({ sessionId, message: "Second" });

      expect(res.body.messages).toHaveLength(4);
      expect(res.body.messages[0].content).toBe("First");
      expect(res.body.messages[1].content).toBe("mocked response");
      expect(res.body.messages[2].content).toBe("Second");
      expect(res.body.messages[3].content).toBe("mocked response");
    });
  });

  describe("POST /reset", () => {
    it("should delete a conversation", async () => {
      const created = await request(app).post("/create-conversation");
      const sessionId = created.body.sessionId;

      const res = await request(app).post("/reset").send({ sessionId });

      expect(res.status).toBe(200);

      const getRes = await request(app).get(
        `/get-conversation/${sessionId}`,
      );
      expect(getRes.status).toBe(404);
    });
  });
});
