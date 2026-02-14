import express from "express";
import { ChatRequest, UUID } from "../shared/types.js";
import { sendChatMessage } from "./services/chat.js";
import { Storage } from "./storage.js";
import { getAuth } from "./utils/auth.js";
import { toNodeHandler } from "better-auth/node";

export function createApp(storage: Storage) {
  const app = express();

  app.use("/api/auth", toNodeHandler(getAuth()));

  app.use(express.json());

  app.get("/api/hello", async (_, res) => {
    const text = await sendChatMessage([
      { role: "user", content: "Hello, world!" },
    ]);
    res.json({ text });
  });

  app.post("/api/send-message", async (req, res) => {
    const { sessionId, message } = req.body as ChatRequest;

    const conversation = await storage.getConversation(sessionId);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const withUserMsg = await storage.addMessageToConversation(sessionId, {
      role: "user",
      content: message,
    });

    const text = await sendChatMessage(withUserMsg!.messages);

    const updated = await storage.addMessageToConversation(sessionId, {
      role: "assistant",
      content: text,
    });

    res.json(updated);
  });

  app.post("/api/reset", async (req, res) => {
    const { sessionId } = req.body as { sessionId: UUID };
    await storage.deleteConversation(sessionId);
    res.sendStatus(200);
  });

  app.post("/api/create-conversation", async (req, res) => {
    const sessionId = await storage.createConversation();
    res.json({ sessionId });
  });

  app.get("/api/get-conversations", async (req, res) => {
    const sessionIds = await storage.getConversations();
    res.json({ sessionIds });
  });

  app.get("/api/get-conversation/:sessionId", async (req, res) => {
    const conversation = await storage.getConversation(
      req.params.sessionId as UUID,
    );

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json(conversation);
  });

  return app;
}
