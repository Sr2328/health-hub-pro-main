import { useState, useMemo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BedDouble, Plus, Search, FileDown, User, Wrench, CheckCircle2,
  AlertCircle, Edit3, Trash2, UserMinus, RefreshCw, Filter,
  LayoutGrid, List, Building2, ChevronDown, ChevronRight,
  TrendingUp, Activity, Heart, ShieldCheck,
} from "lucide-react";
import type { Key } from "react";
import type { Bed, BedStatus, Patient } from "@/integrations/supabase/types";

/* ─────────────────────────────────────
   CONSTANTS
───────────────────────────────────── */
const STATUS_CONFIG: Record<
  BedStatus | string,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ReactNode }
> = {
  available: {
    label: "Available",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  occupied: {
    label: "Occupied",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: <User className="h-4 w-4 text-rose-500" />,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: <Wrench className="h-4 w-4 text-amber-500" />,
  },
  reserved: {
    label: "Reserved",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
  },
};

const WARD_OPTIONS = [
  "General", "ICU", "CCU", "Pediatric", "Maternity",
  "Surgical", "Orthopedic", "Oncology", "Emergency", "Neurology",
];
const STATUS_OPTIONS: BedStatus[] = ["available", "occupied", "maintenance", "reserved"];

/* ─────────────────────────────────────
   TYPES
───────────────────────────────────── */
interface BedWithPatient extends Bed {
  status: any;
  bed_number: ReactNode;
  floor: any;
  ward: string;
  patient_id: string | null;
  id: Key | null | undefined;
  patient?: Patient | null;
}
interface BedFormData {
  ward: string;
  floor: number | null;
  bed_number: string;
  status: BedStatus;
  patient_id: string | null;
}
const DEFAULT_FORM: BedFormData = {
  ward: "", floor: null, bed_number: "", status: "available", patient_id: null,
};

/* ─────────────────────────────────────
   OCCUPANCY DONUT  (SVG, no dep)
───────────────────────────────────── */
function OccupancyDonut({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* track */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {/* filled arc */}
        <circle cx="70" cy="70" r={r} fill="none"
          stroke={pct >= 80 ? "#f43f5e" : pct >= 60 ? "#f59e0b" : "#3b82f6"}
          strokeWidth="16"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
        />
        <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">{pct}%</text>
        <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#94a3b8">Occupancy</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────
   BED HEATMAP  (activity grid style)
───────────────────────────────────── */
function BedHeatmap({ beds }: { beds: BedWithPatient[] }) {
  const wards = Array.from(new Set(beds.map((b) => b.ward))).sort().slice(0, 6);
  const colorMap: Record<string, string> = {
    available: "bg-emerald-400",
    occupied: "bg-blue-600",
    maintenance: "bg-amber-400",
    reserved: "bg-violet-400",
  };

  return (
    <div className="space-y-2">
      {/* legend row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">Less</span>
        <div className="flex gap-1">
          {["bg-slate-200", "bg-blue-200", "bg-blue-400", "bg-blue-500", "bg-blue-700"].map((c, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>

      {wards.map((ward) => {
        const wardBeds = beds.filter((b) => b.ward === ward);
        return (
          <div key={ward} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{ward}</span>
            <div className="flex flex-wrap gap-1">
              {wardBeds.map((bed) => (
                <TooltipProvider key={String(bed.id)}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-4 w-4 rounded-sm cursor-pointer transition-transform hover:scale-125 ${colorMap[bed.status] ?? "bg-slate-300"}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-medium text-xs">{String(bed.bed_number)}</p>
                      <p className="text-[10px] capitalize">{bed.status}{bed.patient ? ` · ${bed.patient.name}` : ""}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        );
      })}

      {/* color legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(colorMap).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${c}`} />
            <span className="text-[10px] text-muted-foreground capitalize">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   BED CARD (grid tile)
───────────────────────────────────── */
function BedCard({
  bed, onEdit, onDelete, onDischarge,
}: {
  bed: BedWithPatient;
  onEdit: (b: BedWithPatient) => void;
  onDelete: (b: BedWithPatient) => void;
  onDischarge: (b: BedWithPatient) => void;
}) {
  const cfg = STATUS_CONFIG[bed.status] ?? STATUS_CONFIG.available;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`group relative rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${cfg.bg} ${cfg.border}`}
            onClick={() => onEdit(bed)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs">{bed.bed_number}</span>
              {cfg.icon}
            </div>
            {bed.status === "occupied" && bed.patient && (
              <p className="text-[9px] font-medium truncate text-rose-700">{bed.patient.name}</p>
            )}
            {bed.floor && (
              <p className="text-[9px] text-muted-foreground mt-0.5">F{bed.floor}</p>
            )}
            <div className="absolute inset-0 rounded-xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 pointer-events-none group-hover:pointer-events-auto">
              <button className="bg-white shadow rounded-lg p-1.5 hover:bg-primary hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit(bed); }}>
                <Edit3 className="h-3 w-3" />
              </button>
              {bed.status === "occupied" && (
                <button className="bg-white shadow rounded-lg p-1.5 hover:bg-amber-500 hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDischarge(bed); }}>
                  <UserMinus className="h-3 w-3" />
                </button>
              )}
              <button className="bg-white shadow rounded-lg p-1.5 hover:bg-destructive hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(bed); }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{String(bed.bed_number)} — {cfg.label}</p>
          {bed.patient && <p className="text-xs">{bed.patient.name} · {bed.patient.phone}</p>}
          {bed.floor && <p className="text-xs">Floor {bed.floor}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─────────────────────────────────────
   BED FORM DIALOG
───────────────────────────────────── */
function BedFormDialog({
  open, onClose, bed, patients, onSave,
}: {
  open: boolean;
  onClose: () => void;
  bed: BedWithPatient | null;
  patients: Patient[];
  onSave: (data: BedFormData, id?: string) => void;
}) {
  const [form, setForm] = useState<BedFormData>(
    bed
      ? { ward: bed.ward, floor: bed.floor, bed_number: String(bed.bed_number), status: bed.status as BedStatus, patient_id: bed.patient_id }
      : DEFAULT_FORM
  );
  const set = (k: keyof BedFormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bed ? "Edit Bed" : "Add New Bed"}</DialogTitle>
          <DialogDescription>
            {bed ? "Update bed details, status, or assigned patient." : "Create a new bed entry for ward management."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bed Number *</Label>
              <Input placeholder="e.g. A-101" value={form.bed_number} onChange={(e) => set("bed_number", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input type="number" placeholder="e.g. 1" value={form.floor ?? ""}
                onChange={(e) => set("floor", e.target.value ? Number(e.target.value) : null)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ward *</Label>
            <Select value={form.ward} onValueChange={(v) => set("ward", v)}>
              <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
              <SelectContent>
                {WARD_OPTIONS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select value={form.status} onValueChange={(v) => { set("status", v); if (v !== "occupied") set("patient_id", null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.status === "occupied" && (
            <div className="space-y-1.5">
              <Label>Assigned Patient</Label>
              <Select value={form.patient_id ?? "none"} onValueChange={(v) => set("patient_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No patient —</SelectItem>
                  {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.patient_code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form, bed?.id as string | undefined)} disabled={!form.ward || !form.bed_number}>
            {bed ? "Save Changes" : "Add Bed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export function BedsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWard, setFilterWard] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [collapsedWards, setCollapsedWards] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<BedWithPatient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BedWithPatient | null>(null);
  const [dischargeTarget, setDischargeTarget] = useState<BedWithPatient | null>(null);

  /* ── queries ── */
  const { data: beds = [], isLoading } = useQuery<BedWithPatient[]>({
    queryKey: ["beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("*, patient:patients(id, name, patient_code, phone, blood_group, gender)")
        .order("ward").order("bed_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients").select("id, name, patient_code, phone, blood_group, gender").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  /* ── mutations ── */
  const saveMutation = useMutation({
    mutationFn: async ({ data, id }: { data: BedFormData; id?: string }) => {
      if (id) {
        const { error } = await supabase.from("beds").update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("beds").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      toast.success(id ? "Bed updated" : "Bed added");
      setFormOpen(false);
      setEditingBed(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      toast.success("Bed removed");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const dischargeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beds")
        .update({ status: "available", patient_id: null } as Partial<Bed>).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      toast.success("Patient discharged — bed is now available");
      setDischargeTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /* ── derived ── */
  const stats = useMemo(() => ({
    total: beds.length,
    available: beds.filter((b) => b.status === "available").length,
    occupied: beds.filter((b) => b.status === "occupied").length,
    maintenance: beds.filter((b) => b.status === "maintenance").length,
    reserved: beds.filter((b) => b.status === "reserved").length,
    occupancyPct: beds.length
      ? Math.round((beds.filter((b) => b.status === "occupied").length / beds.length) * 100)
      : 0,
    freePct: beds.length
      ? Math.round((beds.filter((b) => b.status === "available").length / beds.length) * 100)
      : 0,
  }), [beds]);

  const filtered = useMemo(() => beds.filter((b) => {
    const matchSearch = !search
      || String(b.bed_number).toLowerCase().includes(search.toLowerCase())
      || b.ward.toLowerCase().includes(search.toLowerCase())
      || b.patient?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchWard = filterWard === "all" || b.ward === filterWard;
    return matchSearch && matchStatus && matchWard;
  }), [beds, search, filterStatus, filterWard]);

  const wards = useMemo(() => Array.from(new Set(filtered.map((b) => b.ward))).sort(), [filtered]);
  const allWards = useMemo(() => Array.from(new Set(beds.map((b) => b.ward))).sort(), [beds]);

  const toggleWard = (w: string) => setCollapsedWards((prev) => {
    const next = new Set(prev);
    next.has(w) ? next.delete(w) : next.add(w);
    return next;
  });

  const handleSave = (data: BedFormData, id?: string) => saveMutation.mutate({ data, id });
  const handleEdit = (bed: BedWithPatient) => { setEditingBed(bed); setFormOpen(true); };
  const handleAdd = () => { setEditingBed(null); setFormOpen(true); };

  const handleExport = () => {
    const rows = [
      ["Bed Number", "Ward", "Floor", "Status", "Patient Name", "Patient Code", "Patient Phone"],
      ...beds.map((b) => [b.bed_number, b.ward, b.floor ?? "", b.status, b.patient?.name ?? "", b.patient?.patient_code ?? "", b.patient?.phone ?? ""]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `beds-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Beds data exported as CSV");
  };

  /* ── ward summary rows (like Team Management table) ── */
  const wardSummaries = useMemo(() => allWards.map((ward) => {
    const wb = beds.filter((b) => b.ward === ward);
    return {
      ward,
      total: wb.length,
      occupied: wb.filter((b) => b.status === "occupied").length,
      available: wb.filter((b) => b.status === "available").length,
      maintenance: wb.filter((b) => b.status === "maintenance").length,
      occupancyPct: wb.length ? Math.round((wb.filter((b) => b.status === "occupied").length / wb.length) * 100) : 0,
    };
  }), [beds, allWards]);

  /* ── list row ── */
  const ListRow = ({ bed }: { bed: BedWithPatient }) => {
    const cfg = STATUS_CONFIG[bed.status] ?? STATUS_CONFIG.available;
    return (
      <tr className="border-b hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3 font-medium text-sm">{String(bed.bed_number)}</td>
        <td className="px-4 py-3 text-muted-foreground text-sm">{bed.ward}</td>
        <td className="px-4 py-3 text-muted-foreground text-sm">{bed.floor ?? "—"}</td>
        <td className="px-4 py-3">
          <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border} font-medium text-xs`} variant="outline">{cfg.label}</Badge>
        </td>
        <td className="px-4 py-3">
          {bed.patient ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {bed.patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm leading-tight">{bed.patient.name}</p>
                <p className="text-[10px] text-muted-foreground">{bed.patient.patient_code} · {bed.patient.phone}</p>
              </div>
            </div>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(bed)}>
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
            {bed.status === "occupied" && (
              <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-amber-600" onClick={() => setDischargeTarget(bed)}>
                <UserMinus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteTarget(bed)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-5">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bed Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time ward & bed allocation with patient tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9"
            onClick={() => qc.invalidateQueries({ queryKey: ["beds"] })}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={handleExport}>
            <FileDown className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button size="sm" className="gap-1.5 h-9 bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Bed
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TOP ROW  — Hero card + Heatmap + Donut
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── HERO STAT CARD (left, matches "Contributors" card) ── */}
        <Card className="border-0 shadow-sm bg-white lg:col-span-1">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Bed Overview</p>

            {/* Twin big numbers */}
            <div className="flex items-start gap-6 mb-4">
              <div>
                <p className="text-4xl font-extrabold text-slate-800 leading-none">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">Total beds</p>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-emerald-600 leading-none">{stats.available}</p>
                <p className="text-xs text-muted-foreground mt-1">Available now</p>
              </div>
            </div>

            {/* 4 mini stat chips */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Occupied", value: stats.occupied, dot: "bg-rose-500", pct: stats.occupancyPct },
                { label: "Available", value: stats.available, dot: "bg-emerald-500", pct: stats.freePct },
                { label: "Maintenance", value: stats.maintenance, dot: "bg-amber-500", pct: stats.total ? Math.round((stats.maintenance / stats.total) * 100) : 0 },
                { label: "Reserved", value: stats.reserved, dot: "bg-blue-500", pct: stats.total ? Math.round((stats.reserved / stats.total) * 100) : 0 },
              ].map(({ label, value, dot, pct }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${dot}`} />
                  <div>
                    <p className="text-base font-bold text-slate-800 leading-tight">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── BED HEATMAP (center, like activity grid) ── */}
        <Card className="border-0 shadow-sm bg-white lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Bed Activity Map</p>
              <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                By Ward
              </span>
            </div>
            {beds.length === 0
              ? <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">No data</div>
              : <BedHeatmap beds={beds} />
            }
          </CardContent>
        </Card>

        {/* ── OCCUPANCY DONUT (right, like "Employee Turnover Rate") ── */}
        <Card className="border-0 shadow-sm bg-white lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Occupancy Rate</p>
              <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">Details →</span>
            </div>

            <OccupancyDonut pct={stats.occupancyPct} />

            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-rose-500" /> Occupied beds
                </span>
                <span className="font-semibold text-slate-700">{stats.occupied} Beds</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" /> Available beds
                </span>
                <span className="font-semibold text-slate-700">{stats.available} Beds</span>
              </div>
              {stats.occupancyPct > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    {stats.occupancyPct >= 80 ? "High occupancy — review capacity" : `${stats.freePct}% beds free`}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM ROW  — Ward table + CTA card
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── WARD SUMMARY TABLE (like "Team Management") ── */}
        <Card className="border-0 shadow-sm bg-white lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/40">
              <p className="text-sm font-semibold text-slate-700">Ward Summary</p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search ward…"
                  className="pl-8 h-7 text-xs w-40"
                  value={filterWard === "all" ? "" : filterWard}
                  onChange={(e) => setFilterWard(e.target.value || "all")}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/60">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500">Ward</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">Total Beds</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">Occupied</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">Available</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500">Occupancy</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 pr-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wardSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground text-xs">No ward data</td>
                    </tr>
                  ) : wardSummaries.map(({ ward, total, occupied, available, maintenance, occupancyPct }) => (
                    <tr key={ward} className="border-b border-border/30 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-800">{ward}</p>
                            <p className="text-[10px] text-muted-foreground">{total} beds total</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{total}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-rose-600">{occupied}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-emerald-600">{available}</span>
                      </td>
                      <td className="px-4 py-3">
                        {/* mini progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${occupancyPct >= 80 ? "bg-rose-500" : occupancyPct >= 60 ? "bg-amber-400" : "bg-blue-500"}`}
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{occupancyPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right pr-5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${occupancyPct >= 80
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : occupancyPct >= 60
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                        >
                          {occupancyPct >= 80 ? "High" : occupancyPct >= 60 ? "Moderate" : "Low"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── PROMO / INFO CARD (like TalentSync CTA) ── */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            {/* decorative circles */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 translate-y-8 -translate-x-8" />

            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">MediBed</span>
            </div>

            <h3 className="text-xl font-extrabold text-white leading-snug mb-2">
              Smart bed<br />allocation system
            </h3>
            <p className="text-blue-100 text-xs mb-5 leading-relaxed">
              Manage wards, track patients, and optimise occupancy in real time across all departments.
            </p>

            <div className="space-y-2 mb-5">
              {[
                { icon: ShieldCheck, label: "Auto-discharge alerts" },
                { icon: Activity, label: "Live occupancy tracking" },
                { icon: TrendingUp, label: "Ward performance reports" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-blue-300 shrink-0" />
                  <span className="text-blue-100 text-xs">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {["bg-emerald-400", "bg-rose-400", "bg-amber-400", "bg-violet-400"].map((c, i) => (
                  <div key={i} className={`h-6 w-6 rounded-full ${c} border-2 border-blue-700 flex items-center justify-center`}>
                    <User className="h-3 w-3 text-white" />
                  </div>
                ))}
                <div className="h-6 w-6 rounded-full bg-white/20 border-2 border-blue-700 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">{beds.filter((b) => b.status === "occupied").length}+</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold h-7 px-3"
                onClick={handleAdd}
              >
                Add Bed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════
          FILTERS + VIEW TOGGLE
      ══════════════════════════════════════════════════ */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bed, ward, patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterWard} onValueChange={setFilterWard}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Ward" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {allWards.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="ml-auto">
              <TabsList className="h-9">
                <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* status legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFilterStatus(filterStatus === k ? "all" : k)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all ${filterStatus === k ? `${v.bg} ${v.border} ${v.color} ring-1 ring-offset-1 ring-current` : `${v.bg} ${v.border} ${v.color} opacity-70 hover:opacity-100`
                  }`}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════
          BEDS CONTENT
      ══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" /> Loading beds…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
          <BedDouble className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No beds match your filters.</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterWard("all"); }}>
            Clear filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-4">
          {wards.map((ward) => {
            const wardBeds = filtered.filter((b) => b.ward === ward);
            const collapsed = collapsedWards.has(ward);
            const ws = {
              total: wardBeds.length,
              occupied: wardBeds.filter((b) => b.status === "occupied").length,
              available: wardBeds.filter((b) => b.status === "available").length,
            };
            return (
              <Card key={ward} className="border-0 shadow-sm overflow-hidden bg-white">
                <CardHeader
                  className="py-3 px-4 cursor-pointer hover:bg-slate-50/60 transition-colors border-b border-border/40"
                  onClick={() => toggleWard(ward)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">{ward} Ward</CardTitle>
                      <Badge variant="secondary" className="text-[10px]">{ws.total} beds</Badge>
                      <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200" variant="outline">{ws.occupied} occupied</Badge>
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">{ws.available} free</Badge>
                    </div>
                    {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </div>
                </CardHeader>
                {!collapsed && (
                  <CardContent className="px-4 pb-4 pt-3">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-14 gap-2">
                      {wardBeds.map((bed) => (
                        <BedCard key={String(bed.id)} bed={bed}
                          onEdit={handleEdit} onDelete={setDeleteTarget} onDischarge={setDischargeTarget} />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Bed #</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Ward</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Floor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bed) => <ListRow key={String(bed.id)} bed={bed} />)}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── FORM DIALOG ── */}
      {formOpen && (
        <BedFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingBed(null); }}
          bed={editingBed}
          patients={patients}
          onSave={handleSave}
        />
      )}

      {/* ── DELETE CONFIRM ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bed {String(deleteTarget?.bed_number)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the bed from {deleteTarget?.ward} Ward.
              {deleteTarget?.status === "occupied" && (
                <span className="block mt-1 text-destructive font-medium">
                  Warning: This bed currently has a patient assigned!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(String(deleteTarget.id))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── DISCHARGE CONFIRM ── */}
      <AlertDialog open={!!dischargeTarget} onOpenChange={(o) => !o && setDischargeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discharge Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{dischargeTarget?.patient?.name}</strong> from bed{" "}
              <strong>{String(dischargeTarget?.bed_number)}</strong> and mark it as available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dischargeTarget && dischargeMutation.mutate(String(dischargeTarget.id))}>
              Discharge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}