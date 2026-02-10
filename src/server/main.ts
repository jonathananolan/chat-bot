import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import ViteExpress from "vite-express";
import { randomUUID } from "crypto";
import { Message, ChatRequest } from "../shared/types.js";

const app = express();
app.use(express.json());
const anthropic = new Anthropic();

const sessions = new Map<string, Message[]>();

app.get("/hello", async (_, res) => {
  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello, world!" }],
  });
  res.json(message);
});

app.post("/send-message", async (req, res) => {
  const { sessionId, message } = req.body as ChatRequest;

  const currentSessionId = sessionId ?? randomUUID();
  const history = sessions.get(currentSessionId) ?? [];
  history.push({ role: "user", content: message });
  sessions.set(currentSessionId, history);

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: history,
  });
  const block = response.content[0];
  if (block.type !== "text") {
    res.status(500).json({ error: "Unexpected response type from Claude" });
    return;
  }
  history.push({ role: "assistant", content: block.text });
  res.json({ sessionId: currentSessionId, history });
});

app.post("/reset", async (req, res) => {
  const { sessionId } = req.body as { sessionId: string };
  sessions.delete(sessionId);
  res.sendStatus(200);
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000..."),
);
