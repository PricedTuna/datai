import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatSession, ChatMessage, ChatCall, Usage } from "@/interfaces/chat";
import { sendMessage as sendMessageToLLM } from "@/features/chat/chat-service";
import { estimateCost } from "@/features/chat/token-pricing";
import type { ModelId } from "@/interfaces/model";

function getApiKeyForModel(modelId: ModelId): string {
  switch (modelId) {
    case "gemini-2.5-flash-preview": {
      const key = localStorage.getItem("google-api-key");

      if (!key) {
        throw new Error("Google API key no encontrada");
      }

      return key;
    }

    case "o3-mini": {
      const key = localStorage.getItem("openai-api-key");

      if (!key) {
        throw new Error("OpenAI API key no encontrada");
      }

      return key;
    }

    case "llama3.2:1b": {
      return ""; // Ollama no requiere API key
    }

    default:
      throw new Error("Modelo no soportado");
  }
}

type ChatStore = {
  chats: ChatSession[];
  selectedChatId: string | null;
  isGenerating: boolean;

  createChat: (modelId: ModelId) => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  setChatModel: (chatId: string, modelId: ModelId) => void;

  sendMessage: (text: string) => Promise<void>;
};

const emptyUsage: Usage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      selectedChatId: null,
      isGenerating: false,

      createChat(modelId) {
        const chat: ChatSession = {
          id: crypto.randomUUID(),
          title: "New Chat",
          modelId,
          createdAt: Date.now(),

          messages: [],
          calls: [],

          totalUsage: {
            ...emptyUsage,
          },
        };

        set((state) => ({
          chats: [chat, ...state.chats].sort(
            (a, b) => b.createdAt - a.createdAt
          ),
          selectedChatId: chat.id,
        }));
      },

      selectChat(chatId) {
        set({
          selectedChatId: chatId,
        });
      },

      deleteChat(chatId) {
        const state = get();

        const remainingChats = state.chats.filter(
          (chat) => chat.id !== chatId
        );

        const newSelectedId =
          state.selectedChatId === chatId
            ? remainingChats[0]?.id ?? null
            : state.selectedChatId;

        set({
          chats: remainingChats,
          selectedChatId: newSelectedId,
        });
      },

      renameChat(chatId, title) {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, title } : c
          ),
        }));
      },

      setChatModel(chatId, modelId) {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, modelId } : c
          ),
        }));
      },

      async sendMessage(text) {
        const state = get();

        if (state.isGenerating) {
          return;
        }

        const chat = state.chats.find(
          (c) => c.id === state.selectedChatId
        );

        if (!chat) {
          return;
        }

        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: text,
          createdAt: Date.now(),
        };

        const optimisticMessages = [
          ...chat.messages,
          userMessage,
        ];

        // optimistic update
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chat.id
              ? {
                  ...c,
                  messages: optimisticMessages,
                  title:
                    c.messages.length === 0
                      ? text.slice(0, 40)
                      : c.title,
                }
              : c
          ),
          isGenerating: true,
        }));

        try {
          const apiKey = getApiKeyForModel(chat.modelId);

          const result = await sendMessageToLLM({
            modelId: chat.modelId,
            apiKey,
            messages: optimisticMessages,
          });

          const llmUsage = result.usage;

          const usage: Usage = {
            inputTokens: llmUsage.inputTokens ?? 0,
            outputTokens: llmUsage.outputTokens ?? 0,
            totalTokens: llmUsage.totalTokens ?? 0,
            estimatedCostUsd: estimateCost(
              chat.modelId,
              llmUsage.inputTokens ?? 0,
              llmUsage.outputTokens ?? 0
            ),
            inputTokenDetails: llmUsage.inputTokenDetails
              ? {
                  noCacheTokens: llmUsage.inputTokenDetails.noCacheTokens ?? undefined,
                  cacheReadTokens: llmUsage.inputTokenDetails.cacheReadTokens ?? undefined,
                  cacheWriteTokens: llmUsage.inputTokenDetails.cacheWriteTokens ?? undefined,
                }
              : undefined,
            outputTokenDetails: llmUsage.outputTokenDetails
              ? {
                  textTokens: llmUsage.outputTokenDetails.textTokens ?? undefined,
                  reasoningTokens: llmUsage.outputTokenDetails.reasoningTokens ?? undefined,
                }
              : undefined,
            raw: llmUsage.raw as Record<string, unknown> | undefined,
          };

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.text,
            createdAt: Date.now(),
          };

          const call: ChatCall = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            modelId: chat.modelId,
            usage,
          };

          set((state) => ({
            chats: state.chats.map((c) => {
              if (c.id !== chat.id) {
                return c;
              }

              return {
                ...c,
                messages: [
                  ...c.messages,
                  assistantMessage,
                ],

                calls: [...c.calls, call],

                totalUsage: {
                  inputTokens:
                    c.totalUsage.inputTokens +
                    usage.inputTokens,

                  outputTokens:
                    c.totalUsage.outputTokens +
                    usage.outputTokens,

                  totalTokens:
                    c.totalUsage.totalTokens +
                    usage.totalTokens,

                  estimatedCostUsd:
                    c.totalUsage
                      .estimatedCostUsd +
                    usage.estimatedCostUsd,

                  inputTokenDetails:
                    usage.inputTokenDetails
                      ? {
                          noCacheTokens:
                            (c.totalUsage
                              .inputTokenDetails
                              ?.noCacheTokens ??
                              0) +
                            (usage.inputTokenDetails
                              .noCacheTokens ??
                              0),
                          cacheReadTokens:
                            (c.totalUsage
                              .inputTokenDetails
                              ?.cacheReadTokens ??
                              0) +
                            (usage.inputTokenDetails
                              .cacheReadTokens ??
                              0),
                          cacheWriteTokens:
                            (c.totalUsage
                              .inputTokenDetails
                              ?.cacheWriteTokens ??
                              0) +
                            (usage.inputTokenDetails
                              .cacheWriteTokens ??
                              0),
                        }
                      : c.totalUsage
                          .inputTokenDetails,

                  outputTokenDetails:
                    usage.outputTokenDetails
                      ? {
                          textTokens:
                            (c.totalUsage
                              .outputTokenDetails
                              ?.textTokens ??
                              0) +
                            (usage.outputTokenDetails
                              .textTokens ??
                              0),
                          reasoningTokens:
                            (c.totalUsage
                              .outputTokenDetails
                              ?.reasoningTokens ??
                              0) +
                            (usage.outputTokenDetails
                              .reasoningTokens ??
                              0),
                        }
                      : c.totalUsage
                          .outputTokenDetails,
                },
              };
            }),
            isGenerating: false,
          }));
        } catch (error) {
          console.error(error);

          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              error instanceof Error
                ? `Error: ${error.message}`
                : "Something went wrong.",
            createdAt: Date.now(),
          };

          set((state) => ({
            chats: state.chats.map((c) =>
              c.id === chat.id
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      errorMessage,
                    ],
                  }
                : c
            ),
            isGenerating: false,
          }));
        }
      },
    }),
    {
      name: "ai-playground-storage",

      storage: createJSONStorage(
        () => localStorage
      ),

      partialize: (state) => ({
        chats: state.chats,
        selectedChatId:
          state.selectedChatId,
      }),
    }
  )
);