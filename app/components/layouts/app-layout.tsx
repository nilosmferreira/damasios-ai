import { Outlet, useLoaderData, Form } from "react-router";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarMenuSub, 
  SidebarMenuSubButton, 
  SidebarMenuSubItem, 
  SidebarProvider, 
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  DollarSignIcon, 
  TrophyIcon, 
  SettingsIcon, 
  LogOutIcon,
  UserIcon,
  ClipboardListIcon,
  BarChart3Icon
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  items?: {
    title: string;
    url: string;
    icon: React.ComponentType<any>;
  }[];
}

interface AppLayoutProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
    athlete?: {
      id: string;
      name: string;
    } | null;
  };
}

const adminMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Gestão",
    icon: SettingsIcon,
    items: [
      {
        title: "Atletas",
        url: "/atletas",
        icon: UsersIcon,
      },
      {
        title: "Usuários",
        url: "/admin/users",
        icon: UserIcon,
      },
    ],
  },
  {
    title: "Partidas",
    url: "/partidas",
    icon: CalendarIcon,
  },
  {
    title: "Financeiro",
    icon: DollarSignIcon,
    items: [
      {
        title: "Controle Geral",
        url: "/financeiro",
        icon: BarChart3Icon,
      },
      {
        title: "Pendências",
        url: "/financeiro/pendencias",
        icon: ClipboardListIcon,
      },
    ],
  },
  {
    title: "Sorteios",
    url: "/sorteios",
    icon: TrophyIcon,
  },
];

const athleteMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Próximas Partidas",
    url: "/partidas",
    icon: CalendarIcon,
  },
  {
    title: "Minhas Pendências",
    url: "/minhas-pendencias",
    icon: DollarSignIcon,
  },
];

export function AppLayout({ user }: AppLayoutProps) {
  const menuItems = user.role === UserRole.ADMINISTRADOR ? adminMenuItems : athleteMenuItems;
  const userName = user.athlete?.name || user.email.split('@')[0];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-2">
              <TrophyIcon className="h-6 w-6 text-orange-500" />
              <span className="font-bold text-lg">Damásios AI</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.items ? (
                        <>
                          <SidebarMenuButton asChild>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                              {item.icon && <item.icon className="h-4 w-4" />}
                              <span>{item.title}</span>
                            </div>
                          </SidebarMenuButton>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <a href={subItem.url} className="flex items-center gap-2">
                                    {subItem.icon && <subItem.icon className="h-4 w-4" />}
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </>
                      ) : (
                        <SidebarMenuButton asChild>
                          <a href={item.url} className="flex items-center gap-2">
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.role === UserRole.ADMINISTRADOR ? 'Administrador' : 'Atleta'}
                      </span>
                    </div>
                  </div>
                  <Form action="/logout" method="post">
                    <Button type="submit" variant="ghost" size="sm">
                      <LogOutIcon className="h-4 w-4" />
                    </Button>
                  </Form>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger />
              <div className="ml-auto flex items-center space-x-4">
                {/* Header actions podem ser adicionadas aqui */}
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
