import "./App.css";

import { useState } from "react";
import { ChatResponse } from "../shared/types";
import { sendMessage } from "./api/chat";

function App() {
  const [chat, setChat] = useState<ChatResponse | null>(null);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const response = await sendMessage(input, chat?.sessionId);
    setChat(response);
    setInput("");
  };

  return (
    <>
      <div>
        {chat?.history.map((msg, i) => (
          <p key={i}><b>{msg.role}:</b> {msg.content}</p>
        ))}
      </div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </>
  );
}

export default App;
