"use client"

import { ChatInput } from "@/components/chat-input/chat-input";
import { ChatPanel } from "@/components/chat-panel/chat-panel";
import { Message, MessageType } from "@/types/message-type";
import { QueryAnswerType } from "@/types/query-answer-type";
import { useState } from "react";
import { getQueryWebsocket } from "./web-socket";

export function ChatUI() {
  const [loading, setLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);

  async function submit() {
  setLoading(true);
  const message: Message = {
    type: MessageType.User,
    content: inputText,
  };
  setMessages((prev) => [...prev, message]);
  setInputText("");

  try {
    const socket = getQueryWebsocket();

    socket.onopen = () => {
      socket.send(message.content);
    };

    socket.onmessage = (event) => {
      const data: QueryAnswerType = JSON.parse(event.data);
      const responseMessage: Message = {
        type: MessageType.System,
        content: data.answer,
        graph: data.graph,
      };
      setMessages((prev) => [...prev, responseMessage]);
      setLoading(false);
      socket.close(); 
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: MessageType.System,
          content: "Error processing your request.\n Please try again",
        },
      ]);
      setLoading(false);
    };

  } catch (err) {
    console.error(err);
    setMessages((prev) => [
      ...prev,
      {
        type: MessageType.System,
        content: "WebSocket connection failed.\n Please try again",
      },
    ]);
    setLoading(false);
  }
}


  return (
    <div className="w-full h-full grid grid-rows-[1fr_auto]">
        <div className="overflow-y-auto">
            <ChatPanel messages={messages} />
        </div>
        <ChatInput
            loading={loading}
            setLoading={setLoading}
            inputText={inputText}
            setInputText={setInputText}
            onSubmit={submit}
        />
    </div>

  );
}
