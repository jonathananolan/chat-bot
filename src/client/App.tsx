import "./App.css";

import { useState } from "react";
import { ChatResponse } from "../shared/types";
import { sendMessage, resetSession } from "./api/chat";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";

function App() {
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const response = await sendMessage(input, chat?.sessionId);
    setChat(response);
    setInput("");
  };

  const handleReset = async () => {
    if (chat?.sessionId) {
      const response = await resetSession(chat?.sessionId);
    }
    setChat(null);
    setInput("");
  };

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden max-w-200 mx-auto">
        <ScrollArea className="flex-1 min-h-0 p-8">
          <div className="space-y-4">
            {chat?.history.map((msg, i) => (
              <p key={i}>
                <Card
                  className={`p-8 w-[80vw] max-w-89 ${msg.role === "user" ? "ml-auto" : ""}`}
                >
                  <b>{msg.role}:</b> {msg.content}
                </Card>
              </p>
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
            <Button className="grey" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSend}>Send</Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
