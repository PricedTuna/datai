import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Bot, User, Sparkles, Settings, X, Upload } from "lucide-react";
// import type { Message } from "@/interfaces/Message"; // impportar la nueva interface de mensajes (la custom con id y timestamp) y adaptar el componente para mandar mensaje 
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/interfaces/chat";
import * as Dialog from "@radix-ui/react-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { encode as toonEncode } from "@toon-format/toon";
// import { getSpec, loon } from "loon-core";
import { getSpec, loon } from "../../LOON/dist/index";
import { Checkbox } from "@/components/ui/checkbox";

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  modelLabel?: string;
}

/* ── Dot loading indicator ───────────────────────────────── */
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-foreground inline-block"
          style={{
            animation: "dot-bounce 1.2s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ modelLabel, onSendMessage }: { modelLabel?: string; onSendMessage: (msg: string) => void }) {
  const prompts = [
    "Explain quantum entanglement simply",
    "Write a haiku about neobrutalism",
    "Debug my React code",
    "Summarize this paragraph",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 pb-8">
      {/* Hero badge */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-base border-4 border-border bg-main shadow-shadow">
          <Sparkles className="size-7 text-main-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-heading">Ask me anything</h2>
          <p className="mt-1 text-sm opacity-60">
            {modelLabel ? `Using ${modelLabel}` : "Select a model to get started"}
          </p>
        </div>
      </div>

      {/* Prompt chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSendMessage(prompt)}
            className="
              rounded-base border-2 border-border bg-secondary-background
              px-4 py-3 text-left text-sm font-base
              shadow-shadow
              transition-all
              hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none
              active:translate-x-boxShadowX active:translate-y-boxShadowY active:shadow-none
              cursor-pointer
            "
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Message bubble ──────────────────────────────────────── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border shadow-shadow",
          isUser ? "bg-main" : "bg-secondary-background"
        )}
      >
        {isUser ? (
          <User className="size-4 text-main-foreground" />
        ) : (
          <Bot className="size-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[78%] rounded-base border-2 border-border px-4 py-3 shadow-shadow text-sm",
          isUser
            ? "bg-main text-main-foreground"
            : "bg-secondary-background text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content as string}</p>
      </div>
    </div>
  );
}

/* ── Main Chat component ─────────────────────────────────── */
export const Chat = ({
  messages,
  onSendMessage,
  isLoading = false,
  modelLabel,
}: ChatProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // hide system messages
  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, isLoading]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState<string>("normal");
  const [includeSpec, setIncludeSpec] = useState(false);

  const handleDatasetSend = async () => {
    if (!selectedFile) return;
    try {
      const text = await selectedFile.text();
      let payload = "";
      if (encoding === "normal") {
        payload = text;
      } else {
        const parsed = JSON.parse(text);
        if (encoding === "loon") {
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          payload = loon.toLOON(arr, { mode: 'llm' });
          if (includeSpec) {
            const spec = getSpec(payload).text;
            payload = `${spec}\n\n${payload}`;
          }
        } else if (encoding === "toon") {
          payload = toonEncode(parsed);
        }
      }
      onSendMessage(payload);
      setIsSettingsOpen(false);
      setSelectedFile(null);
      setEncoding("normal");
      setIncludeSpec(false);
    } catch (err) {
      console.error("Error formatting dataset", err);
      alert("Error processing the dataset file.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = visibleMessages.length === 0;

  return (
    <div className="flex flex-1 min-w-0 flex-col bg-background overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>

      {/* ── Messages ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {isEmpty && !isLoading ? (
          <EmptyState modelLabel={modelLabel} onSendMessage={onSendMessage} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {visibleMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* AI thinking indicator */}
            {isLoading && (
              <div className="flex items-end gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-base border-2 border-border bg-secondary-background shadow-shadow">
                  <Bot className="size-4" />
                </div>
                <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 shadow-shadow">
                  <ThinkingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ─────────────────────────────────────── */}
      <div className="border-t-4 border-border bg-background p-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          
          {/* Settings Modal Trigger */}
          <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <Dialog.Trigger asChild>
              <Button variant="neutral" size="icon" className="size-[52px] shrink-0 mb-0">
                <Settings className="size-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-base border-4 border-border bg-background p-6 shadow-shadow duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-heading">Dataset Upload</Dialog.Title>
                    <Dialog.Close asChild>
                      <Button variant="neutral" size="icon" className="size-8 hidden sm:flex">
                        <X className="size-4" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-base font-bold">Select JSON Dataset</label>
                      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-secondary-background border-2 border-border border-dashed rounded-base appearance-none cursor-pointer hover:border-main focus:outline-hidden">
                        <span className="flex flex-col items-center gap-2">
                          <Upload className="size-8 text-foreground" />
                          <span className="font-medium text-center text-foreground text-sm">
                            {selectedFile ? selectedFile.name : "Drop .json file here or click to browse"}
                          </span>
                        </span>
                        <input type="file" name="file_upload" accept=".json" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-base font-bold">Encoding Format</label>
                      <Select value={encoding} onValueChange={setEncoding}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (JSON)</SelectItem>
                          <SelectItem value="loon">LOON Encode</SelectItem>
                          <SelectItem value="toon">TOON Encode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {encoding === "loon" && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id="include-spec" 
                          checked={includeSpec} 
                          onCheckedChange={(checked) => setIncludeSpec(checked as boolean)} 
                        />
                        <label 
                          htmlFor="include-spec" 
                          className="text-sm font-base cursor-pointer"
                        >
                          Agregar spec de explicación (mejorar la comprensión)
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <Dialog.Description className="sr-only">Upload and encode a JSON dataset.</Dialog.Description>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="neutral" onClick={() => setIsSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDatasetSend} disabled={!selectedFile}>
                      Load & Send
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-grow up to 5 rows
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask something… (Enter to send, Shift+Enter for newline)"
              rows={1}
              disabled={isLoading}
              className="
                w-full
                resize-none
                rounded-base
                border-2
                border-border
                bg-secondary-background
                px-4
                py-3
                text-sm
                font-base
                shadow-shadow
                outline-none
                placeholder:opacity-50
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-all
                focus:translate-x-boxShadowX
                focus:translate-y-boxShadowY
                focus:shadow-none
              "
              style={{ minHeight: "52px", maxHeight: "140px", overflowY: "auto" }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="size-[52px] shrink-0 mb-0"
          >
            <SendHorizonal className="size-5" />
          </Button>
        </div>

        {/* Shortcut hint */}
        <p className="mx-auto mt-2 max-w-3xl text-[11px] opacity-40 text-center font-base">
          Enter ↵ to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
};