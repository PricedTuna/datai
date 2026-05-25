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

export type ChatSession = {
  id: string;
  title: string;
  modelId: ModelId;
  messages: ChatMessage[];
  totalUsage: Usage;
  calls: ChatCall[];
  createdAt: number;
};