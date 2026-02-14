import "./App.css";

import { useState, useEffect, useRef } from "react";
import { Conversation, UUID } from "../shared/types";
import {
  sendMessage,
  resetSession,
  createConversation,
  getConversation,
  getConversations,
} from "./api/chat";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Card } from "./components/ui/card";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./components/ui/drawer";
import { Menu, Plus, MessageSquare, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { SignInPage } from "./components/signinpage";
import { authClient } from "./lib/auth-client";
import { Chat } from "./components/Chat";
import { ConversationsList } from "./components/ConversationsList";

function App() {
  const { data: session, isPending } = authClient.useSession();

  const [activeSessionId, setActiveSessionId] = useState<UUID | null>(null);
  const [chat, setChat] = useState<Conversation | null>(null);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { uuid } = useParams();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationIds, setConversationIds] = useState<UUID[]>([]);

  useEffect(() => {
    getConversations().then((data) => setConversationIds(data.sessionIds));
  }, []);

  const handleSelectConversation = async (sessionId: UUID) => {
    setActiveSessionId(sessionId);
    const conversation = await getConversation(sessionId);
    setChat(conversation);
    navigate(`/chat/${sessionId}`);
    setDrawerOpen(false);
  };

  const handleNewConversation = async () => {
    const { sessionId } = await createConversation();
    setConversationIds((prev) => [sessionId, ...prev]);
    setActiveSessionId(sessionId);
    setChat({ sessionId, messages: [] });
    setDrawerOpen(false);
    navigate(`/chat/${sessionId}`);
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

      if (uuid !== sessionId) {
        navigate(`/chat/${sessionId}`);
      }

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

  if (isPending) return <div>Loading...</div>;
  if (!session) return <SignInPage />;

  return (
    <div className="flex flex-col h-screen overflow-hidden max-w-200 mx-auto">
      <div className="flex items-center gap-2 p-4 border-b">
        <h1 className="text-lg font-semibold">Chat</h1>
      </div>

      <ConversationsList
        activeSessionId={activeSessionId}
        drawerOpen={drawerOpen}
        handleSelectConversation={handleSelectConversation}
        setDrawerOpen={setDrawerOpen}
        handleNewConversation={handleNewConversation}
        conversationIds={conversationIds}
        setConversationIds={setConversationIds}
      />
      <Chat
        chat={chat}
        input={input}
        loading={loading}
        uuid={uuid}
        handleSend={handleSend}
        setInput={setInput}
        handleReset={handleReset}
        activeSessionId={activeSessionId}
        handleSelectConversation={handleSelectConversation}
      />
    </div>
  );
}

export default App;
