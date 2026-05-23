import { X, Zap, ArrowDown, ArrowUp, Hash, DollarSign, Clock } from "lucide-react";
import type { ChatSession } from "@/interfaces/chat";
import { ModelLabel } from "@/interfaces/model";
import { Button } from "@/components/ui/button";

interface TokensPanelProps {
  chat: ChatSession | undefined;
  onClose: () => void;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.000_1) return "< $0.0001";
  return `$${usd.toFixed(6)}`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ── Stat tile ─────────────────────────────────────────────── */
function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 shrink-0 ${accent ?? "opacity-60"}`} />
        <span className="text-[10px] font-heading uppercase tracking-widest opacity-50">{label}</span>
      </div>
      <p className="text-lg font-heading leading-none">{value}</p>
      {sub && <p className="text-[10px] opacity-40 font-base">{sub}</p>}
    </div>
  );
}

/* ── Main panel ────────────────────────────────────────────── */
export function TokensPanel({ chat, onClose }: TokensPanelProps) {
  const usage = chat?.totalUsage;
  const calls = chat?.calls ?? [];

  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col border-l-4 border-border bg-background overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow shrink-0">
            <Zap className="size-3.5 text-main-foreground" />
          </div>
          <div>
            <p className="text-xs font-heading">Token usage</p>
            <p className="text-[10px] opacity-40 font-base">{calls.length} call{calls.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="neutral"
          size="icon"
          className="size-7"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {!chat || calls.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center opacity-40">
            <Zap className="size-8" />
            <p className="text-xs font-base">No usage yet.<br />Send a message to see stats.</p>
          </div>
        ) : (
          <>
            {/* ── Totals ── */}
            <section>
              <p className="text-[10px] font-heading uppercase tracking-widest opacity-40 mb-2">
                Session totals
              </p>
              <div className="grid grid-cols-2 gap-2">
                <StatTile
                  icon={Hash}
                  label="Total"
                  value={formatTokens(usage?.totalTokens ?? 0)}
                  sub="tokens"
                />
                <StatTile
                  icon={DollarSign}
                  label="Cost"
                  value={formatCost(usage?.estimatedCostUsd ?? 0)}
                  sub="estimated"
                />
                <StatTile
                  icon={ArrowUp}
                  label="Input"
                  value={formatTokens(usage?.inputTokens ?? 0)}
                  sub="prompt tokens"
                  accent="text-blue-500"
                />
                <StatTile
                  icon={ArrowDown}
                  label="Output"
                  value={formatTokens(usage?.outputTokens ?? 0)}
                  sub="completion tokens"
                  accent="text-emerald-500"
                />
              </div>
            </section>

            {/* ── Per-call breakdown ── */}
            <section>
              <p className="text-[10px] font-heading uppercase tracking-widest opacity-40 mb-2">
                Calls
              </p>
              <div className="flex flex-col gap-2">
                {[...calls].reverse().map((call, idx) => (
                  <div
                    key={call.id}
                    className="rounded-base border-2 border-border bg-secondary-background p-3 flex flex-col gap-2"
                  >
                    {/* call header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-heading opacity-50">
                        #{calls.length - idx}
                      </span>
                      <div className="flex items-center gap-1 opacity-40">
                        <Clock className="size-3" />
                        <span className="text-[10px] font-base">{formatTime(call.timestamp)}</span>
                      </div>
                    </div>

                    {/* model badge */}
                    <span className="self-start text-[10px] font-mono border border-border rounded px-1.5 py-0.5 bg-background opacity-70">
                      {ModelLabel[call.modelId] ?? call.modelId}
                    </span>

                    {/* token bars */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-base">
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
                          In
                        </span>
                        <span className="font-mono">{formatTokens(call.usage.inputTokens)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-base">
                        <span className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
                          Out
                        </span>
                        <span className="font-mono">{formatTokens(call.usage.outputTokens)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-heading border-t border-border pt-1 mt-0.5">
                        <span className="opacity-60">Cost</span>
                        <span className="font-mono">{formatCost(call.usage.estimatedCostUsd)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
