import type { ChatMessage } from "@/interfaces/chat";
import type { ModelMessage } from "ai";

export const toModelMessages = (messages: ChatMessage[]): ModelMessage[] => {
  return messages.map(({ id, createdAt, ...rest }) => ({ ...rest }));
}