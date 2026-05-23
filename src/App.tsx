import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chat } from "./pages/Chat";
import { useMessages } from "./hooks/useMessages";

const MODELS = [
  { value: "gemini-2.0-flash-preview", label: "Gemini 2.0 Flash Preview" },
  { value: "o3-mini", label: "O3 Mini" },
];

const CHATS = ["Chat 1", "Chat 2", "Chat 3"];

function App() {
  const { messages, isLoading, sendMessage } = useMessages();
  const [activeChat, setActiveChat] = useState(CHATS[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);

  return (
    <SidebarProvider>
      <AppSidebar
        chats={CHATS}
        activeChat={activeChat}
        onSelectChat={setActiveChat}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b-4 border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-heading">{activeChat}</h1>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>
        <Chat
          messages={messages}
          isLoading={isLoading}
          onSendMessage={(message) => sendMessage(message)}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
