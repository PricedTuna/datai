import type { ModelId } from "@/interfaces/model";

const MODEL_PRICING: Record<ModelId, { inputPerMillion: number; outputPerMillion: number }> = {
  "gemini-3-flash-preview": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
  },

  "o3-mini": {
    inputPerMillion: 1.10,
    outputPerMillion: 4.40,
  },

  "llama3.2:1b": {
    inputPerMillion: 0,
    outputPerMillion: 0,
  },
};

export function estimateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
) {
  const pricing =
    MODEL_PRICING[modelId];

  const inputCost =
    (inputTokens / 1_000_000) *
    pricing.inputPerMillion;

  const outputCost =
    (outputTokens / 1_000_000) *
    pricing.outputPerMillion;

  return inputCost + outputCost;
}