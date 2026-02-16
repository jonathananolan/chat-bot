import "./App.css";

import { useState, useEffect } from "react";
import { Conversation, UUID } from "../shared/types";
import {
  sendMessage,
  resetSession,
  createConversation,
  getConversation,
  getConversations,
} from "./api/chat";
import { useParams, useNavigate } from "react-router";
import { SignInPage } from "./components/signinpage";
import { authClient } from "./lib/auth-client";
import { Chat } from "./components/Chat";
import { ConversationsList } from "./components/ConversationsList";

function App() {
  // Force authenticaiton before loading main app
  const { data: session, isPending } = authClient.useSession();
  const [activeSessionId, setActiveSessionId] = useState<UUID | null>(null);

  if (isPending) return <div>Loading...</div>;
  if (!session) return <SignInPage />;

  // Deal with when a user comes directly to a specific URL + update URL when active conversation changes
  const { uuid } = useParams();

  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  useEffect(() => {
    if (uuid && UUID_REGEX.test(uuid) && uuid !== activeSessionId) {
      handleSelectConversation(uuid as UUID);
    }
  }, [uuid]);

  const [chat, setChat] = useState<Conversation | null>(null);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationIds, setConversationIds] = useState<UUID[]>([]);

  //Load all the existing conversations for this user when they load the app.
  useEffect(() => {
    getConversations().then((data) => setConversationIds(data.sessionIds));
  }, []);

  //When a user clicks on a conversation pull that convo's details from the API and close the conversation drawer.
  const handleSelectConversation = async (sessionId: UUID) => {
    setActiveSessionId(sessionId);
    const conversation = await getConversation(sessionId);
    setChat(conversation);
    navigate(`/chat/${sessionId}`);
    setDrawerOpen(false);
  };

  // Create a new conversation
  const handleNewConversation = async () => {
    const { sessionId } = await createConversation();
    setConversationIds((prev) => [sessionId, ...prev]);
    setActiveSessionId(sessionId);
    setChat({ sessionId, messages: [] });
    setDrawerOpen(false);
    navigate(`/chat/${sessionId}`);
  };

  //Send a message (creating a new conversation if needed too)
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

  //Delete a conversation
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
