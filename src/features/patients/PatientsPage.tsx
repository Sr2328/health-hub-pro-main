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
  Heart, Eye, TrendingUp, Receipt,
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
function age(dob?: string | null) {
  if (!dob) return null;
  try { return differenceInYears(new Date(), new Date(dob)); } catch { return null; }
}
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

const BLOOD_COLORS: Record<string, string> = {
  "A+": "bg-red-100 text-red-700", "A-": "bg-red-100 text-red-700",
  "B+": "bg-orange-100 text-orange-700", "B-": "bg-orange-100 text-orange-700",
  "AB+": "bg-purple-100 text-purple-700", "AB-": "bg-purple-100 text-purple-700",
  "O+": "bg-blue-100 text-blue-700", "O-": "bg-blue-100 text-blue-700",
};

function StatusPill({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
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
function PatientAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
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

/* ═══════════════════════════════════════════════════════════
   PATIENT DETAIL SHEET
═══════════════════════════════════════════════════════════ */
function PatientDetailSheet({ patient, open, onClose }: {
  patient: any; open: boolean; onClose: () => void;
}) {
  const patAge = age(patient?.dob);

  /* Visits */
  const { data: visits = [] } = useQuery({
    queryKey: ["patient-visits", patient?.id],
    enabled: !!patient?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("visits")
        .select("*, doctors(name)")
        .eq("patient_id", patient.id)
        .order("visit_date", { ascending: false });
      return data ?? [];
    },
  });

  /* Appointments */
  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    enabled: !!patient?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(name)")
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  /* Lab + Radiology + Prescriptions (via visit_ids) */
  const visitIds = visits.map((v: any) => v.id);

  const { data: labOrders = [] } = useQuery({
    queryKey: ["patient-labs", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_orders")
        .select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: radioOrders = [] } = useQuery({
    queryKey: ["patient-radiology", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("radiology_orders")
        .select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("*, visits(visit_date, doctors(name))")
        .in("visit_id", visitIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  /* Invoices + Payments (via visit_ids) */
  const { data: invoices = [] } = useQuery({
    queryKey: ["patient-invoices", patient?.id, visitIds.length],
    enabled: visitIds.length > 0 && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*, invoice_items(*), payments(*), visits(visit_date)")
        .in("visit_id", visitIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const totalBilled = invoices.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0);
  const totalCollected = invoices.reduce((s: number, i: any) => s + (i.paid_amount ?? 0), 0);
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
                {patient.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
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

            {/* Summary chips */}
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

            {/* ── OVERVIEW TAB ── */}
            <TabsContent value="overview" className="mt-0 space-y-3">
              {/* Demographics */}
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

              {/* Recent visit snapshot */}
              {visits[0] && (
                <SectionCard title="Last Visit" icon={Stethoscope}>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <InfoRow icon={Calendar} label="Date" value={fmtDate(visits[0].visit_date)} />
                    <InfoRow icon={Stethoscope} label="Doctor" value={(visits[0] as any).doctors?.name} />
                    <InfoRow icon={Activity} label="Type" value={visits[0].visit_type} />
                    <InfoRow icon={Clock} label="Status" value={visits[0].status} />
                    <InfoRow icon={ClipboardList} label="Complaint" value={visits[0].chief_complaint} full />
                    <InfoRow icon={CheckCircle2} label="Diagnosis" value={visits[0].diagnosis} full />
                  </div>
                  {visits[0].vitals && (
                    <VitalsRow vitals={visits[0].vitals} />
                  )}
                </SectionCard>
              )}

              {/* Billing snapshot */}
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

            {/* ── VISITS TAB ── */}
            <TabsContent value="visits" className="mt-0 space-y-2">
              {visits.length === 0 ? <EmptyState icon={Activity} text="No visits recorded" /> : visits.map((v: any) => (
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
                    {v.notes && (
                      <div className="text-[10px] text-muted-foreground px-1">{v.notes}</div>
                    )}
                    {v.vitals && <VitalsRow vitals={v.vitals} compact />}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ── APPOINTMENTS TAB ── */}
            <TabsContent value="appts" className="mt-0 space-y-2">
              {appointments.length === 0 ? <EmptyState icon={Calendar} text="No appointments found" /> : appointments.map((a: any) => (
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

            {/* ── CLINICAL TAB (Lab + Radiology + Prescriptions) ── */}
            <TabsContent value="clinical" className="mt-0 space-y-3">
              {/* Lab Orders */}
              <SectionCard title={`Lab Orders (${labOrders.length})`} icon={FlaskConical}>
                {labOrders.length === 0 ? <EmptyState icon={FlaskConical} text="No lab orders" small /> : (
                  <div className="space-y-1.5">
                    {labOrders.map((l: any) => (
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

              {/* Radiology Orders */}
              <SectionCard title={`Radiology (${radioOrders.length})`} icon={Radiation}>
                {radioOrders.length === 0 ? <EmptyState icon={Radiation} text="No radiology orders" small /> : (
                  <div className="space-y-1.5">
                    {radioOrders.map((r: any) => (
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

              {/* Prescriptions */}
              <SectionCard title={`Prescriptions (${prescriptions.length})`} icon={Pill}>
                {prescriptions.length === 0 ? <EmptyState icon={Pill} text="No prescriptions" small /> : (
                  <div className="space-y-3">
                    {prescriptions.map((p: any) => {
                      const meds: any[] = Array.isArray(p.medications) ? p.medications : [];
                      return (
                        <div key={p.id} className="border border-border/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground">{fmtDate(p.visits?.visit_date)} · Dr. {p.visits?.doctors?.name ?? "N/A"}</span>
                          </div>
                          {meds.length > 0 && (
                            <div className="space-y-1">
                              {meds.map((m: any, mi: number) => (
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

            {/* ── BILLING TAB ── */}
            <TabsContent value="billing" className="mt-0 space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <BillingChip label="Total Billed" value={fmtRupee(totalBilled)} color="text-slate-700" bg="bg-slate-50" />
                <BillingChip label="Amount Paid" value={fmtRupee(totalCollected)} color="text-emerald-700" bg="bg-emerald-50" />
                <BillingChip label="Outstanding" value={fmtRupee(totalDue)} color={totalDue > 0 ? "text-red-700" : "text-emerald-700"} bg={totalDue > 0 ? "bg-red-50" : "bg-emerald-50"} />
              </div>

              {invoices.length === 0 ? <EmptyState icon={Receipt} text="No invoices found" /> : invoices.map((inv: any) => (
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

                    {/* Invoice items */}
                    {(inv.invoice_items ?? []).length > 0 && (
                      <div className="border-t pt-2 mt-2 space-y-1">
                        {(inv.invoice_items as any[]).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                            <span className="text-muted-foreground ml-2 shrink-0">{item.quantity} × {fmtRupee(item.rate)}</span>
                            <span className="font-medium ml-3 shrink-0">{fmtRupee(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment rows */}
                    {(inv.payments ?? []).length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Payments</p>
                        {(inv.payments as any[]).map((pay: any) => (
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

                    {/* Paid/due bar */}
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
   SMALL HELPER COMPONENTS
───────────────────────────────────── */
function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
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

function InfoRow({ icon: Icon, label, value, full, warn }: { icon: any; label: string; value?: string | null; full?: boolean; warn?: boolean }) {
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

function VitalsRow({ vitals, compact }: { vitals: any; compact?: boolean }) {
  if (!vitals || typeof vitals !== "object") return null;
  const entries = Object.entries(vitals as Record<string, any>).filter(([, v]) => v != null && v !== "");
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

function BillingChip({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, small }: { icon: any; text: string; small?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-muted-foreground gap-2 ${small ? "py-4" : "py-10"}`}>
      <Icon className={`${small ? "h-6 w-6" : "h-10 w-10"} opacity-20`} />
      <span className="text-xs">{text}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PATIENTS LIST PAGE
═══════════════════════════════════════════════════════════ */
export function PatientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", dob: "", gender: "",
    blood_group: "", address: "", emergency_contact: "", allergies: "",
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", search],
    queryFn: async () => {
      let q = supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(200);
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
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search, register, and manage patient records"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generatePatientReport(patients)} className="gap-2">
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>

            {/* Register Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New Patient</Button>
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
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => (
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
                  <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full sm:w-auto">
                    {create.isPending ? "Registering…" : "Register Patient"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Patients", value: patients.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Male", value: patients.filter((p: any) => p.gender === "Male").length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Female", value: patients.filter((p: any) => p.gender === "Female").length, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "With Allergies", value: patients.filter((p: any) => p.allergies).length, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                <span className={`text-base font-bold ${color}`}>{value}</span>
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or patient code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">Patient</TableHead>
                  <TableHead className="text-xs font-semibold hidden sm:table-cell">Code</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">Phone</TableHead>
                  <TableHead className="text-xs font-semibold hidden lg:table-cell">DOB / Age</TableHead>
                  <TableHead className="text-xs font-semibold hidden md:table-cell">Blood</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                      Loading patients…
                    </TableCell>
                  </TableRow>
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <User className="h-8 w-8 opacity-20" />
                        <span className="text-sm">No patients found</span>
                        {search && <span className="text-xs">Try a different search</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : patients.map((p: any) => {
                  const patAge = age(p.dob);
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setSelected(p)}>
                      {/* Patient name + avatar */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <PatientAvatar name={p.name} size="sm" />
                          <div>
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground sm:hidden">{p.phone}</div>
                            {p.allergies && (
                              <div className="flex items-center gap-1 text-[9px] text-amber-600 sm:hidden">
                                <AlertTriangle className="h-2.5 w-2.5" /> Allergies
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="font-mono text-[10px]">{p.patient_code}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {p.dob ? `${fmtDate(p.dob)}${patAge != null ? ` (${patAge}y)` : ""}` : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.blood_group ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BLOOD_COLORS[p.blood_group] ?? "bg-gray-100 text-gray-600"}`}>
                            {p.blood_group}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => { e.stopPropagation(); setSelected(p); }}
                        >
                          View Details <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {patients.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-2 text-right">
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

/* ─────────────────────────────────────
   FORM FIELD HELPER
───────────────────────────────────── */
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs mb-1 block">{label}</Label>
      {children}
    </div>
  );
}