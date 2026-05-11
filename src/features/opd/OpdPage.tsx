import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
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
  Plus, FileDown, Activity, Search, Clock, User,
  Stethoscope, ClipboardList, CheckCircle2, Loader2,
  Hash, Phone, Calendar, FlaskConical, Radiation,
  Pill, IndianRupee, AlertTriangle, ChevronRight,
  Timer, UserCheck, RefreshCw, Eye,
  TrendingUp, Droplets, MoreHorizontal, ArrowUpRight,
  BarChart2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { generateOpdReport } from "@/lib/pdf";
import { format, formatDistanceToNow } from "date-fns";

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return d; }
}
function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy, hh:mm a"); } catch { return d; }
}
function fmtRupee(n?: number | null) {
  if (n == null) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}
function timeAgo(d?: string | null) {
  if (!d) return "";
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; }
}

/* ─────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────── */
type VisitStatus = "waiting" | "in-consult" | "done" | "cancelled";

const STATUS_CFG: Record<string, {
  label: string; dot: string; badge: string; border: string; cardBg: string;
}> = {
  waiting: { label: "Waiting", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-l-amber-400", cardBg: "" },
  "in-consult": { label: "In Consult", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700 border-blue-200", border: "border-l-blue-500", cardBg: "bg-blue-50/30" },
  done: { label: "Done", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "border-l-emerald-500", cardBg: "bg-emerald-50/20" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", badge: "bg-red-100 text-red-700 border-red-200", border: "border-l-red-400", cardBg: "bg-red-50/20" },
};

function StatusBadge({ status }: { status?: string | null }) {
  const cfg = STATUS_CFG[status ?? ""] ?? { label: status ?? "—", badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────
   SPARKLINE SVG (like "Health Trend Chart")
───────────────────────────────────── */
function Sparkline({ data, color = "#3b82f6", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────
   MINI BAR CHART (like "Patient health report")
───────────────────────────────────── */
function MiniBarChart({ visits }: { visits: any[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const counts = Array(7).fill(0);
  visits.forEach((v: any) => {
    if (!v.created_at) return;
    try {
      const d = new Date(v.created_at);
      const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        const idx = (6 - diff); // most recent = index 6
        counts[idx]++;
      }
    } catch { }
  });
  const max = Math.max(...counts, 1);
  // Map to Mon-Sun display
  const todayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {days.map((d, i) => {
        const pct = (counts[i] / max) * 100;
        const isToday = i === todayIdx;
        return (
          <div key={d} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex items-end justify-center" style={{ height: 64 }}>
              <div
                className={`w-full rounded-t-md transition-all ${isToday ? "bg-blue-500" : "bg-blue-200 group-hover:bg-blue-400"}`}
                style={{ height: `${Math.max(pct, 6)}%` }}
              />
            </div>
            <span className={`text-[9px] ${isToday ? "text-blue-600 font-bold" : "text-muted-foreground"}`}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────
   COMPLETION DONUT  (like "85%")
───────────────────────────────────── */
function CompletionDonut({ pct, total, done }: { pct: number; total: number; done: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle cx="48" cy="48" r={r} fill="none"
            stroke={pct >= 80 ? "#10b981" : pct >= 50 ? "#3b82f6" : "#f59e0b"}
            strokeWidth="10"
            strokeDasharray={`${arc} ${circ - arc}`}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px" }}
          />
          <text x="48" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1e293b">{pct}%</text>
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-700">Completion Rate</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          Done: <span className="font-semibold text-slate-700">{done}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-slate-300" />
          Total: <span className="font-semibold text-slate-700">{total}</span>
        </div>
        {pct > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="h-3 w-3" /> +{pct}% today
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   VITALS DISPLAY
───────────────────────────────────── */
function VitalsGrid({ vitals }: { vitals: any }) {
  if (!vitals || typeof vitals !== "object") return null;
  const entries = Object.entries(vitals as Record<string, any>).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="bg-blue-50 rounded-lg px-2.5 py-1.5 text-center min-w-[52px]">
          <div className="text-[9px] text-blue-400 capitalize font-medium">{k.replace(/_/g, " ")}</div>
          <div className="text-xs font-bold text-blue-700">{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VISIT DETAIL SHEET
═══════════════════════════════════════════════════════════ */
function VisitDetailSheet({ visit, open, onClose, onStatusChange }: {
  visit: any; open: boolean; onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const { data: labs = [] } = useQuery({
    queryKey: ["visit-labs", visit?.id],
    enabled: !!visit?.id && open,
    queryFn: async () => (await supabase.from("lab_orders").select("*").eq("visit_id", visit.id).order("created_at")).data ?? [],
  });
  const { data: radiology = [] } = useQuery({
    queryKey: ["visit-radio", visit?.id],
    enabled: !!visit?.id && open,
    queryFn: async () => (await supabase.from("radiology_orders").select("*").eq("visit_id", visit.id).order("created_at")).data ?? [],
  });
  const { data: prescriptions = [] } = useQuery({
    queryKey: ["visit-rx", visit?.id],
    enabled: !!visit?.id && open,
    queryFn: async () => (await supabase.from("prescriptions").select("*").eq("visit_id", visit.id).order("created_at")).data ?? [],
  });
  const { data: invoice } = useQuery({
    queryKey: ["visit-invoice", visit?.id],
    enabled: !!visit?.id && open,
    queryFn: async () => (await supabase.from("invoices").select("*, invoice_items(*), payments(*)").eq("visit_id", visit.id).maybeSingle()).data,
  });

  if (!visit) return null;
  const patName = visit.patients?.name ?? "Unknown";
  const initials = patName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 flex flex-col overflow-hidden">
        <div className={`px-5 py-4 text-white shrink-0 ${visit.status === "done" ? "bg-gradient-to-r from-emerald-600 to-emerald-700" :
          visit.status === "in-consult" ? "bg-gradient-to-r from-blue-600 to-blue-700" :
            visit.status === "cancelled" ? "bg-gradient-to-r from-slate-600 to-slate-700" :
              "bg-gradient-to-r from-amber-500 to-amber-600"
          }`}>
          <SheetHeader className="mb-0">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex flex-col items-center justify-center shrink-0">
                <div className="text-[10px] opacity-70 font-medium">TOKEN</div>
                <div className="text-2xl font-black leading-none">#{visit.token_number ?? "–"}</div>
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-white text-lg font-bold truncate">{patName}</SheetTitle>
                <div className="text-white/70 text-xs">{visit.patients?.patient_code ?? ""}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{visit.visit_type ?? "OPD"}</span>
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{visit.status}</span>
                  {visit.patients?.blood_group && (
                    <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{visit.patients.blood_group}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-white/80">
              <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Dr. {visit.doctors?.name ?? "N/A"}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(visit.visit_date)}</span>
              {visit.created_at && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(visit.created_at)}</span>}
            </div>
            {visit.status !== "done" && visit.status !== "cancelled" && (
              <div className="flex gap-2 mt-3">
                {visit.status === "waiting" && (
                  <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold h-8 text-xs"
                    onClick={() => { onStatusChange(visit.id, "in-consult"); onClose(); }}>
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Start Consultation
                  </Button>
                )}
                {visit.status === "in-consult" && (
                  <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-8 text-xs"
                    onClick={() => { onStatusChange(visit.id, "done"); onClose(); }}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark as Done
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 h-8 text-xs"
                  onClick={() => { onStatusChange(visit.id, "cancelled"); onClose(); }}>
                  Cancel Visit
                </Button>
              </div>
            )}
          </SheetHeader>
        </div>

        <Tabs defaultValue="clinical" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 shrink-0 grid grid-cols-4 h-9">
            <TabsTrigger value="clinical" className="text-xs">Clinical</TabsTrigger>
            <TabsTrigger value="lab" className="text-xs">Lab & Radio</TabsTrigger>
            <TabsTrigger value="rx" className="text-xs">Prescriptions</TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">Billing</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-3">
            <TabsContent value="clinical" className="mt-0 space-y-3">
              <DetailCard title="Patient Information" icon={User}>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Phone" value={visit.patients?.phone} icon={Phone} />
                  <DetailRow label="Gender" value={visit.patients?.gender} icon={User} />
                  <DetailRow label="DOB" value={fmtDate(visit.patients?.dob)} icon={Calendar} />
                  <DetailRow label="Blood" value={visit.patients?.blood_group} icon={Droplets} />
                  {visit.patients?.allergies && <DetailRow label="Allergies" value={visit.patients.allergies} icon={AlertTriangle} warn full />}
                  {visit.patients?.emergency_contact && <DetailRow label="Emergency" value={visit.patients.emergency_contact} icon={Phone} full />}
                </div>
              </DetailCard>
              <DetailCard title="Visit Details" icon={ClipboardList}>
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Visit Date" value={fmtDate(visit.visit_date)} icon={Calendar} />
                  <DetailRow label="Visit Type" value={visit.visit_type ?? "OPD"} icon={Activity} />
                  <DetailRow label="Doctor" value={visit.doctors?.name} icon={Stethoscope} />
                  <DetailRow label="Status" value={visit.status} icon={CheckCircle2} />
                  <DetailRow label="Chief Complaint" value={visit.chief_complaint} icon={ClipboardList} full />
                  <DetailRow label="Diagnosis" value={visit.diagnosis} icon={CheckCircle2} full />
                  {visit.icd_code && <DetailRow label="ICD Code" value={visit.icd_code} icon={Hash} />}
                  <DetailRow label="Notes" value={visit.notes} icon={ClipboardList} full />
                </div>
              </DetailCard>
              {visit.vitals && Object.keys(visit.vitals).length > 0 && (
                <DetailCard title="Vitals" icon={Activity}><VitalsGrid vitals={visit.vitals} /></DetailCard>
              )}
            </TabsContent>

            <TabsContent value="lab" className="mt-0 space-y-3">
              <DetailCard title={`Lab Orders (${labs.length})`} icon={FlaskConical}>
                {labs.length === 0 ? <EmptyInline icon={FlaskConical} text="No lab orders for this visit" /> : (
                  <div className="space-y-2">
                    {labs.map((l: any) => (
                      <div key={l.id} className="flex items-start justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                            <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{l.test_name}</div>
                            {l.result && <div className="text-[10px] text-emerald-600 mt-0.5">Result: {l.result}</div>}
                            {l.report_url && <a href={l.report_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline mt-0.5 block">View Report</a>}
                          </div>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>
                    ))}
                  </div>
                )}
              </DetailCard>
              <DetailCard title={`Radiology (${radiology.length})`} icon={Radiation}>
                {radiology.length === 0 ? <EmptyInline icon={Radiation} text="No radiology orders for this visit" /> : (
                  <div className="space-y-2">
                    {radiology.map((r: any) => (
                      <div key={r.id} className="flex items-start justify-between gap-2 py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                            <Radiation className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{r.service_name}</div>
                            {r.radiologist_notes && <div className="text-[10px] text-muted-foreground mt-0.5">{r.radiologist_notes}</div>}
                            {r.report_url && <a href={r.report_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline mt-0.5 block">View Report</a>}
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </DetailCard>
            </TabsContent>

            <TabsContent value="rx" className="mt-0 space-y-3">
              {prescriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <Pill className="h-10 w-10 opacity-20" />
                  <span className="text-sm">No prescriptions for this visit</span>
                </div>
              ) : prescriptions.map((p: any) => {
                const meds: any[] = Array.isArray(p.medications) ? p.medications : [];
                return (
                  <DetailCard key={p.id} title="Prescription" icon={Pill}>
                    {meds.length > 0 ? (
                      <div className="space-y-2">
                        {meds.map((m: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 bg-muted/30 rounded-lg">
                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                            <div className="flex-1">
                              <div className="text-xs font-semibold">{m.name ?? m.drug_name ?? JSON.stringify(m)}</div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {m.dosage && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Dose: {m.dosage}</span>}
                                {m.frequency && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Freq: {m.frequency}</span>}
                                {m.duration && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">For: {m.duration}</span>}
                                {m.route && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{m.route}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-xs text-muted-foreground">No medications listed</div>}
                    {p.instructions && (
                      <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Special Instructions</p>
                        <p className="text-xs text-amber-800">{p.instructions}</p>
                      </div>
                    )}
                  </DetailCard>
                );
              })}
            </TabsContent>

            <TabsContent value="billing" className="mt-0 space-y-3">
              {!invoice ? (
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <IndianRupee className="h-10 w-10 opacity-20" />
                  <span className="text-sm">No invoice for this visit</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total", value: fmtRupee(invoice.total_amount), color: "text-slate-700", bg: "bg-slate-50" },
                      { label: "Paid", value: fmtRupee(invoice.paid_amount), color: "text-emerald-700", bg: "bg-emerald-50" },
                      {
                        label: "Due",
                        value: fmtRupee((invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0)),
                        color: ((invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0)) > 0 ? "text-red-700" : "text-emerald-700",
                        bg: ((invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0)) > 0 ? "bg-red-50" : "bg-emerald-50",
                      },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                        <div className={`text-sm font-bold ${color}`}>{value}</div>
                        <div className="text-[10px] text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                  <DetailCard title={`Invoice · ${invoice.id.slice(0, 8).toUpperCase()}`} icon={IndianRupee}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] text-muted-foreground">{fmtDateTime(invoice.created_at)}</div>
                      <StatusBadge status={invoice.status} />
                    </div>
                    {(invoice.invoice_items ?? []).length > 0 && (
                      <div className="rounded-lg border border-border/50 overflow-hidden mb-3">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-1.5 bg-muted/30 text-[9px] font-semibold text-muted-foreground uppercase">
                          <span>Description</span><span>Qty × Rate</span><span className="text-right">Amount</span>
                        </div>
                        {(invoice.invoice_items as any[]).map((item: any) => (
                          <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 border-t border-border/30 text-xs">
                            <div><div className="font-medium">{item.description}</div></div>
                            <div className="text-muted-foreground text-[10px] self-center whitespace-nowrap">{item.quantity} × {fmtRupee(item.rate)}</div>
                            <div className="font-semibold text-right self-center">{fmtRupee(item.amount)}</div>
                          </div>
                        ))}
                        <div className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 bg-muted/20 border-t border-border/50">
                          <span className="text-xs font-bold">Total</span>
                          <span className="text-xs font-bold text-right">{fmtRupee(invoice.total_amount)}</span>
                        </div>
                      </div>
                    )}
                    {(invoice.payments ?? []).length > 0 && (
                      <>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Payment History</p>
                        <div className="space-y-1.5">
                          {(invoice.payments as any[]).map((pay: any) => (
                            <div key={pay.id} className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <div>
                                  <div className="text-xs font-medium capitalize">{pay.method ?? "Cash"}</div>
                                  <div className="text-[10px] text-muted-foreground">{fmtDateTime(pay.paid_at)}</div>
                                </div>
                              </div>
                              <div className="text-sm font-bold text-emerald-700">{fmtRupee(pay.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </DetailCard>
                </>
              )}
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
function DetailCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
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
function DetailRow({ label, value, icon: Icon, full, warn }: { label: string; value?: string | null; icon: any; full?: boolean; warn?: boolean }) {
  if (!value) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">{label}</div>
      <div className={`text-xs flex items-start gap-1 ${warn ? "text-amber-700" : ""}`}>
        <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${warn ? "text-amber-500" : "text-muted-foreground"}`} />
        {value}
      </div>
    </div>
  );
}
function EmptyInline({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-2 py-3 text-muted-foreground">
      <Icon className="h-4 w-4 opacity-30" />
      <span className="text-xs">{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN OPD PAGE
═══════════════════════════════════════════════════════════ */
export function OpdPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({ patient_id: "", doctor_id: "", chief_complaint: "", visit_type: "OPD" });

  /* ── Data ── */
  const { data: visits = [], isLoading, refetch } = useQuery({
    queryKey: ["opd-queue"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("visits")
        .select("*, patients(name, patient_code, phone, gender, blood_group, dob, allergies, emergency_contact), doctors(name, qualification, specialization)")
        .eq("visit_date", today)
        .order("token_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-mini"],
    queryFn: async () => (await supabase.from("patients").select("id,name,patient_code,phone").limit(300)).data ?? [],
  });
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-mini"],
    queryFn: async () => (await supabase.from("doctors").select("id,name,qualification,specialization,is_available").eq("is_available", true)).data ?? [],
  });

  /* ── Realtime ── */
  useEffect(() => {
    const ch = supabase.channel("opd-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "visits" }, () => {
        qc.invalidateQueries({ queryKey: ["opd-queue"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total: visits.length,
    waiting: visits.filter((v: any) => v.status === "waiting").length,
    inConsult: visits.filter((v: any) => v.status === "in-consult").length,
    done: visits.filter((v: any) => v.status === "done").length,
    cancelled: visits.filter((v: any) => v.status === "cancelled").length,
    completionPct: visits.length ? Math.round((visits.filter((v: any) => v.status === "done").length / visits.length) * 100) : 0,
    nextWaiting: visits.find((v: any) => v.status === "waiting") ?? null,
  }), [visits]);

  /* ── Sparkline data: token counts by hour ── */
  const sparkData = useMemo(() => {
    const hours = Array(8).fill(0);
    visits.forEach((v: any) => {
      if (!v.created_at) return;
      try {
        const h = new Date(v.created_at).getHours();
        const idx = Math.min(Math.floor((h - 8) / 2), 7);
        if (idx >= 0) hours[idx]++;
      } catch { }
    });
    return hours;
  }, [visits]);

  /* ── Filtered visits ── */
  const filtered = useMemo(() => {
    return visits.filter((v: any) => {
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || [
        v.patients?.name, v.patients?.patient_code,
        v.doctors?.name, String(v.token_number ?? ""), v.chief_complaint,
      ].some((s) => s?.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [visits, search, statusFilter]);

  /* ── Create token ── */
  const create = useMutation({
    mutationFn: async () => {
      if (!form.patient_id || !form.doctor_id) throw new Error("Patient and doctor required");
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase.from("visits").select("*", { count: "exact", head: true }).eq("visit_date", today);
      const token = (count ?? 0) + 1;
      const { error } = await supabase.from("visits").insert({
        patient_id: form.patient_id, doctor_id: form.doctor_id,
        chief_complaint: form.chief_complaint || null, visit_type: form.visit_type,
        token_number: token, status: "waiting",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("OPD token generated successfully");
      setOpen(false);
      setForm({ patient_id: "", doctor_id: "", chief_complaint: "", visit_type: "OPD" });
      qc.invalidateQueries({ queryKey: ["opd-queue"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("visits").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status updated to ${status}`); qc.invalidateQueries({ queryKey: ["opd-queue"] }); }
  };

  const filterTabs = [
    { key: "all", label: "All", count: stats.total },
    { key: "waiting", label: "Waiting", count: stats.waiting },
    { key: "in-consult", label: "In Consult", count: stats.inConsult },
    { key: "done", label: "Done", count: stats.done },
  ];

  /* ── First waiting patient detail ── */
  const firstWaiting = stats.nextWaiting;
  const fwName = firstWaiting?.patients?.name ?? "—";
  const fwInitials = fwName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const fwColors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500"];
  const fwAvatarColor = fwColors[fwName.charCodeAt(0) % fwColors.length];

  return (
    <div className="space-y-5">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">OPD Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live token queue · {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => generateOpdReport(visits)}>
            <FileDown className="h-3.5 w-3.5" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-3.5 w-3.5" /> New Token
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-600" /> Generate OPD Token
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label className="text-xs mb-1 block">Patient *</Label>
                  <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Search & select patient" /></SelectTrigger>
                    <SelectContent className="max-h-56">
                      {patients.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-mono text-[10px] text-muted-foreground mr-2">{p.patient_code}</span>
                          {p.name}
                          {p.phone && <span className="text-muted-foreground ml-2 text-[10px]">· {p.phone}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Doctor *</Label>
                  <Select value={form.doctor_id} onValueChange={(v) => setForm({ ...form, doctor_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select available doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          Dr. {d.name}{d.qualification && <span className="text-muted-foreground ml-1 text-[10px]">· {d.qualification}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Visit Type</Label>
                  <Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["OPD", "IPD", "Emergency", "Follow-up", "Review"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Chief Complaint</Label>
                  <Textarea
                    value={form.chief_complaint}
                    onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                    placeholder="Describe the main complaint…"
                    rows={3} className="resize-none text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} size="sm">Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={create.isPending} size="sm" className="gap-1.5">
                  {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Generate Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP ROW  (4 cols matching reference)
          [Queue Trend] [Hero/Today Info] [Completion%] [Next Token]
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* ── Queue Trend (like "Health Report Pending" sparkline) ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-slate-700">Queue Trend</p>
              <button className="text-[10px] text-blue-600 font-semibold px-2 py-0.5 bg-blue-50 rounded-full">Today</button>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold text-slate-800">{stats.total}</span>
              <span className="text-xs text-muted-foreground">tokens today</span>
            </div>
            <div className="flex gap-3 mb-3">
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-400" />{stats.waiting} waiting
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-500" />{stats.inConsult} in-consult
              </span>
            </div>
            <Sparkline data={sparkData} color="#3b82f6" height={44} />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              {["8am", "10am", "12pm", "2pm", "4pm", "6pm"].map((t) => <span key={t}>{t}</span>)}
            </div>
          </CardContent>
        </Card>

        {/* ── Hero / Today's Info Card (blue CTA card in reference) ── */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-700 text-white relative overflow-hidden">
          <CardContent className="p-5 relative z-10">
            {/* decorative circles */}
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-white/10 -translate-y-8 translate-x-8 pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-16 w-16 rounded-full bg-white/10 translate-y-6 -translate-x-6 pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">Today's Info</span>
            </div>

            <h3 className="text-base font-extrabold text-white mb-1.5 leading-tight">OPD Live Queue</h3>
            <p className="text-blue-100 text-[11px] leading-relaxed mb-4">
              Manage appointments, consultations and patient flow easily and efficiently.
            </p>

            <div className="flex gap-2">
              {stats.nextWaiting && (
                <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50 h-7 text-xs font-semibold flex-1"
                  onClick={() => updateStatus(stats.nextWaiting.id, "in-consult")}>
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Start Next
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 h-7 text-xs border border-white/20"
                onClick={() => setOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Token
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Completion Rate (like "85% Health Trend Chart") ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Completion Rate</p>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <CompletionDonut pct={stats.completionPct} total={stats.total} done={stats.done} />
            {/* mini sparkline below */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <Sparkline data={[stats.done, stats.inConsult, stats.waiting, stats.cancelled].filter(n => n >= 0)} color="#10b981" height={28} />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>Done</span><span>Consult</span><span>Waiting</span><span>Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Next Token / Checkup Progress (like "Checkup progress" list) ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Next in Queue</p>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            {stats.waiting === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60" />
                <p className="text-xs font-medium text-emerald-600">Queue clear!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visits
                  .filter((v: any) => v.status === "waiting")
                  .slice(0, 3)
                  .map((v: any, idx: number) => {
                    const name = v.patients?.name ?? "—";
                    const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                    const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500"];
                    const avatarColor = avatarColors[name.charCodeAt(0) % avatarColors.length];
                    return (
                      <div key={v.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelected(v)}>
                        <div className="relative shrink-0">
                          <div className={`h-9 w-9 rounded-xl ${avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                            {initials}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white flex items-center justify-center">
                            <span className="text-[8px] font-black text-slate-700">#{v.token_number}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">Dr. {v.doctors?.name ?? "—"}</p>
                          {/* progress bar */}
                          <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden w-full">
                            <div className={`h-full rounded-full ${idx === 0 ? "bg-blue-500 w-2/3" : idx === 1 ? "bg-amber-400 w-1/3" : "bg-slate-300 w-1/6"}`} />
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                {stats.waiting > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground pt-1">
                    +{stats.waiting - 3} more waiting
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM ROW  (3 cols)
          [Current Patient Info] [Visit Bar Chart] [Doctors on Duty]
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Current Patient Info (like "Medical Information" card) ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Current Patient</p>
              <button className="text-[10px] text-blue-600 font-semibold hover:underline">See Details</button>
            </div>

            {!firstWaiting ? (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <User className="h-9 w-9 opacity-20" />
                <p className="text-xs">No patient waiting</p>
              </div>
            ) : (
              <>
                {/* Patient header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-11 w-11 rounded-full ${fwAvatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {fwInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{fwName}</p>
                    <p className="text-[10px] text-muted-foreground">{firstWaiting.patients?.patient_code ?? "Patient"}</p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Visit Type</p>
                    <p className="font-semibold text-slate-700">{firstWaiting.visit_type ?? "OPD"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Doctor</p>
                    <p className="font-semibold text-slate-700">Dr. {firstWaiting.doctors?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Chief Complaint</p>
                    <p className="font-semibold text-slate-700 line-clamp-2">{firstWaiting.chief_complaint ?? "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Token</p>
                    <p className="font-bold text-blue-600">#{firstWaiting.token_number ?? "—"}</p>
                  </div>
                  {firstWaiting.patients?.gender && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Gender</p>
                      <p className="font-semibold text-slate-700">{firstWaiting.patients.gender}</p>
                    </div>
                  )}
                  {firstWaiting.patients?.blood_group && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Blood Group</p>
                      <p className="font-bold text-red-600">{firstWaiting.patients.blood_group}</p>
                    </div>
                  )}
                  {firstWaiting.patients?.allergies && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Allergies</p>
                      <p className="text-amber-700 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {firstWaiting.patients.allergies}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full mt-4 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={() => updateStatus(firstWaiting.id, "in-consult")}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Start Consultation
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Visit Bar Chart (like "Patient health report") ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-slate-700">Patient Visit Report</p>
              <button className="text-[10px] text-blue-600 font-semibold hover:underline">See Details</button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Weekly OPD visit trend</p>

            {/* Legend */}
            <div className="flex gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Active visits
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm bg-blue-200" /> Completed
              </div>
            </div>

            <MiniBarChart visits={visits} />

            {/* Summary below chart */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/30">
              {[
                { label: "Total", value: stats.total, color: "text-slate-700" },
                { label: "Waiting", value: stats.waiting, color: "text-amber-600" },
                { label: "Active", value: stats.inConsult, color: "text-blue-600" },
                { label: "Done", value: stats.done, color: "text-emerald-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Doctors on Duty (like "My Doctor" list) ── */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Doctors on Duty</p>
              <button className="text-[10px] text-blue-600 font-semibold hover:underline">See Details</button>
            </div>

            {doctors.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Stethoscope className="h-8 w-8 opacity-20" />
                <p className="text-xs">No doctors available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {doctors.slice(0, 5).map((d: any, i: number) => {
                  const dColors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500"];
                  const dColor = dColors[i % dColors.length];
                  const dInitials = d.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                  // count today's visits for this doctor
                  const docVisits = visits.filter((v: any) => v.doctors?.name === d.name);
                  const docWaiting = docVisits.filter((v: any) => v.status === "waiting").length;
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className={`h-9 w-9 rounded-xl ${dColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {dInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">Dr. {d.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {d.specialization ?? d.qualification ?? "General Physician"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {docWaiting > 0 ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {docWaiting} waiting
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════
          FILTER + SEARCH BAR
      ══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1.5 flex-wrap">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${statusFilter === key
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600"
                }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>{count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search token, name, doctor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOKEN GRID
      ══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading queue…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Activity className="h-10 w-10 opacity-20" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {search || statusFilter !== "all" ? "No matching visits" : "No visits today"}
              </p>
              <p className="text-xs mt-1">
                {search || statusFilter !== "all" ? "Try adjusting your filters" : "Generate the first OPD token to get started"}
              </p>
            </div>
            <Button size="sm" className="gap-1.5 mt-1 bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((v: any) => {
            const cfg = STATUS_CFG[v.status ?? "waiting"] ?? STATUS_CFG.waiting;
            const patName = v.patients?.name ?? "Unknown";
            const initials = patName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
            const avatarColors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
            const avatarColor = avatarColors[patName.charCodeAt(0) % avatarColors.length];

            return (
              <Card
                key={v.id}
                className={`border-l-4 ${cfg.border} ${cfg.cardBg} shadow-sm hover:shadow-md transition-all cursor-pointer group border-0`}
                style={{ borderLeftWidth: "4px", borderLeftStyle: "solid" }}
                onClick={() => setSelected(v)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">TOKEN</span>
                      <span className="text-3xl font-black text-foreground leading-none">#{v.token_number ?? "—"}</span>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>

                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`h-9 w-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{patName}</div>
                      <div className="text-[10px] text-muted-foreground">{v.patients?.patient_code}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="h-3 w-3 shrink-0" />
                      <span className="truncate">Dr. {v.doctors?.name ?? "—"}</span>
                    </div>
                    {v.visit_type && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 shrink-0" />
                        <span>{v.visit_type}</span>
                      </div>
                    )}
                    {v.chief_complaint && (
                      <div className="flex items-start gap-1.5">
                        <ClipboardList className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{v.chief_complaint}</span>
                      </div>
                    )}
                    {v.created_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{timeAgo(v.created_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={(e) => { e.stopPropagation(); setSelected(v); }}>
                      <Eye className="h-3 w-3 mr-1" /> Details
                    </Button>
                    {v.status === "waiting" && (
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); updateStatus(v.id, "in-consult"); }}>
                        <UserCheck className="h-3 w-3 mr-1" /> Start
                      </Button>
                    )}
                    {v.status === "in-consult" && (
                      <Button size="sm" className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={(e) => { e.stopPropagation(); updateStatus(v.id, "done"); }}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                      </Button>
                    )}
                    {v.status === "done" && (
                      <div className="flex-1 h-7 flex items-center justify-center text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Visit Detail Sheet */}
      <VisitDetailSheet
        visit={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onStatusChange={updateStatus}
      />
    </div>
  );
}