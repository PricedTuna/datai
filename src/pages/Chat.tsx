import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SendHorizonal } from "lucide-react";
import type { Message } from "@/interfaces/Message";

export interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
};

export const Chat = ({
  messages,
  onSendMessage,
  isLoading = false,
}: ChatProps) => {
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  // ocultar system messages
  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [visibleMessages]);

  const handleSubmit = () => {
    const trimmed = input.trim();

    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {visibleMessages.length === 0 && (
            <Card className="p-8 text-center">
              <h2 className="text-2xl font-black">
                Start chatting
              </h2>

              <p className="mt-2 text-sm opacity-80">
                Send a message to begin testing
              </p>
            </Card>
          )}

          {visibleMessages.map((message) => {
            const isUser =
              message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex ${
                  isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <Card
                  className={`
                    max-w-[85%] px-4 py-3 bg-amber-200
                  `}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </p>
                </Card>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-secondary px-4 py-3">
                <p className="animate-pulse text-sm">
                  Thinking...
                </p>
              </Card>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t-4 border-black bg-background p-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <textarea
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            rows={1}
            className="
              min-h-[52px]
              flex-1
              resize-none
              rounded-base
              border-2
              border-black
              bg-white
              px-4
              py-3
              text-sm
              shadow-shadow
              outline-none
              focus:translate-x-boxShadowX
              focus:translate-y-boxShadowY
              focus:shadow-none
            "
          />

          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="h-auto px-5"
          >
            <SendHorizonal className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}