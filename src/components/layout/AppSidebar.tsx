import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, ClipboardList, Calendar, FlaskConical,
  Pill, Bed, Receipt, FileBarChart, Settings, LogOut, Stethoscope,
  Building2, ScanLine, FileText
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

const main = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "OPD Queue", url: "/opd", icon: ClipboardList },
  { title: "Appointments", url: "/appointments", icon: Calendar },
];
const ops = [
  { title: "Laboratory", url: "/lab", icon: FlaskConical },
  { title: "Radiology", url: "/radiology", icon: ScanLine },
  { title: "Prescriptions", url: "/prescriptions", icon: FileText },
  { title: "Pharmacy", url: "/pharmacy", icon: Pill },
  { title: "Beds (IPD)", url: "/beds", icon: Bed },
  { title: "Billing", url: "/billing", icon: Receipt },
];
const admin = [
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Hospital", url: "/hospital", icon: Building2 },
  { title: "Admin", url: "/admin", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const isActive = (p: string) => p === "/" ? path === "/" : path.startsWith(p);

  const renderGroup = (label: string, items: typeof main) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-bold text-base">MET CITY <br />
                HOSPITAL</div>
              <div className="text-[10px] text-muted-foreground">HMS</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Main", main)}
        {renderGroup("Operations", ops)}
        {renderGroup("Insights", admin)}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && user && (
          <div className="px-2 pb-2">
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}