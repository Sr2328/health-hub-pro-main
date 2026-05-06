import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

type Notif = { id: string; title: string; body: string; at: string };

export function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const push = (title: string, body: string) => {
      const n: Notif = { id: crypto.randomUUID(), title, body, at: new Date().toISOString() };
      setNotifs(prev => [n, ...prev].slice(0, 25));
      setUnread(u => u + 1);
      toast(title, { description: body });
    };
    const ch = supabase.channel("global-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, (p: any) => {
        if (p.eventType === "INSERT") push("New OPD token", `Token #${p.new.token_number ?? "—"} created`);
        else if (p.eventType === "UPDATE" && p.old?.status !== p.new?.status) push("OPD status updated", `Token #${p.new.token_number ?? "—"} → ${p.new.status}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lab_orders" }, (p: any) => {
        if (p.new?.status === "completed") push("Lab result ready", `${p.new.test_name}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "radiology_orders" }, (p: any) => {
        if (p.new?.status === "completed") push("Radiology report ready", `${p.new.service_name}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  const initials = (user.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/40">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-background/80 backdrop-blur px-3 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <Popover onOpenChange={(o) => o && setUnread(0)}>
              <PopoverTrigger asChild>
                <button className="relative h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center rounded-full">{unread}</Badge>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b font-semibold text-sm">Notifications</div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div> :
                    notifs.map(n => (
                      <div key={n.id} className="p-3 border-b last:border-0 hover:bg-muted/50">
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.at).toLocaleTimeString()}</div>
                      </div>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}