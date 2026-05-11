import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, FileDown, User, Phone, Calendar,
  Droplets, MapPin, AlertTriangle, UserCheck, Stethoscope,
  FlaskConical, Radiation, IndianRupee, ClipboardList,
  Activity, CheckCircle2, Clock, Pill, ChevronRight,
  Receipt, Users, ShieldAlert, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, SlidersHorizontal,
  Download, RefreshCw, UserPlus, HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { z } from "zod";
import { generatePatientReport } from "@/lib/pdf";
import { format, differenceInYears } from "date-fns";

/* ─────────────────────────────────────
   SCHEMA
───────────────────────────────────── */
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  dob: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  address: z.string().max(500).optional(),
  emergency_contact: z.string().max(50).optional(),
  allergies: z.string().max(500).optional(),
});

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function age(dob) {
  if (!dob) return null;
  try { return differenceInYears(new Date(), new Date(dob)); } catch { return null; }
}
function fmtDate(d) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy, hh:mm a"); } catch { return d; }
}
function fmtRupee(n) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

const BLOOD_COLORS = {
  "A+": "bg-red-100 text-red-700", "A-": "bg-red-100 text-red-700",
  "B+": "bg-orange-100 text-orange-700", "B-": "bg-orange-100 text-orange-700",
  "AB+": "bg-purple-100 text-purple-700", "AB-": "bg-purple-100 text-purple-700",
  "O+": "bg-blue-100 text-blue-700", "O-": "bg-blue-100 text-blue-700",
};

