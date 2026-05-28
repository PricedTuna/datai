import type { ModelId } from "@/interfaces/model";

// Partial: any model not listed (e.g. LM Studio local models) is free (0/0).
const MODEL_PRICING: Partial<Record<ModelId, { inputPerMillion: number; outputPerMillion: number }>> = {
  "gemini-3-flash-preview": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
  },

  "o3-mini": {
    inputPerMillion: 1.10,
    outputPerMillion: 4.40,
  },

  // Qwen (lmstudio/*, local) — unlisted → free via the fallback below.
};

export function estimateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
) {
  const pricing =
    MODEL_PRICING[modelId] ?? { inputPerMillion: 0, outputPerMillion: 0 };

  const inputCost =
    (inputTokens / 1_000_000) *
    pricing.inputPerMillion;

  const outputCost =
    (outputTokens / 1_000_000) *
    pricing.outputPerMillion;

  return inputCost + outputCost;
}