import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Bot, User, Sparkles, Settings, X, Upload } from "lucide-react";
// import type { Message } from "@/interfaces/Message"; // impportar la nueva interface de mensajes (la custom con id y timestamp) y adaptar el componente para mandar mensaje 
import { cn } from "@/lib/utils";
import type { ChatMessage, DatasetEncoding } from "@/interfaces/chat";
import * as Dialog from "@radix-ui/react-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { encode as toonEncode } from "@toon-format/toon";
import { getLoon, getLoonVersion, type LoonSource } from "@/lib/loon-source";
import { Checkbox } from "@/components/ui/checkbox";

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  /** Records which format/mode/version a sent dataset was encoded with. */
  onEncodeDataset?: (encoding: DatasetEncoding) => void;
  isLoading?: boolean;
  modelLabel?: string;
}

/* ── LOON encoding modes (rules reference for testing) ───────── */
type LoonMode = "llm" | "full" | "compact";

const LOON_MODES: { value: LoonMode; label: string; hint: string }[] = [
  { value: "llm", label: "llm", hint: "LLM-readable. Schema once, bare decimal rows, JSON literals. No spec needed." },
  { value: "full", label: "full", hint: "Max compression for storage/transport. Base36, sequences, dictionaries. Not LLM-readable — add the spec." },
  { value: "compact", label: "compact", hint: "Small / irregular data. key: value blocks, no column schema to amortize." },
];

/** Rough chars/4 token estimate — matches the LOON CLI heuristic. */
const estTokens = (s: string) => Math.ceil(s.length / 4);

type EncodeOk = {
  ok: true;
  text: string;
  format: DatasetEncoding["format"];
  mode?: LoonMode;
  originalChars: number;
  encodedChars: number;
};
type EncodeResult = EncodeOk | { ok: false; error: string };

/**
 * Coerce parsed JSON into the record array LOON tabulates.
 * - Array → use as-is.
 * - Object wrapping a dominant array (e.g. {statuses:[...], search_metadata})
 *   → encode that array. Wrapping the whole object in [obj] instead collapses
 *   the array into one JSON blob cell (worse than raw JSON).
 * - Otherwise → wrap the single object.
 */
function toRecordArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const arrays = Object.values(parsed as Record<string, unknown>).filter(Array.isArray) as unknown[][];
    if (arrays.length > 0) {
      // Pick the largest array property as the records to tabulate.
      return arrays.reduce((a, b) => (b.length > a.length ? b : a));
    }
  }
  return [parsed];
}

