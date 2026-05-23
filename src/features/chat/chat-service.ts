import { generateText } from "ai";
import { MODEL_REGISTRY } from "./model-registry";
import type { ModelId } from "@/interfaces/model";
import type { ChatMessage } from "@/interfaces/chat";
import { toModelMessages } from "@/mappers/message-mapper";

type SendMessageParams = {
  modelId: ModelId;
  apiKey: string;
  messages: ChatMessage[];
};

export async function sendMessage({ modelId, apiKey, messages }: SendMessageParams) {
  const model = MODEL_REGISTRY[modelId].createModel(apiKey);

  const result =
    await generateText({ model, messages: toModelMessages(messages) });

  return {
    text: result.text,
    usage: result.usage,
  };
}
