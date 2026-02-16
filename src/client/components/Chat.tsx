import { useEffect, useRef } from "react";
import { Conversation, UUID } from "../../shared/types";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from "lucide-react";

type ChatProps = {
  chat: Conversation | null;
  input: string;
  loading: boolean;
  activeSessionId: string | null;

  setInput: (value: string) => void;
  handleSend: () => void;
  handleReset: () => void;
  handleSelectConversation: (id: UUID) => void;
};

export function Chat({
  chat,
  input,
  loading,
  activeSessionId,
  handleSend,
  setInput,
  handleReset,
  handleSelectConversation,
}: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  return (
    <div>
      <ScrollArea className="flex-1 min-h-0 p-8">
        <div className="space-y-4">
          {chat?.messages.map((msg, i) => (
            <div key={i}>
              <Card
                className={`p-8 w-[80vw] max-w-89 ${msg.role === "user" ? "ml-auto" : ""}`}
              >
                <b>{msg.role}:</b> {msg.content}
              </Card>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="flex items-end gap-2 p-4">
        <Textarea
          className="flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
