import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogDescription,
  DialogTrigger,
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
  Trash2,
  IndianRupee,
  Receipt,
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Hash,
  CheckCircle2,
  Clock,
  CircleDashed,
  Ban,
  TrendingUp,
  Wallet,
  CreditCard,
  BarChart3,
  Banknote,
  Smartphone,
  Building2,
  AlertCircle,
  FileText,
  CalendarDays,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { generateInvoicePdf } from "@/lib/pdf";

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  description: string;
  category: string;
  quantity: number;
  rate: number;
};

type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";

// ─── Status meta ──────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  unpaid: {
    label: "Unpaid",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: <Clock className="h-3 w-3" />,
  },
  partial: {
    label: "Partial",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  paid: {
    label: "Paid",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: <Ban className="h-3 w-3" />,
  },
};

const getStatus = (key: string) =>
  STATUS_META[key] ?? {
    label: key,
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: null,
  };

const PAYMENT_METHOD_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-3.5 w-3.5" />,
  card: <CreditCard className="h-3.5 w-3.5" />,
  upi: <Smartphone className="h-3.5 w-3.5" />,
  insurance: <Building2 className="h-3.5 w-3.5" />,
  bank: <Building2 className="h-3.5 w-3.5" />,
};

const CATEGORY_OPTIONS = [
  { value: "consult", label: "Consultation" },
  { value: "lab", label: "Laboratory" },
  { value: "radiology", label: "Radiology" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "procedure", label: "Procedure" },
  { value: "room", label: "Room / Bed" },
  { value: "nursing", label: "Nursing" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 15;

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
  sub,
  icon,
  accent,
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden transition-all ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${active ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Invoice Detail Dialog ────────────────────────────────────────────────────

function InvoiceDetailDialog({
  invoice,
  open,
  onClose,
  onPay,
  onDownload,
  hospital,
}: {
  invoice: any | null;
  open: boolean;
  onClose: () => void;
  onPay: (inv: any) => void;
  onDownload: (inv: any) => void;
  hospital: any;
}) {
  const { data: lineItems = [] } = useQuery({
    queryKey: ["invoice-items", invoice?.id],
    queryFn: async () =>
      (
        await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", invoice!.id)
      ).data ?? [],
    enabled: !!invoice?.id && open,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["invoice-payments", invoice?.id],
    queryFn: async () =>
      (
        await supabase
          .from("payments")
          .select("*")
          .eq("invoice_id", invoice!.id)
          .order("paid_at", { ascending: false })
      ).data ?? [],
    enabled: !!invoice?.id && open,
  });

  if (!invoice) return null;

  const s = getStatus(invoice.status);
  const outstanding = (invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0);
  const patient = invoice.visits?.patients;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Created{" "}
            {invoice.created_at
              ? format(parseISO(invoice.created_at), "MMM d, yyyy · h:mm a")
              : "—"}
          </DialogDescription>
        </DialogHeader>

        {/* Status */}
        <div className={`rounded-lg p-3 border flex items-center gap-2 ${s.bg}`}>
          <span className={s.color}>{s.icon}</span>
          <span className={`font-semibold text-sm ${s.color}`}>{s.label}</span>
          <span className="ml-auto text-sm font-bold">
            ₹{invoice.paid_amount ?? 0}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              of ₹{invoice.total_amount ?? 0}
            </span>
          </span>
        </div>

        {/* Patient */}
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
            <User className="h-3 w-3" /> Patient
          </p>
          <p className="font-semibold">{patient?.name ?? "—"}</p>
          {patient?.patient_code && (
            <p className="text-sm text-muted-foreground">{patient.patient_code}</p>
          )}
          {invoice.visits?.token_number && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Token #{invoice.visits.token_number}
            </p>
          )}
        </div>

        {/* Line items */}
        <div className="rounded-lg border overflow-hidden">
          <div className="px-3 py-2 bg-muted/40 border-b">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" /> Charges
            </p>
          </div>
          {lineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No line items</p>
          ) : (
            <div className="divide-y">
              {lineItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.category} · qty {item.quantity} × ₹{item.rate}
                    </p>
                  </div>
                  <p className="font-semibold">₹{item.amount}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                <p className="text-sm font-bold">Total</p>
                <p className="text-base font-bold">₹{invoice.total_amount ?? 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <div className="px-3 py-2 bg-muted/40 border-b">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Payment History
              </p>
            </div>
            <div className="divide-y">
              {payments.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {PAYMENT_METHOD_ICONS[p.method] ?? <CreditCard className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <p className="capitalize font-medium">{p.method}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.paid_at ? format(parseISO(p.paid_at), "MMM d, h:mm a") : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    +₹{p.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outstanding */}
        {outstanding > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 flex items-center justify-between">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Outstanding
            </p>
            <p className="font-bold text-amber-800 dark:text-amber-300">₹{outstanding}</p>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button
              className="gap-1.5 flex-1"
              onClick={() => { onClose(); onPay(invoice); }}
            >
              <IndianRupee className="h-3.5 w-3.5" /> Record Payment
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => onDownload(invoice)}
          >
            <FileDown className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment Dialog ───────────────────────────────────────────────────────────

function PaymentDialog({
  invoice,
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  invoice: any | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, method: string) => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("cash");

  useEffect(() => {
    if (invoice) {
      setAmount((invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0));
      setMethod("cash");
    }
  }, [invoice]);

  if (!invoice) return null;

  const outstanding = (invoice.total_amount ?? 0) - (invoice.paid_amount ?? 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            {invoice.visits?.patients?.name ?? "Patient"} ·{" "}
            #{invoice.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/40 p-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold">₹{invoice.total_amount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="font-bold text-emerald-600">₹{invoice.paid_amount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due</p>
            <p className="font-bold text-amber-600">₹{outstanding}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                type="number"
                className="pl-7"
                value={amount}
                max={outstanding}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              {[25, 50, 100].map((pct) => (
                <Button
                  key={pct}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 flex-1"
                  onClick={() => setAmount(Math.round((outstanding * pct) / 100))}
                >
                  {pct}%
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 flex-1 font-medium"
                onClick={() => setAmount(outstanding)}
              >
                Full
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "cash", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
                { value: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
                { value: "upi", label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
                { value: "insurance", label: "Insurance", icon: <Building2 className="h-4 w-4" /> },
                { value: "bank", label: "Bank", icon: <Building2 className="h-4 w-4" /> },
                { value: "other", label: "Other", icon: <Wallet className="h-4 w-4" /> },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${method === m.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                    }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(amount, method)}
            disabled={isPending || amount <= 0 || amount > outstanding}
          >
            {isPending ? "Processing…" : `Collect ₹${amount}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Invoice Dialog ────────────────────────────────────────────────────

function CreateInvoiceDialog({
  visits,
  onSubmit,
  isPending,
}: {
  visits: any[];
  onSubmit: (visitId: string, items: Item[], total: number) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [visitId, setVisitId] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "Consultation", category: "consult", quantity: 1, rate: 500 },
  ]);
  const [loading, setLoading] = useState(false);

  const loadFromVisit = async (vid: string) => {
    setVisitId(vid);
    setLoading(true);
    const visit = visits.find((v: any) => v.id === vid);
    const newItems: Item[] = [];
    if (visit?.doctors?.consultation_fee) {
      newItems.push({
        description: "Doctor Consultation",
        category: "consult",
        quantity: 1,
        rate: visit.doctors.consultation_fee,
      });
    }
    const [labs, rads, rxs] = await Promise.all([
      supabase.from("lab_orders").select("test_name").eq("visit_id", vid),
      supabase.from("radiology_orders").select("service_name").eq("visit_id", vid),
      supabase.from("prescriptions").select("medications").eq("visit_id", vid),
    ]);
    (labs.data ?? []).forEach((l: any) =>
      newItems.push({ description: `Lab: ${l.test_name}`, category: "lab", quantity: 1, rate: 300 })
    );
    (rads.data ?? []).forEach((r: any) =>
      newItems.push({ description: `Imaging: ${r.service_name}`, category: "radiology", quantity: 1, rate: 1200 })
    );
    (rxs.data ?? []).forEach((p: any) => {
      const meds = Array.isArray(p.medications) ? p.medications : [];
      meds.forEach((m: any) =>
        newItems.push({
          description: `Rx: ${m.name ?? "Medication"}`,
          category: "pharmacy",
          quantity: m.quantity ?? 1,
          rate: m.price ?? 50,
        })
      );
    });
    if (newItems.length === 0)
      newItems.push({ description: "Consultation", category: "consult", quantity: 1, rate: 500 });
    setItems(newItems);
    setLoading(false);
  };

  const updItem = (idx: number, k: keyof Item, v: any) =>
    setItems((it) => it.map((i, n) => (n === idx ? { ...i, [k]: v } : i)));

  const total = items.reduce((s, i) => s + i.quantity * i.rate, 0);

  const handleSubmit = () => {
    onSubmit(visitId, items, total);
    if (!isPending) {
      setOpen(false);
      setVisitId("");
      setItems([{ description: "Consultation", category: "consult", quantity: 1, rate: 500 }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Select a visit to auto-load charges, then adjust as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Visit selector */}
          <div className="space-y-1.5">
            <Label>Visit</Label>
            <Select value={visitId} onValueChange={loadFromVisit}>
              <SelectTrigger>
                <SelectValue placeholder="Select visit — charges auto-load" />
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

          {/* Line items */}
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading charges…</span>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Category</TableHead>
                    <TableHead className="w-16">Qty</TableHead>
                    <TableHead className="w-24">Rate (₹)</TableHead>
                    <TableHead className="w-24">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input
                          value={it.description}
                          onChange={(e) => updItem(idx, "description", e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={it.category}
                          onValueChange={(v) => updItem(idx, "category", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updItem(idx, "quantity", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={it.rate}
                          onChange={(e) => updItem(idx, "rate", Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        ₹{it.quantity * it.rate}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:bg-red-50"
                          onClick={() => setItems(items.filter((_, n) => n !== idx))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setItems([
                      ...items,
                      { description: "", category: "other", quantity: 1, rate: 0 },
                    ])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Grand Total</p>
                  <p className="text-xl font-bold">₹{total}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !visitId || items.length === 0}
          >
            {isPending ? "Creating…" : `Create Invoice · ₹${total}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BillingPage() {
  const qc = useQueryClient();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<any | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────

  const {
    data: invoices = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      (
        await supabase
          .from("invoices")
          .select("*, visits(token_number, patients(name, patient_code))")
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["visits-billing"],
    queryFn: async () =>
      (
        await supabase
          .from("visits")
          .select(
            "id, token_number, doctor_id, patients(name, patient_code), doctors(consultation_fee)"
          )
          .order("created_at", { ascending: false })
          .limit(100)
      ).data ?? [],
  });

  const { data: hospital } = useQuery({
    queryKey: ["hospital"],
    queryFn: async () =>
      (
        await supabase
          .from("hospitals")
          .select("*")
          .order("created_at")
          .limit(1)
          .maybeSingle()
      ).data,
  });

  // ── Realtime ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel("inv-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          qc.invalidateQueries({ queryKey: ["invoices"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const create = useMutation({
    mutationFn: async ({
      visitId,
      items,
      total,
    }: {
      visitId: string;
      items: Item[];
      total: number;
    }) => {
      if (!visitId) throw new Error("Select a visit");
      const { data: inv, error } = await supabase
        .from("invoices")
        .insert({ visit_id: visitId, total_amount: total, paid_amount: 0, status: "unpaid" })
        .select("*")
        .single();
      if (error) throw error;
      const rows = items.map((i) => ({
        invoice_id: inv.id,
        description: i.description,
        category: i.category,
        quantity: i.quantity,
        rate: i.rate,
        amount: i.quantity * i.rate,
      }));
      const { error: e2 } = await supabase.from("invoice_items").insert(rows);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Invoice created successfully");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const recordPayment = useMutation({
    mutationFn: async ({
      invoice,
      amount,
      method,
    }: {
      invoice: any;
      amount: number;
      method: string;
    }) => {
      const newPaid = (invoice.paid_amount ?? 0) + amount;
      const status =
        newPaid >= invoice.total_amount
          ? "paid"
          : newPaid > 0
            ? "partial"
            : "unpaid";
      const { error } = await supabase
        .from("invoices")
        .update({ paid_amount: newPaid, status })
        .eq("id", invoice.id);
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("payments")
        .insert({ invoice_id: invoice.id, amount, method });
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-payments"] });
      setPayOpen(false);
      setPayInvoice(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const downloadInvoice = async (inv: any) => {
    const { data } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", inv.id);
    generateInvoicePdf(inv, data ?? [], hospital);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = invoices.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0);
    const collected = invoices.reduce((s: number, i: any) => s + (i.paid_amount ?? 0), 0);
    return {
      totalInvoices: invoices.length,
      totalRevenue: total,
      collected,
      outstanding: total - collected,
      unpaid: invoices.filter((i: any) => i.status === "unpaid").length,
      partial: invoices.filter((i: any) => i.status === "partial").length,
      paid: invoices.filter((i: any) => i.status === "paid").length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = invoices as any[];
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.visits?.patients?.name?.toLowerCase().includes(q) ||
          i.visits?.patients?.patient_code?.toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openDetail = (inv: any) => {
    setSelected(inv);
    setDetailOpen(true);
  };

  const openPay = (inv: any) => {
    setPayInvoice(inv);
    setPayOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <PageHeader
        title="Billing & Payments"
        description="Generate invoices, record payments, and download receipts"
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
            <CreateInvoiceDialog
              visits={visits}
              onSubmit={(visitId, items, total) =>
                create.mutate({ visitId, items, total })
              }
              isPending={create.isPending}
            />
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          sub={`${stats.totalInvoices} invoices`}
          icon={<TrendingUp className="h-4 w-4 text-violet-600" />}
          accent="bg-violet-100 dark:bg-violet-950/40"
        />
        <StatCard
          label="Collected"
          value={`₹${stats.collected.toLocaleString()}`}
          sub={`${stats.paid} paid`}
          icon={<Wallet className="h-4 w-4 text-emerald-600" />}
          accent="bg-emerald-100 dark:bg-emerald-950/40"
          onClick={() => { setStatusFilter("paid"); setPage(0); }}
          active={statusFilter === "paid"}
        />
        <StatCard
          label="Outstanding"
          value={`₹${stats.outstanding.toLocaleString()}`}
          sub={`${stats.unpaid + stats.partial} pending`}
          icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
          accent="bg-amber-100 dark:bg-amber-950/40"
          onClick={() => { setStatusFilter("unpaid"); setPage(0); }}
          active={statusFilter === "unpaid"}
        />
        <StatCard
          label="Partial"
          value={stats.partial}
          sub="part-paid invoices"
          icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
          accent="bg-blue-100 dark:bg-blue-950/40"
          onClick={() => { setStatusFilter("partial"); setPage(0); }}
          active={statusFilter === "partial"}
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
                placeholder="Search by patient name, code, or invoice ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(0); }}
            >
              <SelectTrigger className="h-9 w-full sm:w-44 gap-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
            {statusFilter !== "all" || search ? " matching filters" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4">Invoice</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden sm:table-cell">Paid</TableHead>
                <TableHead className="hidden sm:table-cell">Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading invoices…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-30" />
                      <p className="font-medium">No invoices found</p>
                      <p className="text-sm">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create a new invoice to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((inv: any) => {
                  const due = (inv.total_amount ?? 0) - (inv.paid_amount ?? 0);
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => openDetail(inv)}
                    >
                      <TableCell className="pl-4">
                        <span className="font-mono text-xs font-medium">
                          #{inv.id.slice(0, 8).toUpperCase()}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {inv.visits?.patients?.name ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {inv.visits?.patients?.patient_code}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {inv.created_at
                            ? format(parseISO(inv.created_at), "MMM d, yyyy")
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-sm">
                          ₹{(inv.total_amount ?? 0).toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                          ₹{(inv.paid_amount ?? 0).toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {due > 0 ? (
                          <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                            ₹{due.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={inv.status} />
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
                            onClick={(e) => { e.stopPropagation(); openDetail(inv); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {inv.status !== "paid" && inv.status !== "cancelled" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                              title="Record payment"
                              onClick={(e) => { e.stopPropagation(); openPay(inv); }}
                            >
                              <IndianRupee className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title="Download PDF"
                            onClick={(e) => { e.stopPropagation(); downloadInvoice(inv); }}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Invoice Detail Dialog */}
      <InvoiceDetailDialog
        invoice={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onPay={openPay}
        onDownload={downloadInvoice}
        hospital={hospital}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        invoice={payInvoice}
        open={payOpen}
        onClose={() => { setPayOpen(false); setPayInvoice(null); }}
        onSubmit={(amount, method) =>
          recordPayment.mutate({ invoice: payInvoice, amount, method })
        }
        isPending={recordPayment.isPending}
      />
    </div>
  );
}