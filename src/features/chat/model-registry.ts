import type { ModelId } from "@/interfaces/model";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { ollama } from 'ollama-ai-provider-v2';

export const MODEL_REGISTRY: Record<ModelId, {isLocalThinking?: boolean; provider: string; createModel(apiKey: string): any }> = {
  "gemini-2.5-flash-preview": {
    provider: "google",

    createModel(apiKey: string) {
      const google = createGoogleGenerativeAI({
        apiKey,
      });

      return google("gemini-2.5-flash-preview");
    },
  },

  "o3-mini": {
    provider: "openai",

    createModel(apiKey: string) {
      const openai = createOpenAI({
        apiKey,
      });

      return openai("o3-mini");
    },
  },
  "llama3.2:1b": {
    provider: "ollama (local)",

    createModel() {
      return ollama("llama3.2:1b");
    },
  },
};
