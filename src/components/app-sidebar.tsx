import { MessageCircle, Plus, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  chats: string[];
  activeChat: string;
  onSelectChat: (chat: string) => void;
  onNewChat?: () => void;
}

export function AppSidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      {/* ── Branding header ─────────────────────────────── */}
      <SidebarHeader className="border-b-4 border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-9 items-center justify-center rounded-base border-2 border-border bg-main shadow-shadow shrink-0">
            <Bot className="size-5 text-main-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-heading">Loon</p>
            <p className="text-[11px] opacity-60 font-base">AI Chat MVP</p>
          </div>
        </div>

        <Button
          className="w-full gap-2 justify-center"
          onClick={onNewChat}
          size="sm"
        >
          <Plus className="size-4" />
          New Chat
        </Button>
      </SidebarHeader>

      {/* ── Chat list ─────────────────────────────────────  */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-widest opacity-50 font-heading px-3 py-2">
            Recent chats
          </SidebarGroupLabel>
          <SidebarMenu>
            {chats.map((chat, i) => (
              <SidebarMenuItem key={chat}>
                <SidebarMenuButton
                  onClick={() => onSelectChat(chat)}
                  isActive={chat === activeChat}
                  className="gap-3 font-base"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="truncate">{chat}</span>
                  {/* tiny accent badge on active */}
                  {chat === activeChat && (
                    <span className="ml-auto text-[10px] font-heading bg-main text-main-foreground border border-border px-1.5 py-0.5 rounded-sm">
                      #{i + 1}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer status strip ───────────────────────────  */}
      <SidebarFooter className="border-t-4 border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-base border-2 border-border bg-secondary-background">
            <Zap className="size-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-heading">Settings</p>
            <p className="text-[11px] opacity-50">Setup your models api-keys</p>
          </div>
          <span className="ml-auto size-2 rounded-full bg-amber-400 border border-border" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}