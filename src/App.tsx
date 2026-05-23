import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chat } from "./pages/Chat";
import { useMessages } from "./hooks/useMessages";
import { Cpu } from "lucide-react";
import { ModelLabel } from "./interfaces/model";

const MODELS = Object.entries(ModelLabel).map(([value, label]) => ({ value, label }));

let chatCounter = 3;
const INITIAL_CHATS = ["Chat 1", "Chat 2", "Chat 3"];

function App() {
  const { messages, isLoading, sendMessage } = useMessages();
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChat, setActiveChat] = useState(chats[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);

  const activeModel = MODELS.find((m) => m.value === selectedModel);

  const handleNewChat = () => {
    chatCounter += 1;
    const name = `Chat ${chatCounter}`;
    setChats((prev) => [name, ...prev]);
    setActiveChat(name);
  };

  return (
    <SidebarProvider>
      <AppSidebar chats={chats} activeChat={activeChat} onSelectChat={setActiveChat} onNewChat={handleNewChat} />
      <SidebarInset>
        {/* ── Header ──────────────────────────────────────── */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b-4 border-border bg-background px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />

          {/* vertical divider */}
          <div className="h-6 w-0.5 bg-border shrink-0" />

          {/* Chat title */}
          <h1 className="text-base font-heading truncate flex-1">{activeChat}</h1>

          {/* Model selector */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1 shadow-shadow">
              <Cpu className="size-3.5 shrink-0" />
              <span className="text-[11px] font-heading uppercase tracking-wide">Model</span>
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
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
        <Chat messages={messages} isLoading={isLoading} onSendMessage={(message) => sendMessage(message)} modelLabel={activeModel?.label} />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
