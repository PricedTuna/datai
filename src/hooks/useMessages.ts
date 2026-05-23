import type { Message } from "@/interfaces/Message";
import { useState } from "react";

export const useMessages = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hello 👋",
    },
  ]);

  

  const sendMessage = (message: string) => {
    // ToDo: Implement
  };

  return {
    messages,
    isLoading,
    sendMessage,
  }
};
