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

      let hasAddedStatusMessage = false;

      socket.onmessage = (event) => {
        try {
          const data: QueryAnswerType = JSON.parse(event.data);

          const finalMessage: Message = {
            type: MessageType.System,
            content: data.answer,
            graph: data.graph,
          };

          setMessages((prev) => [...prev.slice(0, -1), finalMessage]);
          setLoading(false);
          socket.close();
        } catch {
          const status = event.data as string;
          const systemMessage: Message = {
            type: MessageType.System,
            content: status,
          };

          setMessages((prev) => {
            if (!hasAddedStatusMessage) {
              hasAddedStatusMessage = true;
              return [...prev, systemMessage];
            } else {
              const updated = [...prev.slice(0, -1), systemMessage];
              return updated;
            }
          });
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        setMessages((prev) => [
          ...prev,
          {
            type: MessageType.System,
            content: "Error processing your request.\nPlease try again.",
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
          content: "WebSocket connection failed.\nPlease try again.",
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
