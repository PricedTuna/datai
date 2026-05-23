import { useCallback, useEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chat } from "./pages/Chat";
import { useChatStore } from "@/features/chat/chat-store";
import { Cpu } from "lucide-react";
import { ModelLabel } from "./interfaces/model";
import type { ModelId } from "./interfaces/model";

const MODELS = Object.entries(ModelLabel).map(([value, label]) => ({ value: value as ModelId, label }));

function App() {
  const {
    chats,
    selectedChatId,
    isGenerating,
    createChat,
    selectChat,
    setChatModel,
    sendMessage,
  } = useChatStore();

  const currentChat = chats.find((c) => c.id === selectedChatId);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    currentChat?.modelId ?? MODELS[0].value
  );

  const activeModel = MODELS.find((m) => m.value === selectedModel);

  // Sync dropdown to the current chat's model when switching chats
  const prevChatId = useRef(currentChat?.id);
  useEffect(() => {
    if (currentChat && currentChat.id !== prevChatId.current) {
      setSelectedModel(currentChat.modelId);
      prevChatId.current = currentChat.id;
    }
  }, [currentChat?.id, currentChat?.modelId]);

  // Create an initial chat if none exist
  useEffect(() => {
    if (chats.length === 0) {
      createChat(selectedModel);
    }
  }, []);

  const handleModelChange = useCallback(
    (modelId: ModelId) => {
      setSelectedModel(modelId);
      if (currentChat) {
        setChatModel(currentChat.id, modelId);
      }
    },
    [currentChat, setChatModel]
  );

  const handleNewChat = () => {
    createChat(selectedModel);
  };

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats.map((c) => c.title)}
        activeChat={currentChat?.title ?? ""}
        onSelectChat={(title) => {
          const chat = chats.find((c) => c.title === title);
          if (chat) selectChat(chat.id);
        }}
        onNewChat={handleNewChat}
      />
      <SidebarInset>
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b-4 border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />

          {/* vertical divider */}
          <div className="h-6 w-0.5 bg-border shrink-0" />

          {/* Chat title */}
          <h1 className="text-base font-heading truncate flex-1">{currentChat?.title ?? "Loon"}</h1>

          {/* Model selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1 shadow-shadow">
              <Cpu className="size-3.5 shrink-0" />
              <span className="text-[11px] font-heading uppercase tracking-wide">Model</span>
            </div>
            <Select value={selectedModel} onValueChange={(v) => handleModelChange(v as ModelId)}>
              <SelectTrigger className="w-[175px] h-9 text-sm font-base border-2 border-border shadow-shadow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-base text-sm">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* ── Chat area ───────────────────────────────────── */}
        <Chat
          messages={currentChat?.messages ?? []}
          isLoading={isGenerating}
          onSendMessage={(message) => sendMessage(message)}
          modelLabel={activeModel?.label}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
