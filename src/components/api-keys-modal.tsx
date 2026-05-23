import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Key, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiKeysModalProps {
  open: boolean;
  onClose: () => void;
}

interface KeyState {
  value: string;
  visible: boolean;
  saved: boolean;
}

const LS_OPENAI = "openai-api-key";
const LS_GOOGLE = "google-api-key";

export function ApiKeysModal({ open, onClose }: ApiKeysModalProps) {
  const [openai, setOpenai] = useState<KeyState>({
    value: localStorage.getItem(LS_OPENAI) ?? "",
    visible: false,
    saved: !!localStorage.getItem(LS_OPENAI),
  });
  const [gemini, setGemini] = useState<KeyState>({
    value: localStorage.getItem(LS_GOOGLE) ?? "",
    visible: false,
    saved: !!localStorage.getItem(LS_GOOGLE),
  });

  // Re-sync from localStorage when modal opens
  useEffect(() => {
    if (open) {
      setOpenai((prev) => ({
        ...prev,
        value: localStorage.getItem(LS_OPENAI) ?? "",
        saved: !!localStorage.getItem(LS_OPENAI),
      }));
      setGemini((prev) => ({
        ...prev,
        value: localStorage.getItem(LS_GOOGLE) ?? "",
        saved: !!localStorage.getItem(LS_GOOGLE),
      }));
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (openai.value.trim()) {
      localStorage.setItem(LS_OPENAI, openai.value.trim());
      setOpenai((prev) => ({ ...prev, saved: true }));
    } else {
      localStorage.removeItem(LS_OPENAI);
      setOpenai((prev) => ({ ...prev, saved: false }));
    }

    if (gemini.value.trim()) {
      localStorage.setItem(LS_GOOGLE, gemini.value.trim());
      setGemini((prev) => ({ ...prev, saved: true }));
    } else {
      localStorage.removeItem(LS_GOOGLE);
      setGemini((prev) => ({ ...prev, saved: false }));
    }

    onClose();
  };

  const handleClear = (provider: "openai" | "gemini") => {
    if (provider === "openai") {
      localStorage.removeItem(LS_OPENAI);
      setOpenai({ value: "", visible: false, saved: false });
    } else {
      localStorage.removeItem(LS_GOOGLE);
      setGemini({ value: "", visible: false, saved: false });
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-md rounded-base border-4 border-border bg-background shadow-shadow"
        style={{ boxShadow: "6px 6px 0 0 var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow shrink-0">
              <Key className="size-4 text-main-foreground" />
            </div>
            <div>
              <p className="font-heading text-base leading-tight">API Keys</p>
              <p className="text-[11px] opacity-50 font-base">Stored locally in your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-base border-2 border-border bg-secondary-background hover:bg-main hover:text-main-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* OpenAI */}
          <KeyField
            label="OpenAI"
            badge="o3-mini"
            badgeColor="bg-emerald-100 text-emerald-800 border-emerald-300"
            placeholder="sk-..."
            state={openai}
            onChange={(value) => setOpenai((prev) => ({ ...prev, value, saved: false }))}
            onToggleVisible={() =>
              setOpenai((prev) => ({ ...prev, visible: !prev.visible }))
            }
            onClear={() => handleClear("openai")}
          />

          {/* Gemini */}
          <KeyField
            label="Google Gemini"
            badge="gemini-2.5-flash"
            badgeColor="bg-blue-100 text-blue-800 border-blue-300"
            placeholder="AIza..."
            state={gemini}
            onChange={(value) => setGemini((prev) => ({ ...prev, value, saved: false }))}
            onToggleVisible={() =>
              setGemini((prev) => ({ ...prev, visible: !prev.visible }))
            }
            onClear={() => handleClear("gemini")}
          />

          {/* Security notice */}
          <div className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 flex gap-3 items-start">
            <AlertCircle className="size-4 shrink-0 mt-0.5 opacity-60" />
            <p className="text-[11px] opacity-60 font-base leading-relaxed">
              Keys are saved only in your browser's <code className="font-mono">localStorage</code>. They never leave your device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t-4 border-border px-5 py-4">
          <Button variant="neutral" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save keys
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-component: individual key field ─────────────────────── */
interface KeyFieldProps {
  label: string;
  badge: string;
  badgeColor: string;
  placeholder: string;
  state: KeyState;
  onChange: (v: string) => void;
  onToggleVisible: () => void;
  onClear: () => void;
}

function KeyField({
  label,
  badge,
  badgeColor,
  placeholder,
  state,
  onChange,
  onToggleVisible,
  onClear,
}: KeyFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading">{label}</span>
          <span
            className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${badgeColor}`}
          >
            {badge}
          </span>
        </div>
        {state.saved && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-base">
            <CheckCircle2 className="size-3" />
            Saved
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={state.visible ? "text" : "password"}
            value={state.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="
              w-full
              rounded-base
              border-2
              border-border
              bg-secondary-background
              px-3
              py-2.5
              pr-10
              text-sm
              font-mono
              shadow-shadow
              outline-none
              placeholder:opacity-40
              transition-all
              focus:translate-x-boxShadowX
              focus:translate-y-boxShadowY
              focus:shadow-none
            "
          />
          <button
            type="button"
            onClick={onToggleVisible}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
          >
            {state.visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {state.value && (
          <button
            type="button"
            onClick={onClear}
            className="
              flex items-center justify-center
              rounded-base border-2 border-border
              bg-secondary-background
              px-3
              text-xs font-heading
              shadow-shadow
              hover:bg-main hover:text-main-foreground
              transition-colors
            "
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
