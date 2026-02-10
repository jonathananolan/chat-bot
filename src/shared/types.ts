export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  history: Message[];
}