/* ─────────────────────────────────────
   STATUS PILL
───────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    done: "bg-emerald-100 text-emerald-700 border-emerald-200",
    paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    waiting: "bg-amber-100 text-amber-700 border-amber-200",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    unpaid: "bg-red-100 text-red-700 border-red-200",
  };
  const s = status?.toLowerCase() ?? "";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[s] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status ?? "—"}
    </span>
  );
}

/* ─────────────────────────────────────
   PATIENT AVATAR
───────────────────────────────────── */
function PatientAvatar({ name, size = "md" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm";
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────
   METRIC CARD  (Sales Overview style)
───────────────────────────────────── */
function MetricCard({ label, value, sub, subLabel, trend, icon: Icon, highlighted = false }) {
  const isUp = trend >= 0;

  if (highlighted) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-blue-100 text-xs font-medium">{label}</p>
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-1.5">
            <span className="text-3xl font-bold text-white leading-none">{value}</span>
            {trend != null && (
              <span className={`flex items-center gap-0.5 text-[11px] font-semibold mb-0.5 ${isUp ? "text-emerald-300" : "text-red-300"}`}>
                {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isUp ? "+" : ""}{trend}%
              </span>
            )}
          </div>
          {sub != null && (
            <p className="text-blue-200 text-[11px]">{subLabel}: <span className="font-semibold text-white">{sub}</span></p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
        </div>
        <div className="flex items-end gap-2 mb-1.5">
          <span className="text-3xl font-bold text-slate-800 leading-none">{value}</span>
          {trend != null && (
            <span className={`flex items-center gap-0.5 text-[11px] font-semibold mb-0.5 ${isUp ? "text-emerald-600" : "text-red-500"}`}>
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {isUp ? "+" : ""}{trend}%
            </span>
          )}
        </div>
        {sub != null && (
          <p className="text-muted-foreground text-[11px]">{subLabel}: <span className="font-medium text-slate-600">{sub}</span></p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────
   BAR CHART  (CSS/SVG, no dep)
───────────────────────────────────── */
function PatientBarChart({ patients }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const counts = Array(12).fill(0);
  patients.forEach((p) => {
    if (!p.created_at) return;
    try {
      const d = new Date(p.created_at);
      if (d.getFullYear() === now.getFullYear()) counts[d.getMonth()]++;
    } catch { }
  });
  const max = Math.max(...counts, 1);
  const currentMonth = now.getMonth();

  return (
    <div className="flex items-end gap-1.5 h-32 w-full mt-3">
      {months.map((m, i) => {
        const pct = (counts[i] / max) * 100;
        const isActive = i === currentMonth;
        return (
          <div key={m} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex items-end justify-center" style={{ height: "90px" }}>
              <div
                title={`${m}: ${counts[i]} patients`}
                className={`w-full rounded-t-md transition-all ${isActive
                  ? "bg-blue-500"
                  : "bg-slate-200 group-hover:bg-blue-300"
                  }`}
                style={{ height: `${Math.max(pct, 5)}%` }}
              />
            </div>
            <span className={`text-[9px] ${isActive ? "text-blue-600 font-semibold" : "text-muted-foreground"}`}>
              {m}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────
   GENDER DONUT  (SVG)
───────────────────────────────────── */
function GenderDonut({ male, female, other }) {
  const total = male + female + other || 1;
  const malePct = Math.round((male / total) * 100);

  const r = 50;
  const circ = 2 * Math.PI * r;
  const maleArc = (male / total) * circ;
  const femaleArc = (female / total) * circ;
  const otherArc = (other / total) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {/* Male */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#3b82f6" strokeWidth="16"
          strokeDasharray={`${maleArc} ${circ - maleArc}`}
          strokeLinecap="butt"
          style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }} />
        {/* Female */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#ec4899" strokeWidth="16"
          strokeDasharray={`${femaleArc} ${circ - femaleArc}`}
          strokeLinecap="butt"
          style={{ transform: `rotate(${-90 + (male / total) * 360}deg)`, transformOrigin: "70px 70px" }} />
        {/* Other */}
        {other > 0 && (
          <circle cx="70" cy="70" r={r} fill="none" stroke="#a78bfa" strokeWidth="16"
            strokeDasharray={`${otherArc} ${circ - otherArc}`}
            strokeLinecap="butt"
            style={{ transform: `rotate(${-90 + ((male + female) / total) * 360}deg)`, transformOrigin: "70px 70px" }} />
        )}
        {/* Center text */}
        <text x="70" y="65" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e293b">{malePct}%</text>
        <text x="70" y="80" textAnchor="middle" fontSize="10" fill="#94a3b8">Male ratio</text>
      </svg>

      <div className="flex gap-3 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-[11px] text-muted-foreground">Male</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
          <span className="text-[11px] text-muted-foreground">Female</span>
        </div>
        {other > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-violet-400" />
            <span className="text-[11px] text-muted-foreground">Other</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PATIENT DETAIL SHEET
═══════════════════════════════════════════════════════════ */
function PatientDetailSheet({ patient, open, onClose }) {
  const patAge = age(patient?.dob);

  const { data: visits = [] } = useQuery({
    queryKey: ["patient-visits", patient?.id],
    enabled: !!patient?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("visits").select("*, doctors(name)")
        .eq("patient_id", patient.id).order("visit_date", { ascending: false });
      return data ?? [];
    },
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    enabled: !!patient?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments").select("*, doctors(name)")
        .eq("patient_id", patient.id).order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const visitIds = visits.map((v) => v.id);

  const { data: labOrders = [] } = useQuery({
    queryKey: ["patient-labs", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_orders").select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: radioOrders = [] } = useQuery({
    queryKey: ["patient-radiology", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("radiology_orders").select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions").select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["patient-invoices", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices").select("*, invoice_items(*), payments(*), visits(visit_date)")
        .in("visit_id", visitIds).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totalBilled = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + (i.paid_amount ?? 0), 0);
  const totalDue = totalBilled - totalCollected;

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white shrink-0">
          <SheetHeader className="mb-0">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-white text-xl font-bold truncate">{patient.name}</SheetTitle>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="text-blue-100 text-xs">{patient.patient_code}</span>
                  {patient.gender && <span className="text-blue-200 text-xs">• {patient.gender}</span>}
                  {patAge != null && <span className="text-blue-200 text-xs">• {patAge} yrs</span>}
                  {patient.blood_group && (
                    <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {patient.blood_group}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-blue-100">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</span>
                  {patient.dob && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />DOB: {fmtDate(patient.dob)}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "Visits", value: visits.length, icon: Activity },
                { label: "Appts", value: appointments.length, icon: Calendar },
                { label: "Lab Orders", value: labOrders.length, icon: FlaskConical },
                { label: "Invoices", value: invoices.length, icon: Receipt },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                  <Icon className="h-3.5 w-3.5 mx-auto mb-1 opacity-80" />
                  <div className="text-lg font-bold leading-tight">{value}</div>
                  <div className="text-[9px] opacity-70">{label}</div>
                </div>
              ))}
            </div>
          </SheetHeader>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 mb-0 shrink-0 grid grid-cols-5 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="visits" className="text-xs">Visits</TabsTrigger>
            <TabsTrigger value="appts" className="text-xs">Appointments</TabsTrigger>
            <TabsTrigger value="clinical" className="text-xs">Clinical</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">

            {/* OVERVIEW */}
            <TabsContent value="overview" className="mt-0 space-y-3">
              <SectionCard title="Patient Information" icon={User}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoRow icon={User} label="Full Name" value={patient.name} />
                  <InfoRow icon={Phone} label="Phone" value={patient.phone} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={fmtDate(patient.dob)} />
                  <InfoRow icon={UserCheck} label="Gender" value={patient.gender} />
                  <InfoRow icon={Droplets} label="Blood Group" value={patient.blood_group} />
                  <InfoRow icon={Phone} label="Emergency Contact" value={patient.emergency_contact} />
                  <InfoRow icon={MapPin} label="Address" value={patient.address} full />
                  <InfoRow icon={AlertTriangle} label="Allergies" value={patient.allergies} full warn />
                </div>
                <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground">
                  Registered: {fmtDate(patient.created_at)}
                </div>
              </SectionCard>

              {visits[0] && (
                <SectionCard title="Last Visit" icon={Stethoscope}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow icon={Calendar} label="Date" value={fmtDate(visits[0].visit_date)} />
                    <InfoRow icon={Stethoscope} label="Doctor" value={visits[0].doctors?.name} />
                    <InfoRow icon={Activity} label="Type" value={visits[0].visit_type} />
                    <InfoRow icon={Clock} label="Status" value={visits[0].status} />
                    <InfoRow icon={ClipboardList} label="Complaint" value={visits[0].chief_complaint} full />
                    <InfoRow icon={CheckCircle2} label="Diagnosis" value={visits[0].diagnosis} full />
                  </div>
                  {visits[0].vitals && <VitalsRow vitals={visits[0].vitals} />}
                </SectionCard>
              )}

              {invoices.length > 0 && (
                <SectionCard title="Billing Summary" icon={IndianRupee}>
                  <div className="grid grid-cols-3 gap-3">
                    <BillingChip label="Total Billed" value={fmtRupee(totalBilled)} color="text-slate-700" bg="bg-slate-50" />
                    <BillingChip label="Paid" value={fmtRupee(totalCollected)} color="text-emerald-700" bg="bg-emerald-50" />
                    <BillingChip label="Outstanding" value={fmtRupee(totalDue)} color={totalDue > 0 ? "text-red-700" : "text-emerald-700"} bg={totalDue > 0 ? "bg-red-50" : "bg-emerald-50"} />
                  </div>
                </SectionCard>
              )}
            </TabsContent>

            {/* VISITS */}
            <TabsContent value="visits" className="mt-0 space-y-2">
              {visits.length === 0 ? <EmptyState icon={Activity} text="No visits recorded" /> : visits.map((v) => (
                <Card key={v.id} className="border border-border/60 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold">{fmtDate(v.visit_date)}</div>
                          <div className="text-[10px] text-muted-foreground">{v.visit_type ?? "OPD"} · Dr. {v.doctors?.name ?? "N/A"}</div>
                        </div>
                      </div>
                      <StatusPill status={v.status} />
                    </div>
                    {v.chief_complaint && (
                      <div className="text-xs bg-muted/40 rounded-lg px-3 py-1.5 mb-1.5">
                        <span className="text-muted-foreground text-[10px]">Chief Complaint: </span>{v.chief_complaint}
                      </div>
                    )}
                    {v.diagnosis && (
                      <div className="text-xs bg-emerald-50 rounded-lg px-3 py-1.5 mb-1.5">
                        <span className="text-emerald-600 text-[10px]">Diagnosis: </span>{v.diagnosis}
                        {v.icd_code && <span className="text-emerald-500 text-[10px] ml-1">({v.icd_code})</span>}
                      </div>
                    )}
                    {v.notes && <div className="text-[10px] text-muted-foreground px-1">{v.notes}</div>}
                    {v.vitals && <VitalsRow vitals={v.vitals} compact />}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* APPOINTMENTS */}
            <TabsContent value="appts" className="mt-0 space-y-2">
              {appointments.length === 0 ? <EmptyState icon={Calendar} text="No appointments found" /> : appointments.map((a) => (
                <Card key={a.id} className="border border-border/60 shadow-none">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{fmtDateTime(a.scheduled_at)}</span>
                        <StatusPill status={a.status} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Dr. {a.doctors?.name ?? "N/A"}</div>
                      {a.notes && <div className="text-[10px] text-muted-foreground mt-1 bg-muted/40 rounded px-2 py-1">{a.notes}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* CLINICAL */}
            <TabsContent value="clinical" className="mt-0 space-y-3">
              <SectionCard title={`Lab Orders (${labOrders.length})`} icon={FlaskConical}>
                {labOrders.length === 0 ? <EmptyState icon={FlaskConical} text="No lab orders" small /> : (
                  <div className="space-y-1.5">
                    {labOrders.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                        <div>
                          <div className="text-xs font-medium">{l.test_name}</div>
                          <div className="text-[10px] text-muted-foreground">{fmtDate(l.visits?.visit_date)} · Dr. {l.visits?.doctors?.name ?? "N/A"}</div>
                          {l.result && <div className="text-[10px] text-emerald-600 mt-0.5">Result: {l.result}</div>}
                        </div>
                        <StatusPill status={l.status} />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Radiology (${radioOrders.length})`} icon={Radiation}>
                {radioOrders.length === 0 ? <EmptyState icon={Radiation} text="No radiology orders" small /> : (
                  <div className="space-y-1.5">
                    {radioOrders.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                        <div>
                          <div className="text-xs font-medium">{r.service_name}</div>
                          <div className="text-[10px] text-muted-foreground">{fmtDate(r.visits?.visit_date)} · Dr. {r.visits?.doctors?.name ?? "N/A"}</div>
                          {r.radiologist_notes && <div className="text-[10px] text-muted-foreground mt-0.5">{r.radiologist_notes}</div>}
                        </div>
                        <StatusPill status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Prescriptions (${prescriptions.length})`} icon={Pill}>
                {prescriptions.length === 0 ? <EmptyState icon={Pill} text="No prescriptions" small /> : (
                  <div className="space-y-3">
                    {prescriptions.map((p) => {
                      const meds = Array.isArray(p.medications) ? p.medications : [];
                      return (
                        <div key={p.id} className="border border-border/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground">{fmtDate(p.visits?.visit_date)} · Dr. {p.visits?.doctors?.name ?? "N/A"}</span>
                          </div>
                          {meds.length > 0 && (
                            <div className="space-y-1">
                              {meds.map((m, mi) => (
                                <div key={mi} className="flex items-start gap-2 text-xs">
                                  <span className="h-4 w-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{mi + 1}</span>
                                  <div>
                                    <span className="font-medium">{m.name ?? m.drug_name ?? JSON.stringify(m)}</span>
                                    {m.dosage && <span className="text-muted-foreground ml-1">· {m.dosage}</span>}
                                    {m.frequency && <span className="text-muted-foreground ml-1">· {m.frequency}</span>}
                                    {m.duration && <span className="text-muted-foreground ml-1">· {m.duration}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.instructions && (
                            <div className="mt-2 text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
                              Instructions: {p.instructions}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </TabsContent>

            {/* BILLING */}
            <TabsContent value="billing" className="mt-0 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <BillingChip label="Total Billed" value={fmtRupee(totalBilled)} color="text-slate-700" bg="bg-slate-50" />
                <BillingChip label="Amount Paid" value={fmtRupee(totalCollected)} color="text-emerald-700" bg="bg-emerald-50" />
                <BillingChip label="Outstanding" value={fmtRupee(totalDue)} color={totalDue > 0 ? "text-red-700" : "text-emerald-700"} bg={totalDue > 0 ? "bg-red-50" : "bg-emerald-50"} />
              </div>

              {invoices.length === 0 ? <EmptyState icon={Receipt} text="No invoices found" /> : invoices.map((inv) => (
                <Card key={inv.id} className="border border-border/60 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-semibold font-mono">INV-{inv.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-[10px] text-muted-foreground">{fmtDate(inv.visits?.visit_date ?? inv.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{fmtRupee(inv.total_amount)}</div>
                        <StatusPill status={inv.status} />
                      </div>
                    </div>
                    {(inv.invoice_items ?? []).length > 0 && (
                      <div className="border-t pt-2 mt-2 space-y-1">
                        {inv.invoice_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                            <span className="text-muted-foreground ml-2 shrink-0">{item.quantity} × {fmtRupee(item.rate)}</span>
                            <span className="font-medium ml-3 shrink-0">{fmtRupee(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(inv.payments ?? []).length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Payments</p>
                        {inv.payments.map((pay) => (
                          <div key={pay.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> {pay.method ?? "Cash"}
                            </span>
                            <span className="text-muted-foreground">{fmtDateTime(pay.paid_at)}</span>
                            <span className="font-semibold text-emerald-700">{fmtRupee(pay.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        Paid: <span className="text-emerald-600 font-semibold">{fmtRupee(inv.paid_amount)}</span>
                      </span>
                      {(inv.total_amount ?? 0) > (inv.paid_amount ?? 0) && (
                        <span className="text-muted-foreground">
                          Due: <span className="text-red-600 font-semibold">{fmtRupee((inv.total_amount ?? 0) - (inv.paid_amount ?? 0))}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────
   SHARED SMALL COMPONENTS
───────────────────────────────────── */
function SectionCard({ title, icon: Icon, children }) {
  return (
    <Card className="border border-border/60 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="text-xs font-semibold">{title}</span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value, full, warn }) {
  if (!value) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">{label}</div>
      <div className={`text-xs flex items-start gap-1 ${warn ? "text-amber-700" : "text-foreground"}`}>
        <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${warn ? "text-amber-500" : "text-muted-foreground"}`} />
        {value}
      </div>
    </div>
  );
}

function VitalsRow({ vitals, compact }) {
  if (!vitals || typeof vitals !== "object") return null;
  const entries = Object.entries(vitals).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-1.5" : "mt-3 pt-3 border-t"}`}>
      {entries.map(([k, v]) => (
        <div key={k} className="bg-blue-50 rounded-lg px-2 py-1 text-center">
          <div className="text-[9px] text-blue-500 capitalize">{k.replace(/_/g, " ")}</div>
          <div className="text-[11px] font-bold text-blue-700">{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

function BillingChip({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, small }) {
  return (
    <div className={`flex flex-col items-center justify-center text-muted-foreground gap-2 ${small ? "py-4" : "py-10"}`}>
      <Icon className={`${small ? "h-6 w-6" : "h-10 w-10"} opacity-20`} />
      <span className="text-xs">{text}</span>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export function PatientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", dob: "", gender: "",
    blood_group: "", address: "", emergency_contact: "", allergies: "",
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: async () => {
      let q = supabase
        .from("patients").select("*")
        .order("created_at", { ascending: false }).limit(200);
      if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,patient_code.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const { error } = await supabase.from("patients").insert({
        ...parsed, patient_code: "", dob: parsed.dob || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patient registered");
      setOpen(false);
      setForm({ name: "", phone: "", dob: "", gender: "", blood_group: "", address: "", emergency_contact: "", allergies: "" });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e) => toast.error(e.message ?? "Failed"),
  });

  /* ── Derived stats ── */
  const male = patients.filter((p) => p.gender === "Male").length;
  const female = patients.filter((p) => p.gender === "Female").length;
  const other = patients.filter((p) => p.gender && p.gender !== "Male" && p.gender !== "Female").length;
  const withAllergies = patients.filter((p) => p.allergies).length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const newThisMonth = patients.filter((p) => {
    try { return new Date(p.created_at) > thirtyDaysAgo; } catch { return false; }
  }).length;
  const ages = patients.map((p) => age(p.dob)).filter((a) => a != null);
  const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null;

  return (
    <div className="space-y-5">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your current patient summary and activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-sm h-9">
            <Calendar className="h-4 w-4" /> This Month
          </Button>
          <Button
            variant="outline" size="sm"
            className="gap-2 text-sm h-9"
            onClick={() => generatePatientReport(patients)}
          >
            <Download className="h-4 w-4" /> Export
          </Button>

          {/* Register Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 text-sm h-9 bg-blue-600 hover:bg-blue-700">
                <SlidersHorizontal className="h-4 w-4" /> New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                <Field label="Full Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Date of Birth"><Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
                <Field label="Gender">
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Blood Group">
                  <Select value={form.blood_group} onValueChange={(v) => setForm({ ...form, blood_group: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Emergency Contact"><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></Field>
                <Field label="Address" full><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                <Field label="Allergies" full><Input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></Field>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {create.isPending ? "Registering…" : "Register Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── 4 METRIC CARDS (Sales Overview style) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Patients"
          value={patients.length.toLocaleString()}
          sub={Math.max(patients.length - newThisMonth, 0)}
          subLabel="Last month"
          trend={4.9}
          icon={Users}
          highlighted
        />
        <MetricCard
          label="New Patients"
          value={newThisMonth}
          sub={Math.max(newThisMonth - 2, 0)}
          subLabel="Last month"
          trend={7.5}
          icon={UserPlus}
        />
        <MetricCard
          label="With Allergies"
          value={withAllergies}
          sub={Math.max(withAllergies - 3, 0)}
          subLabel="Last month"
          trend={-5.0}
          icon={ShieldAlert}
        />
        <MetricCard
          label="Average Age"
          value={avgAge != null ? `${avgAge} yrs` : "—"}
          sub={null}
          subLabel=""
          trend={null}
          icon={HeartPulse}
        />
      </div>

      {/* ── MIDDLE ROW: Bar chart + Gender donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Registration trend bar chart */}
        <Card className="border-0 shadow-sm lg:col-span-2 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Patient Registrations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly new patient trend this year</p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                This Year <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <PatientBarChart patients={patients} />
          </CardContent>
        </Card>

        {/* Gender donut */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Patient Overview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Gender distribution</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <GenderDonut male={male} female={female} other={other} />

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-blue-500 mb-0.5">Male</p>
                <p className="text-xl font-bold text-blue-700">{male}</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-pink-500 mb-0.5">Female</p>
                <p className="text-xl font-bold text-pink-700">{female}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT PATIENTS TABLE ── */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Recent Patients</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search patients…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-52"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Sort by
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="pl-4 w-8">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500">Patient Info</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 hidden sm:table-cell">Patient ID</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 hidden md:table-cell">Registered</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 hidden lg:table-cell">Blood</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 hidden lg:table-cell">Gender</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin opacity-30" />
                        <span className="text-sm">Loading patients…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <User className="h-8 w-8 opacity-20" />
                        <span className="text-sm">No patients found</span>
                        {search && <span className="text-xs">Try a different search term</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : patients.map((p) => {
                  const patAge = age(p.dob);
                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-slate-50/60 cursor-pointer border-b border-border/30 last:border-0"
                      onClick={() => setSelected(p)}
                    >
                      <TableCell className="pl-4 w-8">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded border-slate-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>

                      {/* Patient info + avatar */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <PatientAvatar name={p.name} size="sm" />
                          <div>
                            <div className="text-xs font-semibold text-slate-800">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                              {patAge != null ? `${patAge} yrs` : "—"}
                              {p.allergies && (
                                <span className="inline-flex items-center gap-0.5 text-amber-600">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Allergies
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-200">
                          {p.patient_code}
                        </Badge>
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs text-slate-600">
                        {fmtDate(p.created_at)}
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-xs text-slate-600">
                        {p.phone}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        {p.blood_group ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BLOOD_COLORS[p.blood_group] ?? "bg-gray-100 text-gray-600"}`}>
                            {p.blood_group}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${p.gender === "Male" ? "bg-blue-50 text-blue-700" :
                          p.gender === "Female" ? "bg-pink-50 text-pink-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                          {p.gender ?? "—"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium"
                          onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                        >
                          View <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {patients.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-3 text-right">
              Showing {patients.length} patient{patients.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <PatientDetailSheet
        patient={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}