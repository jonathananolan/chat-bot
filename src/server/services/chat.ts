import Anthropic from "@anthropic-ai/sdk";
import { Message } from "../../shared/types.js";

let anthropic: Anthropic;

export async function sendChatMessage(
  messages: Message[],
): Promise<string> {
  if (!anthropic) {
    anthropic = new Anthropic();
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages,
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return block.text;
}
