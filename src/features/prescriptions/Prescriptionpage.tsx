import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import {
  Pill,
  Plus,
  Trash2,
  Edit3,
  Search,
  FileDown,
  Eye,
  ClipboardList,
  User,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  AlertCircle,
  Copy,
  Printer,
  Stethoscope,
} from "lucide-react";
import type { Prescription, MedicationItem, Visit, Patient, Doctor } from "@/integrations/supabase/types";

// ─── constants ─────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  "Once daily (OD)",
  "Twice daily (BD)",
  "Three times daily (TDS)",
  "Four times daily (QID)",
  "Every 6 hours (Q6H)",
  "Every 8 hours (Q8H)",
  "Every 12 hours (Q12H)",
  "At bedtime (HS)",
  "As needed (SOS/PRN)",
  "Alternate days",
  "Once weekly",
];

const ROUTE_OPTIONS = [
  "Oral",
  "Sublingual",
  "Intravenous (IV)",
  "Intramuscular (IM)",
  "Subcutaneous (SC)",
  "Topical",
  "Inhalation",
  "Nasal",
  "Ophthalmic",
  "Otic",
  "Rectal",
  "Transdermal",
];

const DURATION_OPTIONS = [
  "1 day",
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "Indefinitely",
  "Until review",
];

const COMMON_DRUGS = [
  "Tab. Paracetamol 500mg",
  "Tab. Ibuprofen 400mg",
  "Tab. Amoxicillin 500mg",
  "Tab. Azithromycin 500mg",
  "Tab. Metformin 500mg",
  "Tab. Amlodipine 5mg",
  "Tab. Atorvastatin 10mg",
  "Tab. Pantoprazole 40mg",
  "Tab. Cetirizine 10mg",
  "Tab. Metronidazole 400mg",
  "Tab. Ciprofloxacin 500mg",
  "Cap. Omeprazole 20mg",
  "Syr. Amoxicillin 250mg/5ml",
  "Inj. Diclofenac 75mg",
  "Inj. Ondansetron 4mg",
];

// ─── types ─────────────────────────────────────────────────────────────────────

interface PrescriptionWithRelations extends Prescription {
  visit?: (Visit & {
    patient?: Patient | null;
    doctor?: Doctor | null;
  }) | null;
}

interface MedForm extends MedicationItem {
  _id: string; // local key
}

const blankMed = (): MedForm => ({
  _id: crypto.randomUUID(),
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "Oral",
  notes: "",
});

// ─── print utility ─────────────────────────────────────────────────────────────