/** Encode raw file text with the current settings. Shared by preview + send. */
function encodeDataset(
  fileText: string,
  encoding: string,
  loonMode: LoonMode,
  includeSpec: boolean,
  loonSource: LoonSource
): EncodeResult {
  const originalChars = fileText.length;
  try {
    if (encoding === "normal") {
      return { ok: true, text: fileText, format: "json", originalChars, encodedChars: fileText.length };
    }
    const parsed = JSON.parse(fileText);
    if (encoding === "toon") {
      // Same dominant-array extraction as LOON so both formats encode the SAME
      // records — otherwise the token comparison is apples-to-oranges.
      const out = toonEncode(toRecordArray(parsed));
      return { ok: true, text: out, format: "toon", originalChars, encodedChars: out.length };
    }
    // LOON
    const { loon, getSpec } = getLoon(loonSource);
    const arr = toRecordArray(parsed);
    let out = loon.toLOON(arr, { mode: loonMode });
    if (includeSpec) {
      const spec = getSpec(out).text;
      out = `${spec}\n\n${out}`;
    }
    return { ok: true, text: out, format: "loon", mode: loonMode, originalChars, encodedChars: out.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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
          "flex size-8 shrink-0 items-center justify-center rounded-base border-2 shadow-shadow-sm border-border",
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
          "max-w-[85%] sm:max-w-[78%] rounded-base border-2 border-border px-3 sm:px-4 py-3 shadow-shadow-sm text-sm",
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
  onEncodeDataset,
  isLoading = false,
  modelLabel,
}: ChatProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [encoding, setEncoding] = useState<string>("normal");
  const [loonMode, setLoonMode] = useState<LoonMode>("llm");
  const [includeSpec, setIncludeSpec] = useState(false);
  const [loonSource, setLoonSource] = useState<LoonSource>("npm");

  // Read the picked file once so the preview can encode it synchronously.
  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setFileText(file ? await file.text() : "");
  };

  // Live preview — re-encodes whenever any LOON rule/setting changes.
  const preview = useMemo(
    () => (fileText ? encodeDataset(fileText, encoding, loonMode, includeSpec, loonSource) : null),
    [fileText, encoding, loonMode, includeSpec, loonSource]
  );

  const resetDatasetForm = () => {
    setIsSettingsOpen(false);
    setSelectedFile(null);
    setFileText("");
    setEncoding("normal");
    setLoonMode("llm");
    setIncludeSpec(false);
  };

  const handleDatasetSend = () => {
    if (!fileText) return;
    const result = encodeDataset(fileText, encoding, loonMode, includeSpec, loonSource);
    if (!result.ok) {
      alert(`Error processing the dataset file:\n${result.error}`);
      return;
    }

    onEncodeDataset?.({
      format: result.format,
      mode: result.mode,
      loonVersion: result.format === "loon" ? getLoonVersion(loonSource) : undefined,
      loonSource: result.format === "loon" ? loonSource : undefined,
      includeSpec: result.format === "loon" ? includeSpec : undefined,
      fileName: selectedFile?.name,
      originalChars: result.originalChars,
      encodedChars: result.encodedChars,
      at: Date.now(),
    });

    onSendMessage(result.text);
    resetDatasetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = visibleMessages.length === 0;

  return (
    <div className="flex flex-1 min-w-0 flex-col bg-background overflow-hidden h-full">

      {/* ── Messages ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
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
        <div className="mx-auto flex max-w-3xl gap-2 sm:gap-3">
          
          {/* Settings Modal Trigger */}
          <Dialog.Root open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <Dialog.Trigger asChild>
              <Button variant="neutral" size="icon" className="size-[44px] sm:size-[52px] shrink-0 mb-0">
                <Settings className="size-5" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] rounded-base border-4 border-border bg-background p-6 shadow-shadow duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
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
                        <input type="file" name="file_upload" accept=".json" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
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
                      <>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold">LOON Mode</label>
                          <Select value={loonMode} onValueChange={(v) => setLoonMode(v as LoonMode)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              {LOON_MODES.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="font-mono">
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] opacity-60 font-base leading-snug">
                            {LOON_MODES.find((m) => m.value === loonMode)?.hint}
                          </p>
                        </div>

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
                            Add explanation spec{loonMode === "llm" ? " (llm mode doesn't need it)" : " (recommended for full mode)"}
                          </label>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-base font-bold">
                            LOON Source{" "}
                            <span className="font-mono font-normal opacity-60">v{getLoonVersion(loonSource)}</span>
                          </label>
                          <Select value={loonSource} onValueChange={(v) => setLoonSource(v as LoonSource)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="npm">npm (loon-core)</SelectItem>
                              <SelectItem value="local">Local build (../LOON/dist)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] opacity-50 font-base">
                            Local uses your built dist. Refresh with <code>pnpm loon:build</code>.
                          </p>
                        </div>
                      </>
                    )}

                    {/* ── Live preview ─────────────────────────── */}
                    {preview && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold">Preview</label>
                          {preview.ok && (
                            <span className="text-[11px] font-mono opacity-60">
                              {preview.format === "loon" ? `loon ${preview.mode} · v${getLoonVersion(loonSource)}` : preview.format}
                            </span>
                          )}
                        </div>

                        {preview.ok ? (
                          <>
                            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                              <span className="rounded border border-border bg-secondary-background px-1.5 py-0.5">
                                {preview.originalChars.toLocaleString()} → {preview.encodedChars.toLocaleString()} chars
                              </span>
                              <span className="rounded border border-border bg-secondary-background px-1.5 py-0.5">
                                ~{estTokens(preview.text).toLocaleString()} tokens
                              </span>
                              {preview.originalChars > 0 && (
                                <span
                                  className={cn(
                                    "rounded border border-border px-1.5 py-0.5",
                                    preview.encodedChars <= preview.originalChars
                                      ? "bg-emerald-400/20 text-emerald-700 dark:text-emerald-300"
                                      : "bg-red-400/20 text-red-700 dark:text-red-300"
                                  )}
                                >
                                  {preview.encodedChars <= preview.originalChars ? "−" : "+"}
                                  {Math.abs(Math.round((1 - preview.encodedChars / preview.originalChars) * 100))}%
                                </span>
                              )}
                            </div>
                            <pre className="text-[10px] font-mono leading-tight bg-secondary-background border-2 border-border rounded-base p-2 overflow-auto whitespace-pre max-h-[180px]">
                              {preview.text || "(empty)"}
                            </pre>
                          </>
                        ) : (
                          <pre className="text-[11px] font-mono leading-tight bg-red-400/10 border-2 border-red-400/40 text-red-700 dark:text-red-300 rounded-base p-2 overflow-auto whitespace-pre-wrap max-h-[120px]">
                            {preview.error}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>

                  <Dialog.Description className="sr-only">Upload and encode a JSON dataset.</Dialog.Description>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="neutral" onClick={resetDatasetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleDatasetSend} disabled={!selectedFile || (preview != null && !preview.ok)}>
                      Load & Send
                    </Button>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-grow up to 5 rows
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask something…"
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
              style={{ minHeight: "44px", maxHeight: "140px", overflowY: "auto" }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="size-[44px] sm:size-[52px] shrink-0 mb-0"
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