import { useState, useMemo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/sonner"
import {
  BedDouble,
  Plus,
  Search,
  FileDown,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  UserMinus,
  RefreshCw,
  Filter,
  LayoutGrid,
  List,
  Building2,
  FlaskConical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Bed, BedStatus, Patient } from "@/integrations/supabase/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BedStatus | string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  available: {
    label: "Available",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  occupied: {
    label: "Occupied",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: <User className="h-4 w-4 text-rose-500" />,
  },
  maintenance: {
    label: "Maintenance",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Wrench className="h-4 w-4 text-amber-500" />,
  },
  reserved: {
    label: "Reserved",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
  },
};

const WARD_OPTIONS = [
  "General",
  "ICU",
  "CCU",
  "Pediatric",
  "Maternity",
  "Surgical",
  "Orthopedic",
  "Oncology",
  "Emergency",
  "Neurology",
];

const STATUS_OPTIONS: BedStatus[] = ["available", "occupied", "maintenance", "reserved"];

// ─── types ────────────────────────────────────────────────────────────────────

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
  ward: "",
  floor: null,
  bed_number: "",
  status: "available",
  patient_id: null,
};

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${color}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ─── bed card ─────────────────────────────────────────────────────────────────

function BedCard({
  bed,
  onEdit,
  onDelete,
  onDischarge,
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
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{bed.bed_number}</span>
              {cfg.icon}
            </div>

            {bed.status === "occupied" && bed.patient && (
              <p className="text-[10px] font-medium truncate text-rose-700">
                {bed.patient.name}
              </p>
            )}
            {bed.status === "occupied" && !bed.patient && (
              <p className="text-[10px] text-muted-foreground">Patient assigned</p>
            )}
            {bed.floor && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Floor {bed.floor}</p>
            )}

            {/* hover actions */}
            <div className="absolute inset-0 rounded-xl bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none group-hover:pointer-events-auto">
              <button
                className="bg-white shadow rounded-lg p-1.5 hover:bg-primary hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit(bed); }}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              {bed.status === "occupied" && (
                <button
                  className="bg-white shadow rounded-lg p-1.5 hover:bg-amber-500 hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDischarge(bed); }}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                className="bg-white shadow rounded-lg p-1.5 hover:bg-destructive hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(bed); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{bed.bed_number} — {cfg.label}</p>
          {bed.patient && <p className="text-xs">{bed.patient.name} · {bed.patient.phone}</p>}
          {bed.floor && <p className="text-xs">Floor {bed.floor}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── bed form dialog ──────────────────────────────────────────────────────────

function BedFormDialog({
  open,
  onClose,
  bed,
  patients,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  bed: BedWithPatient | null;
  patients: Patient[];
  onSave: (data: BedFormData, id?: string) => void;
}) {
  const [form, setForm] = useState<BedFormData>(
    bed
      ? {
        ward: bed.ward,
        floor: bed.floor,
        bed_number: String(bed.bed_number),
        status: bed.status as BedStatus,
        patient_id: bed.patient_id,
      }
      : DEFAULT_FORM
  );

  // sync when bed changes
  useState(() => {
    if (bed) {
      setForm({
        ward: bed.ward,
        floor: bed.floor,
        bed_number: String(bed.bed_number),
        status: bed.status as BedStatus,
        patient_id: bed.patient_id,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  });

  const set = (k: keyof BedFormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEditing = !!bed;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bed" : "Add New Bed"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update bed details, status, or assigned patient."
              : "Create a new bed entry for ward management."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bed Number *</Label>
              <Input
                placeholder="e.g. A-101"
                value={form.bed_number}
                onChange={(e) => set("bed_number", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input
                type="number"
                placeholder="e.g. 1"
                value={form.floor ?? ""}
                onChange={(e) =>
                  set("floor", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ward *</Label>
            <Select value={form.ward} onValueChange={(v) => set("ward", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ward" />
              </SelectTrigger>
              <SelectContent>
                {WARD_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select
              value={form.status}
              onValueChange={(v) => {
                set("status", v);
                if (v !== "occupied") set("patient_id", null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="capitalize">{s}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.status === "occupied" && (
            <div className="space-y-1.5">
              <Label>Assigned Patient</Label>
              <Select
                value={form.patient_id ?? "none"}
                onValueChange={(v) => set("patient_id", v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No patient —</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.patient_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form, bed?.id)}
            disabled={!form.ward || !form.bed_number}
          >
            {isEditing ? "Save Changes" : "Add Bed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function BedsPage() {
  const { toast } = useToast();
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

  // ── queries ──
  const { data: beds = [], isLoading } = useQuery<BedWithPatient[]>({
    queryKey: ["beds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("*, patient:patients(id, name, patient_code, phone, blood_group, gender)")
        .order("ward")
        .order("bed_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, patient_code, phone, blood_group, gender")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── mutations ──
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
      toast({ title: id ? "Bed updated" : "Bed added", description: "Changes saved successfully." });
      setFormOpen(false);
      setEditingBed(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      toast({ title: "Bed removed", description: "Bed deleted successfully." });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("beds")
        .update({ status: "available", patient_id: null } as Partial<Bed>)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["beds"] });
      toast({ title: "Patient discharged", description: "Bed is now available." });
      setDischargeTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── derived ──
  const filtered = useMemo(() => {
    return beds.filter((b) => {
      const matchSearch =
        !search ||
        String(b.bed_number).toLowerCase().includes(search.toLowerCase()) ||
        b.ward.toLowerCase().includes(search.toLowerCase()) ||
        b.patient?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      const matchWard = filterWard === "all" || b.ward === filterWard;
      return matchSearch && matchStatus && matchWard;
    });
  }, [beds, search, filterStatus, filterWard]);

  const wards = useMemo(() => Array.from(new Set(filtered.map((b) => b.ward))).sort(), [filtered]);
  const allWards = useMemo(() => Array.from(new Set(beds.map((b) => b.ward))).sort(), [beds]);

  const stats = useMemo(() => ({
    total: beds.length,
    available: beds.filter((b) => b.status === "available").length,
    occupied: beds.filter((b) => b.status === "occupied").length,
    maintenance: beds.filter((b) => b.status === "maintenance").length,
    reserved: beds.filter((b) => b.status === "reserved").length,
    occupancyPct: beds.length ? Math.round((beds.filter((b) => b.status === "occupied").length / beds.length) * 100) : 0,
  }), [beds]);

  const toggleWard = (w: string) =>
    setCollapsedWards((prev) => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });

  const handleSave = (data: BedFormData, id?: string) => {
    saveMutation.mutate({ data, id });
  };

  const handleEdit = (bed: BedWithPatient) => {
    setEditingBed(bed);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingBed(null);
    setFormOpen(true);
  };

  // ── export ──
  const handleExport = () => {
    const rows = [
      ["Bed Number", "Ward", "Floor", "Status", "Patient Name", "Patient Code", "Patient Phone"],
      ...beds.map((b) => [
        b.bed_number,
        b.ward,
        b.floor ?? "",
        b.status,
        b.patient?.name ?? "",
        b.patient?.patient_code ?? "",
        b.patient?.phone ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beds-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: "Beds data downloaded as CSV." });
  };

  // ── list row ──
  const ListRow = ({ bed }: { bed: BedWithPatient }) => {
    const cfg = STATUS_CONFIG[bed.status] ?? STATUS_CONFIG.available;
    return (
      <tr className="border-b hover:bg-muted/40 transition-colors">
        <td className="px-4 py-3 font-medium">{bed.bed_number}</td>
        <td className="px-4 py-3 text-muted-foreground">{bed.ward}</td>
        <td className="px-4 py-3 text-muted-foreground">{bed.floor ?? "—"}</td>
        <td className="px-4 py-3">
          <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border} font-medium`} variant="outline">
            {cfg.label}
          </Badge>
        </td>
        <td className="px-4 py-3">
          {bed.patient ? (
            <div>
              <p className="font-medium text-sm">{bed.patient.name}</p>
              <p className="text-xs text-muted-foreground">{bed.patient.patient_code} · {bed.patient.phone}</p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
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
    <div className="space-y-6">
      {/* header */}
      <PageHeader
        title="Bed Management"
        description="Real-time ward & bed allocation with patient tracking"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["beds"] })} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={handleAdd} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Bed
            </Button>
          </div>
        }
      />

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total Beds"
          value={stats.total}
          color="bg-slate-50 border-slate-200 text-slate-800"
          icon={<BedDouble className="h-5 w-5 text-slate-500" />}
        />
        <StatCard
          label="Available"
          value={stats.available}
          sub={`${stats.total ? Math.round((stats.available / stats.total) * 100) : 0}% free`}
          color="bg-emerald-50 border-emerald-200 text-emerald-800"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          label="Occupied"
          value={stats.occupied}
          sub={`${stats.occupancyPct}% occupancy`}
          color="bg-rose-50 border-rose-200 text-rose-800"
          icon={<User className="h-5 w-5 text-rose-500" />}
        />
        <StatCard
          label="Maintenance"
          value={stats.maintenance}
          color="bg-amber-50 border-amber-200 text-amber-800"
          icon={<Wrench className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          label="Reserved"
          value={stats.reserved}
          color="bg-blue-50 border-blue-200 text-blue-800"
          icon={<AlertCircle className="h-5 w-5 text-blue-500" />}
        />
      </div>

      {/* filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bed, ward, patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterWard} onValueChange={setFilterWard}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {allWards.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="ml-auto">
              <TabsList>
                <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${v.bg} ${v.border} ${v.color}`}>
            {v.icon}
            <span className="font-medium">{v.label}</span>
          </div>
        ))}
      </div>

      {/* content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" /> Loading beds…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
          <BedDouble className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No beds match your filters.</p>
          <Button variant="outline" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterWard("all"); }}>
            Clear filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-4">
          {wards.map((ward) => {
            const wardBeds = filtered.filter((b) => b.ward === ward);
            const collapsed = collapsedWards.has(ward);
            const wardStats = {
              total: wardBeds.length,
              occupied: wardBeds.filter((b) => b.status === "occupied").length,
              available: wardBeds.filter((b) => b.status === "available").length,
            };
            return (
              <Card key={ward} className="overflow-hidden">
                <CardHeader
                  className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleWard(ward)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{ward} Ward</CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">{wardStats.total} beds</Badge>
                        <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200" variant="outline">
                          {wardStats.occupied} occupied
                        </Badge>
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
                          {wardStats.available} free
                        </Badge>
                      </div>
                    </div>
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {!collapsed && (
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                      {wardBeds.map((bed) => (
                        <BedCard
                          key={bed.id}
                          bed={bed}
                          onEdit={handleEdit}
                          onDelete={setDeleteTarget}
                          onDischarge={setDischargeTarget}
                        />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium">Bed #</th>
                  <th className="px-4 py-3 text-left font-medium">Ward</th>
                  <th className="px-4 py-3 text-left font-medium">Floor</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Patient</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bed) => <ListRow key={bed.id} bed={bed} />)}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* form dialog */}
      {formOpen && (
        <BedFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingBed(null); }}
          bed={editingBed}
          patients={patients}
          onSave={handleSave}
        />
      )}

      {/* delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bed {deleteTarget?.bed_number}?</AlertDialogTitle>
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
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* discharge confirm */}
      <AlertDialog open={!!dischargeTarget} onOpenChange={(o) => !o && setDischargeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discharge Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{dischargeTarget?.patient?.name}</strong> from bed{" "}
              <strong>{dischargeTarget?.bed_number}</strong> and mark it as available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dischargeTarget && dischargeMutation.mutate(dischargeTarget.id)}>
              Discharge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function useToast() {
  return {
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      console.log("Toast:", props);
      // In a real app, this would trigger a toast notification using a library like sonner
      // For now, this is a simple implementation that logs to console
    },
  };
}

