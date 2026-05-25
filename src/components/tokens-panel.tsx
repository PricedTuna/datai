import { X, Zap, ArrowDown, ArrowUp, Hash, DollarSign, Clock, Braces, ChevronDown, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import type { ChatSession, Usage } from "@/interfaces/chat";
import { ModelLabel } from "@/interfaces/model";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/sidebar";

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

/* ── Detail group / row ────────────────────────────────────── */
function DetailGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-base opacity-50">{label}</p>
      <div className="flex flex-col gap-0.5 pl-3">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-base">
      <span className="opacity-60">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

/* ── Raw data toggle ───────────────────────────────────────── */
function RawDataToggle({ raw }: { raw: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border pt-2 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-base opacity-40 hover:opacity-70 transition-opacity cursor-pointer"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Braces className="size-3" />
        Raw data
      </button>
      {open && (
        <pre className="mt-1.5 text-[9px] font-mono leading-tight opacity-50 bg-background border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
          {JSON.stringify(raw, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ── Call card ─────────────────────────────────────────────── */
function CallCard({ call, index }: { call: { usage: Usage; modelId: string; timestamp: number; id: string }; index: number }) {
  return (
    <div className="rounded-base border-2 border-border bg-secondary-background p-3 flex flex-col gap-2">
      {/* header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-heading opacity-50">#{index}</span>
        <div className="flex items-center gap-1 opacity-40">
          <Clock className="size-3" />
          <span className="text-[10px] font-base">{formatTime(call.timestamp)}</span>
        </div>
      </div>

      {/* model badge */}
      <span className="self-start text-[10px] font-mono border border-border rounded px-1.5 py-0.5 bg-background opacity-70">
        {ModelLabel[call.modelId as keyof typeof ModelLabel] ?? call.modelId}
      </span>

      {/* token lines */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] font-base">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
            In
          </span>
          <span className="font-mono">{formatTokens(call.usage.inputTokens)}</span>
        </div>
        {call.usage.inputTokenDetails?.cacheReadTokens ? (
          <div className="flex items-center justify-between text-[10px] font-base pl-4 opacity-60">
            <span>Cache read</span>
            <span className="font-mono">{formatTokens(call.usage.inputTokenDetails.cacheReadTokens)}</span>
          </div>
        ) : null}
        {call.usage.inputTokenDetails?.cacheWriteTokens ? (
          <div className="flex items-center justify-between text-[10px] font-base pl-4 opacity-60">
            <span>Cache write</span>
            <span className="font-mono">{formatTokens(call.usage.inputTokenDetails.cacheWriteTokens)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-[10px] font-base">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
            Out
          </span>
          <span className="font-mono">{formatTokens(call.usage.outputTokens)}</span>
        </div>
        {call.usage.outputTokenDetails?.reasoningTokens ? (
          <div className="flex items-center justify-between text-[10px] font-base pl-4 opacity-60">
            <span>Reasoning</span>
            <span className="font-mono">{formatTokens(call.usage.outputTokenDetails.reasoningTokens)}</span>
          </div>
        ) : null}
        {call.usage.outputTokenDetails?.textTokens ? (
          <div className="flex items-center justify-between text-[10px] font-base pl-4 opacity-60">
            <span>Text</span>
            <span className="font-mono">{formatTokens(call.usage.outputTokenDetails.textTokens)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-[10px] font-heading border-t border-border pt-1 mt-0.5">
          <span className="opacity-60">Cost</span>
          <span className="font-mono">{formatCost(call.usage.estimatedCostUsd)}</span>
        </div>
      </div>

      {/* raw data toggle */}
      {call.usage.raw && <RawDataToggle raw={call.usage.raw} />}
    </div>
  );
}

/* ── Download handler ────────────────────────────────────────── */
function useDownloadJson(chat: ChatSession | undefined) {
  return () => {
    if (!chat) return;

    const payload = {
      session: {
        title: chat.title,
        model: ModelLabel[chat.modelId as keyof typeof ModelLabel] ?? chat.modelId,
        createdAt: new Date(chat.createdAt).toISOString(),
        totalUsage: chat.totalUsage,
      },
      breakdown: {
        input: chat.totalUsage.inputTokenDetails ?? {},
        output: chat.totalUsage.outputTokenDetails ?? {},
      },
      calls: chat.calls.map((call) => ({
        id: call.id,
        timestamp: new Date(call.timestamp).toISOString(),
        model: ModelLabel[call.modelId as keyof typeof ModelLabel] ?? call.modelId,
        usage: call.usage,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-usage-${chat.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

/* ── Main panel ────────────────────────────────────────────── */
export function TokensPanel({ chat, onClose }: TokensPanelProps) {
  const usage = chat?.totalUsage;
  const calls = chat?.calls ?? [];
  const handleDownload = useDownloadJson(chat);

  const chartData = [
    { category: "Input", tokens: usage?.inputTokens ?? 0, fill: "var(--color-chart-2)" },
    { category: "Output", tokens: usage?.outputTokens ?? 0, fill: "var(--color-chart-4)" },
  ];

  const chartConfig = {
    tokens: { label: "Tokens" },
    Input: { label: "Input", color: "var(--color-chart-2)" },
    Output: { label: "Output", color: "var(--color-chart-4)" },
  };

  return (
    <Sidebar side="right" collapsible="none" className="w-[280px] shrink-0 border-l-4 border-border">
      <SidebarHeader className="flex-row items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs font-heading">Token usage</p>
            <p className="text-[10px] opacity-40 font-base">{calls.length} call{calls.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            variant="neutral"
            size="icon"
            className="size-7"
            title="Download JSON"
          >
            <Download className="size-3.5" />
          </Button>
          <Button
            onClick={onClose}
            variant="neutral"
            size="icon"
            className="size-7"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 flex flex-col gap-5">
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

              {/* Chart */}
              <div className="rounded-base border-2 border-border bg-secondary-background p-3 flex flex-col gap-2 shadow-shadow mt-4">
                <p className="text-[10px] font-heading uppercase tracking-widest opacity-40">Input vs Output</p>
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" opacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-foreground)', fontSize: 10, fontFamily: 'inherit' }} width={50} />
                    <ChartTooltip cursor={{ fill: 'var(--color-border)', opacity: 0.1 }} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="tokens" radius={2} strokeWidth={2} stroke="var(--color-border)" />
                  </BarChart>
                </ChartContainer>
              </div>

              {/* ── Detail breakdown ── */}
              {(usage?.inputTokenDetails || usage?.outputTokenDetails) && (
                <div className="rounded-base border-2 border-border bg-secondary-background p-3 flex flex-col gap-2 shadow-shadow mt-4">
                  <p className="text-[10px] font-heading uppercase tracking-widest opacity-40">Token breakdown</p>
                  {usage?.inputTokenDetails && (
                    <DetailGroup label="Input">
                      {usage.inputTokenDetails.noCacheTokens != null && (
                        <DetailRow label="No cache" value={formatTokens(usage.inputTokenDetails.noCacheTokens)} />
                      )}
                      {usage.inputTokenDetails.cacheReadTokens != null && (
                        <DetailRow label="Cache read" value={formatTokens(usage.inputTokenDetails.cacheReadTokens)} />
                      )}
                      {usage.inputTokenDetails.cacheWriteTokens != null && (
                        <DetailRow label="Cache write" value={formatTokens(usage.inputTokenDetails.cacheWriteTokens)} />
                      )}
                    </DetailGroup>
                  )}
                  {usage?.outputTokenDetails && (
                    <DetailGroup label="Output">
                      {usage.outputTokenDetails.textTokens != null && (
                        <DetailRow label="Text" value={formatTokens(usage.outputTokenDetails.textTokens)} />
                      )}
                      {usage.outputTokenDetails.reasoningTokens != null && (
                        <DetailRow label="Reasoning" value={formatTokens(usage.outputTokenDetails.reasoningTokens)} />
                      )}
                    </DetailGroup>
                  )}
                </div>
              )}
            </section>

            {/* ── Per-call breakdown ── */}
            <section>
              <p className="text-[10px] font-heading uppercase tracking-widest opacity-40 mb-2">
                Calls
              </p>
              <div className="flex flex-col gap-2">
                {[...calls].reverse().map((call, idx) => (
                  <CallCard key={call.id} call={call} index={calls.length - idx} />
                ))}
              </div>
            </section>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
