import { Conversation, UUID } from "../../shared/types";

export async function createConversation(): Promise<{ sessionId: UUID }> {
  const res = await fetch("/create-conversation", { method: "POST" });
  return res.json();
}

export async function getConversations(): Promise<{ sessionIds: UUID[] }> {
  const res = await fetch("/get-conversations");
  return res.json();
}

export async function getConversation(sessionId: UUID): Promise<Conversation> {
  const res = await fetch(`/get-conversation/${sessionId}`);
  return res.json();
}

export async function sendMessage(
  message: string,
  sessionId: UUID,
): Promise<Conversation> {
  const res = await fetch("/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });
  return res.json();
}

export async function resetSession(sessionId: string): Promise<void> {
  await fetch("/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}
