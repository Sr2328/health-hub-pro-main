import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FileDown,
  Upload,
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ScanLine,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Hash,
  PlayCircle,
  ClipboardList,
  ExternalLink,
  BarChart3,
  Activity,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { generateRadiologyReport } from "@/lib/pdf";

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICES = [
  { name: "X-Ray Chest", category: "X-Ray" },
  { name: "X-Ray Limb", category: "X-Ray" },
  { name: "X-Ray Abdomen", category: "X-Ray" },
  { name: "X-Ray Spine", category: "X-Ray" },
  { name: "USG Abdomen", category: "Ultrasound" },
  { name: "USG Pelvis", category: "Ultrasound" },
  { name: "USG Thyroid", category: "Ultrasound" },
  { name: "CT Brain", category: "CT Scan" },
  { name: "CT Chest", category: "CT Scan" },
  { name: "CT Abdomen", category: "CT Scan" },
  { name: "CT Spine", category: "CT Scan" },
  { name: "MRI Brain", category: "MRI" },
  { name: "MRI Spine", category: "MRI" },
  { name: "MRI Knee", category: "MRI" },
  { name: "MRI Shoulder", category: "MRI" },
  { name: "Mammography", category: "Mammography" },
  { name: "DEXA Scan", category: "Special" },
  { name: "PET Scan", category: "Special" },
  { name: "ECG", category: "Cardiac" },
  { name: "2D Echo", category: "Cardiac" },
  { name: "TMT", category: "Cardiac" },
  { name: "Holter Monitor", category: "Cardiac" },
];

const SERVICE_CATEGORIES = [...new Set(SERVICES.map((s) => s.category))];
const SERVICE_NAMES = SERVICES.map((s) => s.name);

const PAGE_SIZE = 15;

// ─── Status meta ──────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: <Clock className="h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const getStatus = (key: string) =>
  STATUS_META[key] ?? {
    label: key,
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
    icon: null,
  };

