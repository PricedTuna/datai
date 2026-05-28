import type { ModelMessage } from "ai";
import type { ModelId } from "./model";

export type Provider =
  | "google"
  | "openai";

export type ChatMessage = ModelMessage & {
  id: string;
  createdAt: number;
};

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  outputTokenDetails?: {
    textTokens?: number;
    reasoningTokens?: number;
  };
  raw?: Record<string, unknown>;
};

export type ChatCall = {
  id: string;
  timestamp: number;
  modelId: ModelId;
  usage: Usage;
};

export type DatasetEncoding = {
  /** Wire format the dataset was sent as. */
  format: "json" | "loon" | "toon";
  /** LOON mode (only for format === "loon"). */
  mode?: "full" | "llm" | "compact";
  /** LOON package version used to encode (only for format === "loon"). */
  loonVersion?: string;
  /** Which LOON build produced the output (only for format === "loon"). */
  loonSource?: "npm" | "local";
  /** Whether a getSpec() decode primer was prepended (only for format === "loon"). */
  includeSpec?: boolean;
  fileName?: string;
  /** Raw JSON length, in characters. */
  originalChars?: number;
  /** Encoded payload length, in characters. */
  encodedChars?: number;
  at: number;
};

export type ChatSession = {
  id: string;
  title: string;
  modelId: ModelId;
  messages: ChatMessage[];
  totalUsage: Usage;
  calls: ChatCall[];
  createdAt: number;
  /** Datasets uploaded into this chat and the format each was encoded with. */
  encodings?: DatasetEncoding[];
};