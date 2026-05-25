import { useCallback, useEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chat } from "./pages/Chat";
import { useChatStore } from "@/features/chat/chat-store";
import { Cpu, BarChart2 } from "lucide-react";
import { ModelLabel } from "./interfaces/model";
import type { ModelId } from "./interfaces/model";
import { ApiKeysModal } from "@/components/api-keys-modal";
import { TokensPanel } from "@/components/tokens-panel";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const MODELS = Object.entries(ModelLabel).map(([value, label]) => ({ value: value as ModelId, label }));

function App() {
  const {
    chats,
    selectedChatId,
    isGenerating,
    createChat,
    selectChat,
    renameChat,
    setChatModel,
    sendMessage,
  } = useChatStore();

  const currentChat = chats.find((c) => c.id === selectedChatId);
  const [selectedModel, setSelectedModel] = useState<ModelId>(
    currentChat?.modelId ?? MODELS[0].value
  );
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);

  const isMobile = useIsMobile();
  const activeModel = MODELS.find((m) => m.value === selectedModel);
  const modelLabel = activeModel?.label ?? selectedModel;
  const displayLabel = isMobile && modelLabel.length > 4 ? modelLabel.slice(0, 4) + "..." : modelLabel;
  const isModelLocked = (currentChat?.messages.filter((m) => m.role !== "system").length ?? 0) > 0;

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

  const handleCloseApiKeys = () => {
    setApiKeysOpen(false);
    // Notify sidebar dot to re-check keys
    window.dispatchEvent(new Event("api-keys-updated"));
  };

  return (
    <SidebarProvider>
      <AppSidebar
        chats={[...chats].sort((a, b) => b.createdAt - a.createdAt).map((c) => ({ id: c.id, title: c.title }))}
        activeChat={currentChat?.id ?? ""}
        onSelectChat={(id) => {
          selectChat(id);
        }}
        onNewChat={handleNewChat}
        onRenameChat={renameChat}
        onSettingsClick={() => setApiKeysOpen(true)}
      />
      <SidebarInset>
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex h-16 shrink-0 items-center gap-2 sm:gap-3 border-b-2 border-border bg-background px-3 sm:px-4 overflow-hidden">
          <SidebarTrigger variant="neutral" size="icon" className="size-9 shrink-0 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none" />

          {/* vertical divider */}
          <div className="hidden sm:block h-6 w-0.5 bg-border shrink-0" />

          {/* Chat title */}
          <h1 className="text-base font-heading truncate flex-1">{currentChat?.title ?? "Loon"}</h1>

          {/* Model selector */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1 shrink-0">
              <Cpu className="size-3.5 shrink-0" />
              <span className="text-[11px] font-heading uppercase tracking-wide">Model</span>
            </div>
            {isModelLocked ? (
              /* Read-only badge when chat already has messages */
              <div className="flex h-9 w-[120px] sm:w-[175px] items-center rounded-base border-2 border-border bg-secondary-background px-3 shadow-shadow opacity-70 cursor-not-allowed shrink-0">
                <span className="text-sm font-base truncate">{displayLabel}</span>
              </div>
            ) : (
              <Select value={selectedModel} onValueChange={(v) => handleModelChange(v as ModelId)}>
                <SelectTrigger className="w-[135px] sm:w-[260px] h-9 text-sm font-base border-2 border-border shadow-shadow overflow-hidden">
                  <SelectValue className="truncate max-w-[110px] sm:max-w-none">{displayLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="font-base text-sm">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* vertical divider */}
          <div className="hidden sm:block h-6 w-0.5 bg-border shrink-0" />

          {/* Token usage toggle */}
          <Button
            onClick={() => setTokensOpen((o) => !o)}
            title="Token usage"
            variant={tokensOpen ? "default" : "neutral"}
            size="icon"
            className="size-9 shrink-0 shadow-shadow hover:shadow-none"
          >
            <BarChart2 className="size-4" />
          </Button>
        </header>

        <div className="flex flex-1 overflow-hidden min-w-0">
          <Chat
            messages={currentChat?.messages ?? []}
            isLoading={isGenerating}
            onSendMessage={(message) => sendMessage(message)}
            modelLabel={activeModel?.label}
          />
        </div>
      </SidebarInset>
      <TokensPanel
        chat={currentChat}
        open={tokensOpen}
        onClose={() => setTokensOpen(false)}
      />
      <ApiKeysModal open={apiKeysOpen} onClose={handleCloseApiKeys} />
    </SidebarProvider>
  );
}

export default App;