const getCategoryIcon = (serviceName: string) => {
  const s = SERVICES.find((s) => s.name === serviceName);
  if (!s) return <ScanLine className="h-4 w-4" />;
  switch (s.category) {
    case "Cardiac": return <Activity className="h-4 w-4" />;
    case "MRI":
    case "CT Scan": return <Layers className="h-4 w-4" />;
    default: return <ScanLine className="h-4 w-4" />;
  }
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = getStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.color} ${s.bg}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Card
      className={`overflow-hidden transition-all ${onClick ? "cursor-pointer hover:shadow-md" : ""
        } ${active ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function RadiologyDetailDialog({
  order,
  open,
  onClose,
  onStart,
  onOpenReport,
  onUpload,
  isUpdating,
}: {
  order: any | null;
  open: boolean;
  onClose: () => void;
  onStart: (id: string) => void;
  onOpenReport: (order: any) => void;
  onUpload: (id: string, file: File) => void;
  isUpdating: boolean;
}) {
  if (!order) return null;
  const s = getStatus(order.status);
  const patient = order.visits?.patients;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Radiology Order Details
          </DialogTitle>
          <DialogDescription>
            Created{" "}
            {order.created_at
              ? format(parseISO(order.created_at), "MMM d, yyyy · h:mm a")
              : "—"}
          </DialogDescription>
        </DialogHeader>

        {/* Status Banner */}
        <div className={`rounded-lg p-3 border flex items-center gap-2 ${s.bg}`}>
          <span className={s.color}>{s.icon}</span>
          <span className={`font-semibold text-sm ${s.color}`}>{s.label}</span>
        </div>

        {/* Service & Patient */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <ScanLine className="h-3 w-3" /> Service
            </p>
            <p className="font-semibold">{order.service_name}</p>
            {(() => {
              const svc = SERVICES.find((s) => s.name === order.service_name);
              return svc ? (
                <p className="text-xs text-muted-foreground">{svc.category}</p>
              ) : null;
            })()}
            {order.visits?.token_number && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Token #{order.visits.token_number}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <User className="h-3 w-3" /> Patient
            </p>
            <p className="font-semibold">{patient?.name ?? "—"}</p>
            {patient?.patient_code && (
              <p className="text-sm text-muted-foreground">{patient.patient_code}</p>
            )}
          </div>
        </div>

        {/* Radiologist Notes */}
        {order.radiologist_notes && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <ClipboardList className="h-3 w-3" /> Radiologist Notes
            </p>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {order.radiologist_notes}
            </pre>
          </div>
        )}

        {/* Report */}
        {order.report_url && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" /> Report
            </p>
            <a
              href={order.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View / Download Report
            </a>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {order.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
              disabled={isUpdating}
              onClick={() => onStart(order.id)}
            >
              <PlayCircle className="h-3.5 w-3.5" /> Start Scan
            </Button>
          )}
          {order.status !== "completed" && order.status !== "cancelled" && (
            <Button
              size="sm"
              className="gap-1"
              disabled={isUpdating}
              onClick={() => {
                onClose();
                onOpenReport(order);
              }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {order.radiologist_notes ? "Update Report" : "Enter Report"}
            </Button>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) onUpload(order.id, e.target.files[0]);
              }}
            />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-muted cursor-pointer font-medium">
              <Upload className="h-3 w-3" /> Upload Report
            </span>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report Dialog ────────────────────────────────────────────────────────────

function ReportDialog({
  order,
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  order: any | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  isPending: boolean;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (order) setText(order.radiologist_notes ?? "");
  }, [order]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Radiologist Report
          </DialogTitle>
          <DialogDescription>
            {order.service_name} ·{" "}
            {order.visits?.patients?.name ?? "Unknown patient"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex gap-2">
            {["Normal study.", "No significant abnormality detected.", "Findings noted — see below."].map((t) => (
              <button
                key={t}
                onClick={() => setText((prev) => prev ? prev + "\n" + t : t)}
                className="text-xs px-2 py-1 rounded border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.length > 20 ? t.slice(0, 20) + "…" : t}
              </button>
            ))}
          </div>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Findings, impression, recommendations…"
            className="resize-none font-mono text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(text)}
            disabled={isPending || !text.trim()}
          >
            {isPending ? "Saving…" : "Save & Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Order Dialog ─────────────────────────────────────────────────────────

function NewOrderDialog({
  visits,
  onSubmit,
  isPending,
}: {
  visits: any[];
  onSubmit: (data: { visit_id: string; service_name: string }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visit_id: "", service_name: "" });
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredServices =
    categoryFilter === "all"
      ? SERVICES
      : SERVICES.filter((s) => s.category === categoryFilter);

  const handleSubmit = () => {
    onSubmit(form);
    if (!isPending) {
      setOpen(false);
      setForm({ visit_id: "", service_name: "" });
      setCategoryFilter("all");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Order Imaging</DialogTitle>
          <DialogDescription>
            Assign a radiology service to a patient visit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Visit</Label>
            <Select
              value={form.visit_id}
              onValueChange={(v) => setForm({ ...form, visit_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visit…" />
              </SelectTrigger>
              <SelectContent>
                {visits.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    #{v.token_number ?? "—"} — {v.patients?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...SERVICE_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setForm((f) => ({ ...f, service_name: "" }));
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${categoryFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border text-muted-foreground"
                    }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select
              value={form.service_name}
              onValueChange={(v) => setForm({ ...form, service_name: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service…" />
              </SelectTrigger>
              <SelectContent>
                {filteredServices.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.visit_id || !form.service_name}
          >
            {isPending ? "Creating…" : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RadiologyPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reportOrder, setReportOrder] = useState<any | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rad-orders"],
    queryFn: async () =>
      (
        await supabase
          .from("radiology_orders")
          .select(
            "*, visits(token_number, patient_id, patients(name, patient_code))"
          )
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["visits-mini"],
    queryFn: async () =>
      (
        await supabase
          .from("visits")
          .select("id, token_number, patients(name, patient_code)")
          .order("created_at", { ascending: false })
          .limit(150)
      ).data ?? [],
  });

  // ── Realtime ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel("rad-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "radiology_orders" },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["rad-orders"] });
          if (
            payload.eventType === "UPDATE" &&
            payload.new?.status === "completed"
          ) {
            toast.success(`Radiology report ready: ${payload.new.service_name}`);
          } else if (payload.eventType === "INSERT") {
            toast.info(`New radiology order: ${payload.new.service_name}`);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: async (data: { visit_id: string; service_name: string }) => {
      if (!data.visit_id || !data.service_name)
        throw new Error("Visit and service are required");
      const { error } = await supabase
        .from("radiology_orders")
        .insert({ visit_id: data.visit_id, service_name: data.service_name, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Radiology order created");
      qc.invalidateQueries({ queryKey: ["rad-orders"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("radiology_orders")
        .update({ status: "in_progress" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order marked as in progress");
      qc.invalidateQueries({ queryKey: ["rad-orders"] });
      setSelected((prev: any) =>
        prev ? { ...prev, status: "in_progress" } : prev
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitReport = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("radiology_orders")
        .update({ radiologist_notes: notes, status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report saved and marked complete");
      qc.invalidateQueries({ queryKey: ["rad-orders"] });
      setReportOpen(false);
      setReportOrder(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const upload = async (id: string, file: File) => {
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("radiology-reports")
      .upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage
      .from("radiology-reports")
      .getPublicUrl(path);
    const { error: e2 } = await supabase
      .from("radiology_orders")
      .update({ report_url: data.publicUrl })
      .eq("id", id);
    if (e2) return toast.error(e2.message);
    toast.success("Report uploaded");
    qc.invalidateQueries({ queryKey: ["rad-orders"] });
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    inProgress: orders.filter((o: any) =>
      ["in_progress", "in-progress"].includes(o.status)
    ).length,
    completed: orders.filter((o: any) => o.status === "completed").length,
  }), [orders]);

  const filtered = useMemo(() => {
    let list = orders as any[];
    if (statusFilter !== "all") {
      list = list.filter((o) =>
        statusFilter === "in_progress"
          ? ["in_progress", "in-progress"].includes(o.status)
          : o.status === statusFilter
      );
    }
    if (serviceFilter !== "all") {
      list = list.filter((o) => o.service_name === serviceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.service_name?.toLowerCase().includes(q) ||
          o.visits?.patients?.name?.toLowerCase().includes(q) ||
          o.visits?.patients?.patient_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, serviceFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openDetail = (o: any) => { setSelected(o); setDetailOpen(true); };
  const openReport = (o: any) => { setReportOrder(o); setReportOpen(true); };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <PageHeader
        title="Radiology"
        description="Imaging orders, reports, and advanced filters — realtime"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => generateRadiologyReport(filtered)}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <NewOrderDialog
              visits={visits}
              onSubmit={(data) => create.mutate(data)}
              isPending={create.isPending}
            />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Orders"
          value={stats.total}
          icon={<ScanLine className="h-4 w-4 text-violet-600" />}
          accent="bg-violet-100 dark:bg-violet-950/40"
          onClick={() => { setStatusFilter("all"); setPage(0); }}
          active={statusFilter === "all"}
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          accent="bg-amber-100 dark:bg-amber-950/40"
          onClick={() => { setStatusFilter("pending"); setPage(0); }}
          active={statusFilter === "pending"}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
          accent="bg-blue-100 dark:bg-blue-950/40"
          onClick={() => { setStatusFilter("in_progress"); setPage(0); }}
          active={statusFilter === "in_progress"}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          accent="bg-emerald-100 dark:bg-emerald-950/40"
          onClick={() => { setStatusFilter("completed"); setPage(0); }}
          active={statusFilter === "completed"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-9"
                placeholder="Search by service name or patient…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40 gap-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={serviceFilter}
              onValueChange={(v) => { setServiceFilter(v); setPage(0); }}
            >
              <SelectTrigger className="h-9 w-full sm:w-44 gap-1">
                <ScanLine className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {SERVICE_NAMES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "all" || serviceFilter !== "all" || search
              ? " matching filters"
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Service</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Token</TableHead>
                <TableHead className="hidden lg:table-cell">Ordered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Report</TableHead>
                <TableHead className="w-28 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading orders…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ScanLine className="h-8 w-8 opacity-30" />
                      <p className="font-medium">No radiology orders found</p>
                      <p className="text-sm">
                        {search || statusFilter !== "all" || serviceFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create a new order to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((o: any) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => openDetail(o)}
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {getCategoryIcon(o.service_name)}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{o.service_name}</p>
                          {(() => {
                            const svc = SERVICES.find((s) => s.name === o.service_name);
                            return svc ? (
                              <p className="text-xs text-muted-foreground">{svc.category}</p>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{o.visits?.patients?.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {o.visits?.patients?.patient_code}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {o.visits?.token_number ? `#${o.visits.token_number}` : "—"}
                      </span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {o.created_at
                          ? format(parseISO(o.created_at), "MMM d, h:mm a")
                          : "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      {o.report_url ? (
                        <a
                          href={o.report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-xs flex items-center gap-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-3 w-3" /> View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    <TableCell
                      className="text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="View details"
                          onClick={(e) => { e.stopPropagation(); openDetail(o); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {o.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            title="Start scan"
                            disabled={startOrder.isPending}
                            onClick={(e) => { e.stopPropagation(); startOrder.mutate(o.id); }}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {o.status !== "completed" && o.status !== "cancelled" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                            title="Enter report"
                            onClick={(e) => { e.stopPropagation(); openReport(o); }}
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <label
                          className="cursor-pointer"
                          title="Upload PDF"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            hidden
                            onChange={(e) =>
                              e.target.files?.[0] && upload(o.id, e.target.files[0])
                            }
                          />
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Upload className="h-3.5 w-3.5" />
                          </span>
                        </label>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2">{page + 1} / {totalPages}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <RadiologyDetailDialog
        order={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStart={(id) => startOrder.mutate(id)}
        onOpenReport={openReport}
        onUpload={upload}
        isUpdating={startOrder.isPending}
      />

      {/* Report Dialog */}
      <ReportDialog
        order={reportOrder}
        open={reportOpen}
        onClose={() => { setReportOpen(false); setReportOrder(null); }}
        onSubmit={(notes) => submitReport.mutate({ id: reportOrder.id, notes })}
        isPending={submitReport.isPending}
      />
    </div>
  );
}