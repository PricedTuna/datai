import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Plus, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  chats: { id: string; title: string }[];
  activeChat: string;
  onSelectChat: (id: string) => void;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
  onRenameChat?: (id: string, title: string) => void;
}

export function AppSidebar({ chats, activeChat, onSelectChat, onNewChat, onSettingsClick, onRenameChat, ...props }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
  }, []);

  const commitEdit = useCallback(() => {
    if (editingId && onRenameChat) {
      const trimmed = editValue.trim();
      if (trimmed) {
        onRenameChat(editingId, trimmed);
      }
    }
    setEditingId(null);
  }, [editingId, editValue, onRenameChat]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  return (
    <Sidebar {...props}>
      {/* ── Branding header ─────────────────────────────── */}
      <SidebarHeader className="border-b-2 border-border px-4 pt-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow shrink-0">
            <Bot className="size-5 text-main-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-heading">Loon</p>
            <p className="text-[11px] opacity-60 font-base">AI Chat MVP</p>
          </div>
        </div>
        <Button className="w-full gap-2 mb-2 justify-center" onClick={() => { setOpenMobile(false); onNewChat?.(); }} size="sm">
          <Plus className="size-4" />
          New Chat
        </Button>
        <Button className="w-full gap-2 mb-2 justify-center bg-white text-foreground shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none" onClick={() => { setOpenMobile(false); onSettingsClick?.(); }} size="sm">
          <Zap className="size-4" />
          Setup api-keys
        </Button>
      </SidebarHeader>

      {/* ── Chat list ─────────────────────────────────────  */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest opacity-50 font-heading px-3 py-2">Recent chats</SidebarGroupLabel>
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton onClick={() => onSelectChat(chat.id)} isActive={chat.id === activeChat} className="gap-3 font-base">
                  <MessageCircle className="size-4 shrink-0" />
                  {editingId === chat.id ? (
                    <input
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          commitEdit();
                        } else if (e.key === "Escape") {
                          e.stopPropagation();
                          cancelEdit();
                        }
                      }}
                      onBlur={commitEdit}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-transparent border-0 border-b-2 border-border outline-none text-sm font-base px-0 py-0 rounded-none"
                    />
                  ) : (
                    <span
                      className="truncate flex-1"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditing(chat.id, chat.title);
                      }}
                    >
                      {chat.title}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
