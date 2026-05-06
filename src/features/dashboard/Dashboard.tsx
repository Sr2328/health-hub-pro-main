import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Users, Calendar, FlaskConical, IndianRupee, ShieldCheck, Bed,
  AlertTriangle, TrendingUp, Activity, Clock, CheckCircle2,
  Pill, ChevronRight, ChevronLeft, ArrowUpRight, Bell, LayoutDashboard,
  Stethoscope, Microscope, Radiation,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, RadialBarChart, RadialBar,
} from "recharts";
import {
  format, subDays, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday, isSameMonth,
} from "date-fns";

/* ─────────────────────────────────────────────
   CALENDAR EVENT TYPES
───────────────────────────────────────────── */
type CalEventType = "doctor" | "lab" | "pharmacy" | "radiology" | "visit";

type CalEvent = {
  date: string; // YYYY-MM-DD
  type: CalEventType;
  label: string;
  time?: string;
};

const EVENT_CFG: Record<CalEventType, { dot: string; bg: string; text: string; icon: any; label: string }> = {
  doctor: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", icon: Stethoscope, label: "Doctor" },
  lab: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", icon: Microscope, label: "Lab" },
  pharmacy: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", icon: Pill, label: "Pharmacy" },
  radiology: { dot: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-700", icon: Radiation, label: "Radiology" },
  visit: { dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", icon: Activity, label: "Visit" },
};

/* ─────────────────────────────────────────────
   MINI CALENDAR
───────────────────────────────────────────── */
function MiniCalendar({
  month, onPrev, onNext, events,
}: {
  month: Date; onPrev: () => void; onNext: () => void; events: CalEvent[];
}) {
  const [selected, setSelected] = useState<Date>(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(startOfMonth(month));
  const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const eventsOn = (day: Date) => events.filter((e) => e.date === format(day, "yyyy-MM-dd"));
  const selEvents = eventsOn(selected);

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <button onClick={onPrev} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="text-xs font-semibold">{format(month, "MMMM yyyy")}</span>
        <button onClick={onNext} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* DOW row */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-0.5">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[9px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
        {days.map((day) => {
          const dayEvs = eventsOn(day);
          const isSel = isSameDay(day, selected);
          const isTod = isToday(day);
          const dots = [...new Set(dayEvs.map((e) => e.type))].slice(0, 3) as CalEventType[];

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelected(day)}
              className={`
                relative flex flex-col items-center justify-start pt-0.5 pb-1 rounded-lg transition-all
                ${isSel ? "bg-blue-600 text-white shadow-sm" : isTod ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-muted text-foreground"}
                ${!isSameMonth(day, month) ? "opacity-30" : ""}
              `}
            >
              <span className="text-[10px] leading-4">{format(day, "d")}</span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.map((t) => (
                    <span key={t} className={`h-1 w-1 rounded-full ${isSel ? "bg-white/80" : EVENT_CFG[t].dot}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="border-t px-3 py-2 bg-muted/20">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {(Object.keys(EVENT_CFG) as CalEventType[]).map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${EVENT_CFG[t].dot}`} />
              <span className="text-[10px] text-muted-foreground">{EVENT_CFG[t].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day events */}
      <div className="border-t px-3 py-2">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          {format(selected, "EEE, dd MMM")}
        </p>
        {selEvents.length === 0 ? (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> No events
          </p>
        ) : (
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {selEvents.map((ev, i) => {
              const cfg = EVENT_CFG[ev.type];
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${cfg.bg}`}>
                  <Icon className={`h-2.5 w-2.5 shrink-0 ${cfg.text}`} />
                  <span className={`text-[10px] truncate font-medium ${cfg.text}`}>{ev.label}</span>
                  {ev.time && <span className="text-[9px] text-muted-foreground ml-auto shrink-0">{ev.time}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export function Dashboard() {
  const { roles, refreshRoles, user } = useAuth();
  const isAdmin = roles.includes("super_admin");
  const firstName = user?.email?.split("@")[0] ?? "User";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const [calMonth, setCalMonth] = useState(new Date());

  /* ── Stats ── */
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [opd, patients, lab, beds, appts] = await Promise.all([
        supabase.from("visits").select("*", { count: "exact", head: true }).eq("visit_date", today),
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("lab_orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("beds").select("status"),
        supabase.from("appointments").select("*", { count: "exact", head: true })
          .gte("scheduled_at", today + "T00:00:00")
          .lte("scheduled_at", today + "T23:59:59"),
      ]);
      const bd = beds.data ?? [];
      const occupied = bd.filter((b) => b.status === "occupied").length;
      const available = bd.filter((b) => b.status === "available").length;
      const total = bd.length;
      return {
        opdToday: opd.count ?? 0,
        patients: patients.count ?? 0,
        pendingLabs: lab.count ?? 0,
        bedOccupancy: total ? Math.round((occupied / total) * 100) : 0,
        bedsOccupied: occupied,
        bedsAvailable: available,
        bedsTotal: total,
        appointmentsToday: appts.count ?? 0,
      };
    },
  });

  /* ── Calendar Events ── */
  const { data: calEvents = [] } = useQuery({
    queryKey: ["cal-events", format(calMonth, "yyyy-MM")],
    queryFn: async (): Promise<CalEvent[]> => {
      const ms = format(startOfMonth(calMonth), "yyyy-MM-dd");
      const me = format(endOfMonth(calMonth), "yyyy-MM-dd");

      const [appts, labs, radios, visits] = await Promise.all([
        supabase.from("appointments").select("scheduled_at, doctors(name)")
          .gte("scheduled_at", ms + "T00:00:00").lte("scheduled_at", me + "T23:59:59"),
        supabase.from("lab_orders").select("created_at, test_name")
          .gte("created_at", ms).lte("created_at", me + "T23:59:59"),
        supabase.from("radiology_orders").select("created_at, service_name")
          .gte("created_at", ms).lte("created_at", me + "T23:59:59"),
        supabase.from("visits").select("visit_date, patients(name)")
          .gte("visit_date", ms).lte("visit_date", me),
      ]);

      const evs: CalEvent[] = [];
      (appts.data ?? []).forEach((a: any) => {
        const d = (a.scheduled_at ?? "").slice(0, 10);
        if (d) evs.push({ date: d, type: "doctor", label: `Appt – Dr. ${a.doctors?.name ?? "N/A"}`, time: a.scheduled_at ? format(new Date(a.scheduled_at), "hh:mm a") : undefined });
      });
      (labs.data ?? []).forEach((l: any) => {
        const d = (l.created_at ?? "").slice(0, 10);
        if (d) evs.push({ date: d, type: "lab", label: l.test_name ?? "Lab Test" });
      });
      (radios.data ?? []).forEach((r: any) => {
        const d = (r.created_at ?? "").slice(0, 10);
        if (d) evs.push({ date: d, type: "radiology", label: r.service_name ?? "Radiology" });
      });
      (visits.data ?? []).forEach((v: any) => {
        if (v.visit_date) evs.push({ date: v.visit_date, type: "visit", label: `Visit – ${v.patients?.name ?? "Patient"}` });
      });
      return evs;
    },
  });

  /* ── Revenue ── */
  const { data: revenue } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: async () => {
      const thisMonth = new Date().toISOString().slice(0, 7);
      const { data: invs } = await supabase.from("invoices").select("total_amount, paid_amount, status, created_at");
      const monthly = (invs ?? []).filter((i) => (i.created_at ?? "").startsWith(thisMonth));
      const totalBilled = monthly.reduce((s, i) => s + (i.total_amount ?? 0), 0);
      const totalCollected = monthly.reduce((s, i) => s + (i.paid_amount ?? 0), 0);
      const pending = (invs ?? []).filter((i) => i.status === "pending").length;
      return { totalBilled, totalCollected, pending };
    },
  });

  /* ── Drug Alerts ── */
  const { data: drugAlerts } = useQuery({
    queryKey: ["drug-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("drugs").select("name, stock_qty, reorder_level, expiry_date");
      const today = new Date().toISOString().slice(0, 10);
      const low = (data ?? []).filter((d) => (d.stock_qty ?? 0) <= (d.reorder_level ?? 0));
      const expiring = (data ?? []).filter((d) => {
        if (!d.expiry_date) return false;
        const diff = (new Date(d.expiry_date).getTime() - new Date(today).getTime()) / 86400000;
        return diff >= 0 && diff <= 30;
      });
      return { low, expiring };
    },
  });

  /* ── Visit Trend ── */
  const { data: trend } = useQuery({
    queryKey: ["visit-trend"],
    queryFn: async () => {
      const since = subDays(new Date(), 13).toISOString().slice(0, 10);
      const { data } = await supabase.from("visits").select("visit_date").gte("visit_date", since);
      const buckets: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) { buckets[format(subDays(new Date(), i), "MMM dd")] = 0; }
      (data ?? []).forEach((v) => {
        const d = v.visit_date ? format(new Date(v.visit_date), "MMM dd") : null;
        if (d && d in buckets) buckets[d]++;
      });
      return Object.entries(buckets).map(([date, count]) => ({ date, count }));
    },
  });

  /* ── Dept Load ── */
  const { data: deptLoad } = useQuery({
    queryKey: ["dept-load"],
    queryFn: async () => {
      const { data: depts } = await supabase.from("departments").select("id,name");
      const { data: docs } = await supabase.from("doctors").select("id,dept_id");
      const docByDept: Record<string, string[]> = {};
      (docs ?? []).forEach((d) => { if (d.dept_id) (docByDept[d.dept_id] ??= []).push(d.id); });
      const { data: visits } = await supabase.from("visits").select("doctor_id");
      return (depts ?? []).map((dept) => {
        const ids = docByDept[dept.id] ?? [];
        const count = (visits ?? []).filter((v) => v.doctor_id && ids.includes(v.doctor_id)).length;
        return { name: dept.name.length > 8 ? dept.name.slice(0, 8) + "…" : dept.name, visits: count };
      });
    },
  });

  /* ── Recent Visits ── */
  const { data: recentVisits } = useQuery({
    queryKey: ["recent-visits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("visits")
        .select("id, visit_date, visit_type, status, chief_complaint, patients(name), doctors(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const claim = async () => {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(error.message);
    if (data) { toast.success("You are now Super Admin"); await refreshRoles(); }
    else toast.info("A Super Admin already exists.");
  };

  const bedGaugeData = [{ name: "Occupied", value: stats?.bedOccupancy ?? 0, fill: "#3b82f6" }];
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;
  const alertCount = (drugAlerts?.low.length ?? 0) + (drugAlerts?.expiring.length ?? 0);

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        title={`${greeting}, ${firstName} 👋`}
        description="Here's what's happening at your hospital today"
        action={
          !isAdmin ? (
            <Button onClick={claim} variant="outline" size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Claim Super Admin
            </Button>
          ) : (
            <Badge className="bg-blue-600 text-white hover:bg-blue-700">Super Admin</Badge>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* ══ LEFT PANEL ══ */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* OPD Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-80 uppercase tracking-wider">OPD Today</span>
                </div>
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                  {format(new Date(), "dd MMM")}
                </Badge>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-bold">{stats?.opdToday ?? 0}</span>
                <span className="text-sm opacity-70 mb-2">visits</span>
              </div>
              <p className="text-xs opacity-70">Total patients registered today</p>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(((stats?.opdToday ?? 0) / 50) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] opacity-60 mt-1">of 50 daily target</p>
            </div>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Stats</p>
              <MiniStat icon={Calendar} label="Appointments Today" value={stats?.appointmentsToday ?? 0} color="text-blue-500" />
              <MiniStat icon={FlaskConical} label="Pending Lab Orders" value={stats?.pendingLabs ?? 0} color="text-amber-500" />
              <MiniStat icon={Users} label="Total Patients" value={stats?.patients ?? 0} color="text-emerald-500" />
              <MiniStat icon={Bed} label="Beds Available" value={stats?.bedsAvailable ?? 0} color="text-purple-500" />
            </CardContent>
          </Card>

          {/* ── CALENDAR ── */}
          <Card className="border-0 shadow-md overflow-hidden">
            <MiniCalendar
              month={calMonth}
              onPrev={() => setCalMonth((m) => subMonths(m, 1))}
              onNext={() => setCalMonth((m) => addMonths(m, 1))}
              events={calEvents}
            />
          </Card>

          {/* Alerts */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" /> Alerts & Reminders
                </CardTitle>
                {alertCount > 0 && <Badge className="bg-red-100 text-red-600 border-0 text-xs">{alertCount}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {(drugAlerts?.low ?? []).slice(0, 3).map((d, i) => (
                <AlertRow key={i} icon={Pill} text={`Low stock: ${d.name}`} sub={`${d.stock_qty} units left`} color="text-red-500" bg="bg-red-50" />
              ))}
              {(drugAlerts?.expiring ?? []).slice(0, 2).map((d, i) => (
                <AlertRow key={i} icon={AlertTriangle} text={`Expiring: ${d.name}`} sub={`Exp: ${d.expiry_date}`} color="text-amber-500" bg="bg-amber-50" />
              ))}
              {alertCount === 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> All clear! No active alerts.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Activity Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ActivityCard icon={Activity} label="Today's Visits" value={stats?.opdToday ?? 0} meta="OPD + IPD" metaIcon={Clock} metaValue={format(new Date(), "hh:mm a")} accent="#3b82f6" />
            <ActivityCard icon={Bed} label="Bed Occupancy" value={`${stats?.bedOccupancy ?? 0}%`} meta={`${stats?.bedsOccupied ?? 0} of ${stats?.bedsTotal ?? 0} beds`} metaIcon={TrendingUp} metaValue={`${stats?.bedsAvailable ?? 0} free`} accent="#8b5cf6" />
            <ActivityCard icon={IndianRupee} label="Revenue This Month" value={fmt(revenue?.totalCollected ?? 0)} meta="Billed this month" metaIcon={CheckCircle2} metaValue={fmt(revenue?.totalBilled ?? 0)} accent="#10b981" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 border-0 shadow-md">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">OPD Visit Trend</CardTitle>
                  <Badge variant="outline" className="text-xs">Last 14 days</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#blueGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md flex flex-col">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Bed Occupancy</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex flex-col items-center justify-center flex-1">
                <div className="relative h-40 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="70%" innerRadius="65%" outerRadius="95%" startAngle={180} endAngle={0}
                      data={[{ value: 100, fill: "#e5e7eb" }, ...bedGaugeData]}>
                      <RadialBar background={false} dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-6 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats?.bedOccupancy ?? 0}%</div>
                    <div className="text-[10px] text-muted-foreground">Occupancy</div>
                  </div>
                </div>
                <div className="w-full grid grid-cols-2 gap-2 mt-1">
                  <div className="text-center rounded-xl bg-blue-50 py-2">
                    <div className="text-lg font-bold text-blue-600">{stats?.bedsOccupied ?? 0}</div>
                    <div className="text-[10px] text-blue-500">Occupied</div>
                  </div>
                  <div className="text-center rounded-xl bg-emerald-50 py-2">
                    <div className="text-lg font-bold text-emerald-600">{stats?.bedsAvailable ?? 0}</div>
                    <div className="text-[10px] text-emerald-500">Available</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dept Load + Recent Visits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">Department Load</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptLoad ?? []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      <Bar dataKey="visits" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Recent Visits</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-blue-600">
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {(recentVisits ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No visits recorded yet</p>
                ) : (
                  (recentVisits ?? []).map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 py-1.5">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {(v.patients?.name ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{v.patients?.name ?? "Unknown"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {v.chief_complaint ?? v.visit_type ?? "General Visit"}
                        </div>
                      </div>
                      <VisitStatusBadge status={v.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Banner */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Monthly Billing Summary</span>
                </div>
                <div className="text-2xl font-bold text-white">{fmt(revenue?.totalCollected ?? 0)}</div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Collected of {fmt(revenue?.totalBilled ?? 0)} billed · {revenue?.pending ?? 0} invoices pending
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <RevenueChip label="Billed" value={fmt(revenue?.totalBilled ?? 0)} color="text-blue-400" />
                <RevenueChip label="Collected" value={fmt(revenue?.totalCollected ?? 0)} color="text-emerald-400" />
                <RevenueChip label="Pending" value={`${revenue?.pending ?? 0}`} color="text-amber-400" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

function AlertRow({ icon: Icon, text, sub, color, bg }: { icon: any; text: string; sub: string; color: string; bg: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg p-2 ${bg}`}>
      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{text}</div>
        <div className="text-[10px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function ActivityCard({ icon: Icon, label, value, meta, metaIcon: MetaIcon, metaValue, accent }: {
  icon: any; label: string; value: number | string; meta: string; metaIcon: any; metaValue: string; accent: string;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mb-0.5">{value}</div>
        <div className="text-xs text-muted-foreground mb-3">{label}</div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
          <MetaIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{meta}</span>
          <span className="ml-auto font-medium shrink-0" style={{ color: accent }}>{metaValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function VisitStatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Done", cls: "bg-emerald-100 text-emerald-700" },
    in_progress: { label: "Active", cls: "bg-blue-100 text-blue-700" },
    waiting: { label: "Waiting", cls: "bg-amber-100 text-amber-700" },
    cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status ?? ""] ?? { label: status ?? "–", cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${s.cls}`}>{s.label}</span>;
}

function RevenueChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center bg-white/5 rounded-xl px-3 py-2">
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}