function printPrescription(rx: PrescriptionWithRelations) {
  const patient = rx.visit?.patient;
  const doctor = rx.visit?.doctor;
  const meds = Array.isArray(rx.medications) ? rx.medications : [];
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Prescription</title>
    <style>
      body { font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 32px; color: #1a1a2e; }
      .header { border-bottom: 2px solid #0f2d6b; padding-bottom: 16px; margin-bottom: 24px; }
      .hospital { font-size: 20px; font-weight: bold; color: #0f2d6b; }
      .rx-symbol { font-size: 48px; color: #0f2d6b; font-style: italic; line-height: 1; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; font-size: 13px; }
      .info-label { color: #666; }
      .med-row { border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
      .med-name { font-weight: bold; font-size: 15px; }
      .med-details { font-size: 13px; color: #444; margin-top: 4px; }
      .instructions { margin-top: 24px; padding: 12px; background: #f8f9ff; border-radius: 6px; font-size: 13px; }
      .footer { margin-top: 48px; border-top: 1px solid #ddd; padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
      @media print { body { padding: 16px; } }
    </style>
    </head><body>
    <div class="header">
      <div class="hospital">Metro Multifacility Hospital</div>
      <div style="font-size:13px; color:#555; margin-top:4px;">Multi-Specialty Healthcare Centre</div>
    </div>
    <div style="display:flex; align-items:flex-start; gap:16px; margin-bottom:20px;">
      <div class="rx-symbol">℞</div>
      <div class="info-grid" style="flex:1;">
        <div><span class="info-label">Patient: </span><strong>${patient?.name ?? "—"}</strong></div>
        <div><span class="info-label">Code: </span>${patient?.patient_code ?? "—"}</div>
        <div><span class="info-label">Doctor: </span>Dr. ${doctor?.name ?? "—"}</div>
        <div><span class="info-label">Date: </span>${new Date(rx.created_at).toLocaleDateString("en-IN")}</div>
        <div><span class="info-label">Gender: </span>${patient?.gender ?? "—"}</div>
        <div><span class="info-label">Blood: </span>${patient?.blood_group ?? "—"}</div>
      </div>
    </div>
    <div>
      ${meds.map((m, i) => `
        <div class="med-row">
          <div class="med-name">${i + 1}. ${m.name}</div>
          <div class="med-details">
            ${m.dosage ? `Dose: ${m.dosage} &nbsp;|&nbsp;` : ""}
            ${m.frequency ? `Freq: ${m.frequency} &nbsp;|&nbsp;` : ""}
            ${m.duration ? `Duration: ${m.duration} &nbsp;|&nbsp;` : ""}
            ${m.route ? `Route: ${m.route}` : ""}
          </div>
          ${m.notes ? `<div class="med-details" style="color:#888; margin-top:4px;">Note: ${m.notes}</div>` : ""}
        </div>
      `).join("")}
    </div>
    ${rx.instructions ? `<div class="instructions"><strong>Instructions:</strong><br>${rx.instructions}</div>` : ""}
    <div class="footer">
      <div>Prescription ID: ${rx.id.slice(0, 8).toUpperCase()}</div>
      <div style="text-align:right;">________________________<br>Doctor's Signature</div>
    </div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

// ─── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <div>{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── medication row ─────────────────────────────────────────────────────────────

function MedRow({
  med,
  idx,
  onChange,
  onRemove,
}: {
  med: MedForm;
  idx: number;
  onChange: (id: string, k: keyof MedForm, v: string) => void;
  onRemove: (id: string) => void;
}) {
  const [drugSearch, setDrugSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = COMMON_DRUGS.filter((d) =>
    drugSearch && d.toLowerCase().includes(drugSearch.toLowerCase())
  );

  return (
    <div className="border rounded-xl p-4 space-y-3 relative bg-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Medicine {idx + 1}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:text-destructive"
          onClick={() => onRemove(med._id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* drug name with autocomplete */}
      <div className="relative">
        <Label className="text-xs">Drug Name *</Label>
        <Input
          placeholder="e.g. Tab. Paracetamol 500mg"
          value={med.name}
          onChange={(e) => {
            onChange(med._id, "name", e.target.value);
            setDrugSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="mt-1"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                onMouseDown={() => {
                  onChange(med._id, "name", s);
                  setShowSuggestions(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Dosage</Label>
          <Input
            placeholder="e.g. 500mg, 1 tablet"
            value={med.dosage}
            onChange={(e) => onChange(med._id, "dosage", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Route</Label>
          <Select value={med.route || "Oral"} onValueChange={(v) => onChange(med._id, "route", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Frequency *</Label>
          <Select value={med.frequency} onValueChange={(v) => onChange(med._id, "frequency", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Duration *</Label>
          <Select value={med.duration} onValueChange={(v) => onChange(med._id, "duration", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs">Notes (optional)</Label>
        <Input
          placeholder="e.g. Take after meals, avoid alcohol"
          value={med.notes || ""}
          onChange={(e) => onChange(med._id, "notes", e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );
}

// ─── view dialog ───────────────────────────────────────────────────────────────

function ViewPrescriptionDialog({
  rx,
  onClose,
  onEdit,
}: {
  rx: PrescriptionWithRelations;
  onClose: () => void;
  onEdit: () => void;
}) {
  const meds = Array.isArray(rx.medications) ? (rx.medications as MedicationItem[]) : [];
  const patient = rx.visit?.patient;
  const doctor = rx.visit?.doctor;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Prescription Details
          </DialogTitle>
        </DialogHeader>

        {/* header strip */}
        <div className="rounded-xl border bg-muted/30 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Patient</p>
            <p className="font-semibold">{patient?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{patient?.patient_code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Doctor</p>
            <p className="font-semibold">Dr. {doctor?.name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{doctor?.qualification}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-semibold">{new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p className="text-xs text-muted-foreground font-mono">#{rx.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* medications */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Medications ({meds.length})
          </p>
          {meds.map((m, i) => (
            <div key={i} className="border rounded-xl p-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="font-semibold text-sm">{m.name}</p>
                </div>
                {m.route && (
                  <Badge variant="outline" className="text-xs">{m.route}</Badge>
                )}
              </div>
              <div className="mt-2 ml-9 flex flex-wrap gap-2">
                {m.dosage && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs" variant="outline">{m.dosage}</Badge>}
                {m.frequency && <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs" variant="outline">{m.frequency}</Badge>}
                {m.duration && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs" variant="outline">{m.duration}</Badge>}
              </div>
              {m.notes && (
                <p className="mt-2 ml-9 text-xs text-muted-foreground italic">{m.notes}</p>
              )}
            </div>
          ))}
        </div>

        {rx.instructions && (
          <div className="rounded-xl border bg-amber-50 border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Instructions
            </p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{rx.instructions}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => printPrescription(rx)} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" onClick={onEdit} className="gap-1.5">
            <Edit3 className="h-4 w-4" /> Edit
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── form dialog ───────────────────────────────────────────────────────────────

function PrescriptionFormDialog({
  open,
  onClose,
  existing,
  visits,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  existing: PrescriptionWithRelations | null;
  visits: any[];
  onSave: (data: { visit_id: string; medications: MedicationItem[]; instructions: string }, id?: string) => void;
  isSaving: boolean;
}) {
  const [visitId, setVisitId] = useState(existing?.visit_id ?? "");
  const [meds, setMeds] = useState<MedForm[]>(
    existing && Array.isArray(existing.medications) && existing.medications.length > 0
      ? (existing.medications as MedicationItem[]).map((m) => ({ ...m, _id: crypto.randomUUID() }))
      : [blankMed()]
  );
  const [instructions, setInstructions] = useState(existing?.instructions ?? "");

  const updateMed = (id: string, k: keyof MedForm, v: string) =>
    setMeds((ms) => ms.map((m) => (m._id === id ? { ...m, [k]: v } : m)));

  const removeMed = (id: string) =>
    setMeds((ms) => ms.length > 1 ? ms.filter((m) => m._id !== id) : ms);

  const handleSave = () => {
    const cleanMeds: MedicationItem[] = meds
      .filter((m) => m.name.trim())
      .map(({ _id, ...rest }) => rest);
    onSave({ visit_id: visitId, medications: cleanMeds, instructions }, existing?.id);
  };

  const isValid = visitId && meds.some((m) => m.name.trim() && m.frequency && m.duration);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            {existing ? "Edit Prescription" : "New Prescription"}
          </DialogTitle>
          <DialogDescription>
            {existing ? "Modify medications or instructions below." : "Select a visit and add medications."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* visit selector */}
          <div className="space-y-1.5">
            <Label>Visit *</Label>
            <Select value={visitId} onValueChange={setVisitId} disabled={!!existing}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient visit" />
              </SelectTrigger>
              <SelectContent>
                {visits.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="font-mono text-xs mr-2">#{v.token_number ?? "—"}</span>
                    {v.patients?.name}
                    <span className="text-muted-foreground ml-1.5 text-xs">({v.patients?.patient_code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* meds */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Medications *</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMeds((ms) => [...ms, blankMed()])}
                className="gap-1.5 h-7 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Medicine
              </Button>
            </div>
            {meds.map((m, i) => (
              <MedRow key={m._id} med={m} idx={i} onChange={updateMed} onRemove={removeMed} />
            ))}
          </div>

          {/* instructions */}
          <div className="space-y-1.5">
            <Label>Additional Instructions</Label>
            <Textarea
              placeholder="e.g. Take all medicines after food. Avoid spicy food. Follow up after 7 days..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? "Saving…" : existing ? "Save Changes" : "Create Prescription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── prescription card ──────────────────────────────────────────────────────────

function PrescriptionCard({
  rx,
  onView,
  onEdit,
  onDelete,
}: {
  rx: PrescriptionWithRelations;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meds = Array.isArray(rx.medications) ? (rx.medications as MedicationItem[]) : [];
  const patient = rx.visit?.patient;
  const doctor = rx.visit?.doctor;

  return (
    <Card className="hover:shadow-md transition-shadow border">
      <CardContent className="p-0">
        {/* top row */}
        <div className="p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold truncate">{patient?.name ?? "Unknown Patient"}</p>
                <p className="text-xs text-muted-foreground">{patient?.patient_code}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="secondary" className="text-xs">
                  {meds.length} med{meds.length !== 1 ? "s" : ""}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Stethoscope className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Dr. {doctor?.name ?? "—"}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-xs text-muted-foreground">#{rx.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* med preview */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {meds.slice(0, expanded ? undefined : 3).map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2.5 py-1 text-xs"
              >
                <span className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="font-medium truncate max-w-[140px]">{m.name}</span>
                {m.frequency && <span className="text-muted-foreground">· {m.frequency.split(" ")[0]}</span>}
              </div>
            ))}
            {!expanded && meds.length > 3 && (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                +{meds.length - 3} more <ChevronDown className="h-3 w-3" />
              </button>
            )}
            {expanded && meds.length > 3 && (
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
              >
                Show less <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>
          {rx.instructions && (
            <p className="mt-2 text-xs text-muted-foreground italic truncate">
              📋 {rx.instructions}
            </p>
          )}
        </div>

        {/* actions */}
        <div className="border-t px-4 py-2.5 flex items-center gap-1.5 bg-muted/20">
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={onView}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={onEdit}>
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => printPrescription(rx)}
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export function PrescriptionPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<PrescriptionWithRelations | null>(null);
  const [viewingRx, setViewingRx] = useState<PrescriptionWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrescriptionWithRelations | null>(null);

  // ── realtime ──
  useEffect(() => {
    const ch = supabase
      .channel("prescriptions-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prescriptions" },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["prescriptions"] });
          if (payload.eventType === "INSERT") {
            toast({ title: "New prescription created", description: "Prescription added successfully." });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, toast]);

  // ── queries ──
  const { data: prescriptions = [], isLoading } = useQuery<PrescriptionWithRelations[]>({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          visit:visits(
            id, token_number, visit_date, visit_type,
            patient:patients(id, name, patient_code, phone, blood_group, gender, dob),
            doctor:doctors(id, name, qualification)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["visits-rx"],
    queryFn: async () => {
      const { data } = await supabase
        .from("visits")
        .select("id, token_number, patients(name, patient_code)")
        .order("created_at", { ascending: false })
        .limit(150);
      return data ?? [];
    },
  });

  // ── mutations ──
  const saveMutation = useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: { visit_id: string; medications: MedicationItem[]; instructions: string };
      id?: string;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("prescriptions")
          .update({ medications: data.medications as any, instructions: data.instructions })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prescriptions").insert({
          visit_id: data.visit_id,
          medications: data.medications as any,
          instructions: data.instructions || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      toast({ title: id ? "Prescription updated" : "Prescription created", description: "Saved successfully." });
      setFormOpen(false);
      setEditingRx(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prescriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      toast({ title: "Deleted", description: "Prescription removed." });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ── derived ──
  const filtered = prescriptions.filter((rx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rx.visit?.patient?.name?.toLowerCase().includes(q) ||
      rx.visit?.patient?.patient_code?.toLowerCase().includes(q) ||
      rx.visit?.doctor?.name?.toLowerCase().includes(q) ||
      (Array.isArray(rx.medications) &&
        (rx.medications as MedicationItem[]).some((m) =>
          m.name?.toLowerCase().includes(q)
        ))
    );
  });

  const stats = {
    total: prescriptions.length,
    today: prescriptions.filter((rx) =>
      new Date(rx.created_at).toDateString() === new Date().toDateString()
    ).length,
    totalMeds: prescriptions.reduce(
      (sum, rx) => sum + (Array.isArray(rx.medications) ? rx.medications.length : 0),
      0
    ),
  };

  const handleEdit = (rx: PrescriptionWithRelations) => {
    setEditingRx(rx);
    setViewingRx(null);
    setFormOpen(true);
  };

  // ── export CSV ──
  const handleExport = () => {
    const rows = [
      ["ID", "Patient", "Code", "Doctor", "Medications", "Instructions", "Date"],
      ...prescriptions.map((rx) => [
        rx.id.slice(0, 8).toUpperCase(),
        rx.visit?.patient?.name ?? "",
        rx.visit?.patient?.patient_code ?? "",
        rx.visit?.doctor?.name ?? "",
        Array.isArray(rx.medications)
          ? (rx.medications as MedicationItem[]).map((m) => m.name).join("; ")
          : "",
        rx.instructions ?? "",
        new Date(rx.created_at).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: "Downloaded as CSV." });
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <PageHeader
        title="Prescriptions"
        description="Create, manage and print patient prescriptions with real-time sync"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["prescriptions"] })} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditingRx(null); setFormOpen(true); }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Prescription
            </Button>
          </div>
        }
      />

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Prescriptions"
          value={stats.total}
          color="bg-blue-50 border-blue-200 text-blue-800"
          icon={<ClipboardList className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Issued Today"
          value={stats.today}
          color="bg-emerald-50 border-emerald-200 text-emerald-800"
          icon={<Calendar className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          label="Total Medications"
          value={stats.totalMeds}
          color="bg-purple-50 border-purple-200 text-purple-800"
          icon={<Pill className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, code, doctor, or drug name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" /> Loading prescriptions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-center gap-3">
          <Pill className="h-14 w-14 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            {search ? "No prescriptions match your search." : "No prescriptions yet."}
          </p>
          {search ? (
            <Button variant="outline" onClick={() => setSearch("")}>Clear search</Button>
          ) : (
            <Button onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create First Prescription
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} prescription{filtered.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((rx) => (
              <PrescriptionCard
                key={rx.id}
                rx={rx}
                onView={() => setViewingRx(rx)}
                onEdit={() => handleEdit(rx)}
                onDelete={() => setDeleteTarget(rx)}
              />
            ))}
          </div>
        </>
      )}

      {/* form dialog */}
      {formOpen && (
        <PrescriptionFormDialog
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingRx(null); }}
          existing={editingRx}
          visits={visits}
          onSave={(data, id) => saveMutation.mutate({ data, id })}
          isSaving={saveMutation.isPending}
        />
      )}

      {/* view dialog */}
      {viewingRx && (
        <ViewPrescriptionDialog
          rx={viewingRx}
          onClose={() => setViewingRx(null)}
          onEdit={() => handleEdit(viewingRx)}
        />
      )}

      {/* delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the prescription for{" "}
              <strong>{deleteTarget?.visit?.patient?.name}</strong>. This action cannot be undone.
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