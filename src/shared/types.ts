export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  sessionId: UUID;
  message: string;
}

export interface Conversation {
  sessionId: UUID;
  messages: Message[];
}
