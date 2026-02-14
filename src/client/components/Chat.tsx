import { useState, useEffect, useRef } from "react";
import { Conversation, UUID } from "../../shared/types";
import {
  sendMessage,
  resetSession,
  createConversation,
  getConversations,
  getConversation,
} from "../api/chat";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Menu, Plus, MessageSquare, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { SignInPage } from "./signinpage";
import { authClient } from "../lib/auth-client";

type ChatProps = {
  chat: Conversation | null;
  input: string;
  loading: boolean;
  uuid: string | undefined;
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
  uuid,
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

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  useEffect(() => {
    if (uuid && UUID_REGEX.test(uuid) && uuid !== activeSessionId) {
      handleSelectConversation(uuid as UUID);
    }
  }, [uuid]);

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
