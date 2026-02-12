import "./App.css";

import { useState, useEffect } from "react";
import { Conversation, UUID } from "../shared/types";
import {
  sendMessage,
  resetSession,
  createConversation,
  getConversations,
  getConversation,
} from "./api/chat";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer";
import { Menu, Plus, MessageSquare, Loader2 } from "lucide-react";

function App() {
  const [conversationIds, setConversationIds] = useState<UUID[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<UUID | null>(null);
  const [chat, setChat] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConversations().then((data) => setConversationIds(data.sessionIds));
  }, []);

  const handleNewConversation = async () => {
    const { sessionId } = await createConversation();
    setConversationIds((prev) => [sessionId, ...prev]);
    setActiveSessionId(sessionId);
    setChat({ sessionId, messages: [] });
    setDrawerOpen(false);
  };

  const handleSelectConversation = async (sessionId: UUID) => {
    setActiveSessionId(sessionId);
    const conversation = await getConversation(sessionId);
    setChat(conversation);
    setDrawerOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      let sessionId = activeSessionId;

      if (!sessionId) {
        const result = await createConversation();
        sessionId = result.sessionId;
        setConversationIds((prev) => [sessionId!, ...prev]);
        setActiveSessionId(sessionId);
      }

      const userMessage = input;
      setChat((prev) => ({
        sessionId: sessionId!,
        messages: [
          ...(prev?.messages ?? []),
          { role: "user", content: userMessage },
        ],
      }));
      setInput("");

      const response = await sendMessage(userMessage, sessionId);
      setChat(response);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (activeSessionId) {
      await resetSession(activeSessionId);
      setConversationIds((prev) => prev.filter((id) => id !== activeSessionId));
    }
    setActiveSessionId(null);
    setChat(null);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden max-w-200 mx-auto">
      <div className="flex items-center gap-2 p-4 border-b">
        <Drawer direction="left" open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Conversations</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <Button className="w-full mb-4" onClick={handleNewConversation}>
                <Plus className="size-4 mr-2" />
                New conversation
              </Button>
              <div className="space-y-1">
                {conversationIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSelectConversation(id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-accent ${id === activeSessionId ? "bg-accent" : ""}`}
                  >
                    <MessageSquare className="size-4 shrink-0" />
                    <span className="truncate">{id.slice(0, 8)}...</span>
                  </button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <h1 className="text-lg font-semibold">Chat</h1>
      </div>

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

export default App;
