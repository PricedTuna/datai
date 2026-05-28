import type { ModelId } from "@/interfaces/model";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

/** Default LM Studio host. Override in the UI (Settings → API Keys → LM Studio)
 *  which writes localStorage["lmstudio-base-url"] (include the /v1 suffix). */
// Same-origin path proxied by Vite (see vite.config.ts) → no CORS. To hit a
// remote LM Studio directly, override with a full URL in Settings → LM Studio.
export const DEFAULT_LM_STUDIO_BASE_URL = "/lmstudio/v1";

export function getLmStudioBaseUrl(): string {
  return (typeof localStorage !== "undefined" && localStorage.getItem("lmstudio-base-url")) || DEFAULT_LM_STUDIO_BASE_URL;
}

/**
 * LM Studio exposes an OpenAI-compatible server, so it is reached through the
 * OpenAI provider with a custom baseURL. `realId` is the model identifier LM
 * Studio expects (without the registry's `lmstudio/` namespace prefix). Both
 * baseURL and apiKey are read at call time so the UI can change them live.
 */
function lmStudioModel(realId: string, thinking = false) {
  return {
    provider: "lm-studio (local)",
    isLocalThinking: thinking,
    createModel(apiKey: string) {
      const lm = createOpenAI({
        baseURL: getLmStudioBaseUrl(),
        // LM Studio may run with or without auth; send the configured key or a
        // dummy (the OpenAI provider requires a non-empty string).
        apiKey: apiKey || "lm-studio",
      });
      // .chat() targets /v1/chat/completions — the most broadly compatible endpoint.
      return lm.chat(realId);
    },
  };
}

export const MODEL_REGISTRY: Record<ModelId, {isLocalThinking?: boolean; provider: string; createModel(apiKey: string): any }> = {
  "gemini-3-flash-preview": {
    provider: "google",

    createModel(apiKey: string) {
      const google = createGoogleGenerativeAI({
        apiKey,
      });

      return google("gemini-3-flash-preview");
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

  // Qwen3.5 35B A3B — reasoner served locally via LM Studio's OpenAI endpoint.
  "lmstudio/qwen/qwen3.5-35b-a3b": lmStudioModel("qwen/qwen3.5-35b-a3b", true),
};
