import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileDown,
  X,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Stethoscope,
  Phone,
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Ban,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import type { Appointment, AppointmentStatus, Patient, Doctor } from "@/integrations/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentWithRelations extends Appointment {
  patients: Pick<Patient, "id" | "name" | "patient_code" | "phone" | "blood_group" | "gender"> | null;
  doctors: Pick<Doctor, "id" | "name" | "qualification" | "consultation_fee"> | null;
}

type StatusFilter = "all" | AppointmentStatus;
type DateFilter = "all" | "today" | "tomorrow" | "upcoming" | "past";

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700",
    icon: <CalendarCheck className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: <Ban className="h-3 w-3" />,
  },
  no_show: {
    label: "No Show",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const getStatus = (key: string) =>
  STATUS_META[key] ?? {
    label: key,
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: null,
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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
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

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function AppointmentDetailDialog({
  appointment,
  open,
  onClose,
  onStatusChange,
  isUpdating,
}: {
  appointment: AppointmentWithRelations | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  isUpdating: boolean;
}) {
  if (!appointment) return null;
  const s = getStatus(appointment.status);
  const dt = parseISO(appointment.scheduled_at);

  const canConfirm = appointment.status === "scheduled";
  const canComplete = appointment.status === "confirmed" || appointment.status === "scheduled";
  const canCancel = !["cancelled", "completed"].includes(appointment.status);
  const canNoShow = appointment.status !== "cancelled" && appointment.status !== "completed";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Appointment Details
          </DialogTitle>
          <DialogDescription>
            Booked on{" "}
            {appointment.created_at
              ? format(parseISO(appointment.created_at), "MMM d, yyyy")
              : "—"}
          </DialogDescription>
        </DialogHeader>

        {/* Status */}
        <div className={`rounded-lg p-3 border flex items-center gap-2 ${s.bg}`}>
          <span className={s.color}>{s.icon}</span>
          <span className={`font-semibold text-sm ${s.color}`}>{s.label}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {isToday(dt)
              ? "Today"
              : isTomorrow(dt)
                ? "Tomorrow"
                : format(dt, "EEEE, d MMM")}
            {" · "}
            {format(dt, "h:mm a")}
          </span>
        </div>

        {/* Patient & Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <User className="h-3 w-3" /> Patient
            </p>
            <p className="font-semibold">{appointment.patients?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {appointment.patients?.patient_code}
            </p>
            {appointment.patients?.phone && (
              <p className="text-sm flex items-center gap-1 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {appointment.patients.phone}
              </p>
            )}
            {appointment.patients?.gender && (
              <p className="text-xs text-muted-foreground capitalize">
                {appointment.patients.gender}
                {appointment.patients.blood_group &&
                  ` · ${appointment.patients.blood_group}`}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <Stethoscope className="h-3 w-3" /> Doctor
            </p>
            <p className="font-semibold">{appointment.doctors?.name ?? "—"}</p>
            {appointment.doctors?.qualification && (
              <p className="text-sm text-muted-foreground">
                {appointment.doctors.qualification}
              </p>
            )}
            {appointment.doctors?.consultation_fee != null && (
              <p className="text-sm text-muted-foreground">
                Fee: ₹{appointment.doctors.consultation_fee}
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" /> Notes
            </p>
            <p className="text-sm">{appointment.notes}</p>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              disabled={isUpdating}
              onClick={() => onStatusChange(appointment.id, "confirmed")}
            >
              <CheckCircle className="h-3.5 w-3.5" /> Confirm
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={isUpdating}
              onClick={() => onStatusChange(appointment.id, "completed")}
            >
              <UserCheck className="h-3.5 w-3.5" /> Mark Completed
            </Button>
          )}
          {canNoShow && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
              disabled={isUpdating}
              onClick={() => onStatusChange(appointment.id, "no_show")}
            >
              <AlertCircle className="h-3.5 w-3.5" /> No Show
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-red-700 border-red-300 hover:bg-red-50 ml-auto"
              disabled={isUpdating}
              onClick={() => onStatusChange(appointment.id, "cancelled")}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Book Dialog ──────────────────────────────────────────────────────────────

function BookAppointmentDialog({
  patients,
  doctors,
  onBook,
  isPending,
}: {
  patients: any[];
  doctors: any[];
  onBook: (data: {
    patient_id: string;
    doctor_id: string;
    scheduled_at: string;
    notes: string;
  }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    scheduled_at: "",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleBook = () => {
    onBook(form);
    if (!isPending) {
      setOpen(false);
      setForm({ patient_id: "", doctor_id: "", scheduled_at: "", notes: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a consultation between a patient and doctor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select value={form.patient_id} onValueChange={(v) => set("patient_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient…" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.patient_code} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            <Select value={form.doctor_id} onValueChange={(v) => set("doctor_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor…" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    {d.qualification ? ` (${d.qualification})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set("scheduled_at", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Reason for visit, special instructions…"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBook} disabled={isPending}>
            {isPending ? "Booking…" : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

export function AppointmentsPage() {
  const qc = useQueryClient();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery<AppointmentWithRelations[]>({
    queryKey: ["appointments"],
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select(
            "*, patients(id,name,patient_code,phone,blood_group,gender), doctors(id,name,qualification,consultation_fee)"
          )
          .order("scheduled_at", { ascending: true })
          .limit(500)
      ).data ?? [],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-mini"],
    queryFn: async () =>
      (
        await supabase
          .from("patients")
          .select("id,name,patient_code")
          .limit(300)
      ).data ?? [],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors-mini-all"],
    queryFn: async () =>
      (
        await supabase
          .from("doctors")
          .select("id,name,qualification,consultation_fee")
      ).data ?? [],
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: async (data: {
      patient_id: string;
      doctor_id: string;
      scheduled_at: string;
      notes: string;
    }) => {
      if (!data.patient_id || !data.doctor_id || !data.scheduled_at)
        throw new Error("Patient, doctor and date/time are required");
      const { error } = await supabase.from("appointments").insert({
        patient_id: data.patient_id,
        doctor_id: data.doctor_id,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        notes: data.notes || null,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment booked successfully");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AppointmentStatus;
    }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Appointment marked as ${getStatus(vars.status).label}`);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      // Update selected appointment in-place
      if (selected?.id === vars.id) {
        setSelected((prev) =>
          prev ? { ...prev, status: vars.status } : prev
        );
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Derived / filtered data ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = items;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.patients?.name?.toLowerCase().includes(q) ||
          a.patients?.patient_code?.toLowerCase().includes(q) ||
          a.doctors?.name?.toLowerCase().includes(q)
      );
    }

    // Status
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Date
    const today = new Date();
    if (dateFilter === "today") {
      list = list.filter((a) => isToday(parseISO(a.scheduled_at)));
    } else if (dateFilter === "tomorrow") {
      list = list.filter((a) => isTomorrow(parseISO(a.scheduled_at)));
    } else if (dateFilter === "upcoming") {
      const tomorrow = startOfDay(addDays(today, 2));
      list = list.filter((a) => parseISO(a.scheduled_at) >= tomorrow);
    } else if (dateFilter === "past") {
      list = list.filter(
        (a) => isPast(parseISO(a.scheduled_at)) && !isToday(parseISO(a.scheduled_at))
      );
    }

    return list;
  }, [items, search, statusFilter, dateFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = items.filter((a) => isToday(parseISO(a.scheduled_at)));
    return {
      total: items.length,
      todayCount: today.length,
      scheduled: items.filter((a) => a.status === "scheduled").length,
      confirmed: items.filter((a) => a.status === "confirmed").length,
      completed: items.filter((a) => a.status === "completed").length,
      cancelled: items.filter((a) => a.status === "cancelled").length,
    };
  }, [items]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateStatus.mutate({ id, status });
  };

  const openDetail = (a: AppointmentWithRelations) => {
    setSelected(a);
    setDetailOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <PageHeader
        title="Appointments"
        description="Book, manage, and track patient appointments"
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
            <BookAppointmentDialog
              patients={patients}
              doctors={doctors}
              onBook={(data) => create.mutate(data)}
              isPending={create.isPending}
            />
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Calendar className="h-4 w-4 text-violet-600" />}
          accent="bg-violet-100 dark:bg-violet-950/40"
        />
        <StatCard
          label="Today"
          value={stats.todayCount}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          accent="bg-blue-100 dark:bg-blue-950/40"
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          icon={<CalendarCheck className="h-4 w-4 text-sky-600" />}
          accent="bg-sky-100 dark:bg-sky-950/40"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
          accent="bg-emerald-100 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<UserCheck className="h-4 w-4 text-slate-600" />}
          accent="bg-slate-100 dark:bg-slate-900"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          icon={<Ban className="h-4 w-4 text-red-600" />}
          accent="bg-red-100 dark:bg-red-950/40"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-9"
                placeholder="Search by patient name, code, or doctor…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40 gap-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            {/* Date filter */}
            <Select
              value={dateFilter}
              onValueChange={(v) => {
                setDateFilter(v as DateFilter);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40 gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "all" || dateFilter !== "all" || search
              ? " matching filters"
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Doctor</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading appointments…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Calendar className="h-8 w-8 opacity-30" />
                      <p className="font-medium">No appointments found</p>
                      <p className="text-sm">
                        {search || statusFilter !== "all" || dateFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Book an appointment to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((a) => {
                  const dt = parseISO(a.scheduled_at);
                  const isOld =
                    isPast(dt) && !["completed", "cancelled"].includes(a.status);
                  return (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => openDetail(a)}
                    >
                      <TableCell className="pl-4">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${isToday(dt) ? "text-blue-600 dark:text-blue-400" : ""
                              }`}
                          >
                            {isToday(dt)
                              ? "Today"
                              : isTomorrow(dt)
                                ? "Tomorrow"
                                : format(dt, "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(dt, "h:mm a")}
                          </span>
                          {isOld && (
                            <span className="text-xs text-amber-600 font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {a.patients?.name ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {a.patients?.patient_code}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm">{a.doctors?.name ?? "—"}</span>
                          {a.doctors?.qualification && (
                            <span className="text-xs text-muted-foreground">
                              {a.doctors.qualification}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell max-w-[180px]">
                        {a.notes ? (
                          <span className="text-sm text-muted-foreground truncate block">
                            {a.notes}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={a.status} />
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(a);
                            }}
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!["cancelled", "completed"].includes(a.status) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus.mutate({ id: a.id, status: "cancelled" });
                              }}
                              title="Cancel appointment"
                              disabled={updateStatus.isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
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
              <span className="text-xs px-2">
                {page + 1} / {totalPages}
              </span>
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
      <AppointmentDetailDialog
        appointment={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStatusChange={handleStatusChange}
        isUpdating={updateStatus.isPending}
      />
    </div>
  );
}