import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  chats: string[];
  activeChat: string;
  onSelectChat: (chat: string) => void;
}

export function AppSidebar({ chats, activeChat, onSelectChat, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarMenu>
            {chats.map((chat) => (
              <SidebarMenuItem key={chat}>
                <SidebarMenuButton
                  onClick={() => onSelectChat(chat)}
                  isActive={chat === activeChat}
                >
                  <span>{chat}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
