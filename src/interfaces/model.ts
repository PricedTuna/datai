export type ModelId = 
"gemini-2.5-flash-preview" |
"o3-mini" |
"llama3.2:1b";

export const ModelLabel: Record<ModelId, string> = {
  "gemini-2.5-flash-preview": "Gemini 2.5 Flash Preview",
  "o3-mini": "O3 Mini",
  "llama3.2:1b": "Llama 3.2 (1B)",
}