import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Building2, Stethoscope, Users } from "lucide-react";

import type { Department, Doctor, Staff, AppRole } from "@/integrations/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeptForm = { name: string; head_doctor_id: string };
type DocForm = { name: string; qualification: string; dept_id: string; consultation_fee: string; is_available: boolean };
type StaffForm = { name: string; role: AppRole | ""; phone: string; dept_id: string; is_active: boolean };

const EMPTY_DEPT: DeptForm = { name: "", head_doctor_id: "" };
const EMPTY_DOC: DocForm = { name: "", qualification: "", dept_id: "", consultation_fee: "", is_available: true };
const EMPTY_STAFF: StaffForm = { name: "", role: "", phone: "", dept_id: "", is_active: true };

const STAFF_ROLES: AppRole[] = [
  "doctor", "nurse", "receptionist", "lab_technician",
  "radiologist", "pharmacist", "billing_staff",
];

const ROLE_COLORS: Record<string, string> = {
  doctor: "bg-blue-100 text-blue-800",
  nurse: "bg-pink-100 text-pink-800",
  receptionist: "bg-purple-100 text-purple-800",
  lab_technician: "bg-yellow-100 text-yellow-800",
  radiologist: "bg-orange-100 text-orange-800",
  pharmacist: "bg-green-100 text-green-800",
  billing_staff: "bg-gray-100 text-gray-800",
  super_admin: "bg-red-100 text-red-800",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"}`}>
      {role.replace("_", " ")}
    </span>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminPage() {
  const { roles } = useAuth();
  const qc = useQueryClient();
  const isAdmin = roles.includes("super_admin");

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [deptDialog, setDeptDialog] = useState<{ open: boolean; editing?: Department }>({ open: false });
  const [docDialog, setDocDialog] = useState<{ open: boolean; editing?: Doctor }>({ open: false });
  const [staffDialog, setStaffDialog] = useState<{ open: boolean; editing?: Staff }>({ open: false });

  const [deptForm, setDeptForm] = useState<DeptForm>(EMPTY_DEPT);
  const [docForm, setDocForm] = useState<DocForm>(EMPTY_DOC);
  const [staffForm, setStaffForm] = useState<StaffForm>(EMPTY_STAFF);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const depts = useQuery({
    queryKey: ["a-depts"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });

  const docs = useQuery({
    queryKey: ["a-docs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*, departments(name)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as (Doctor & { departments: { name: string } | null })[];
    },
  });

  const staff = useQuery({
    queryKey: ["a-staff"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*, departments(name)")
        .order("name");
      if (error) throw error;
      return (data ?? []) as (Staff & { departments: { name: string } | null })[];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  // Department
  const saveDept = useMutation({
    mutationFn: async () => {
      const payload = {
        name: deptForm.name.trim(),
        head_doctor_id: deptForm.head_doctor_id || null,
      };
      if (deptDialog.editing) {
        const { error } = await supabase.from("departments").update(payload).eq("id", deptDialog.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("departments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["a-depts"] });
      setDeptDialog({ open: false });
    },
  });

  // Doctor
  const saveDoc = useMutation({
    mutationFn: async () => {
      const payload = {
        name: docForm.name.trim(),
        qualification: docForm.qualification.trim() || null,
        dept_id: docForm.dept_id || null,
        consultation_fee: Number(docForm.consultation_fee) || 0,
        is_available: docForm.is_available,
      };
      if (docDialog.editing) {
        const { error } = await supabase.from("doctors").update(payload).eq("id", docDialog.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doctors").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["a-docs"] });
      setDocDialog({ open: false });
    },
  });

  // Staff
  const saveStaff = useMutation({
    mutationFn: async () => {
      const payload = {
        name: staffForm.name.trim(),
        role: staffForm.role as AppRole,
        phone: staffForm.phone.trim() || null,
        dept_id: staffForm.dept_id || null,
        is_active: staffForm.is_active,
      };
      if (staffDialog.editing) {
        const { error } = await supabase.from("staff").update(payload).eq("id", staffDialog.editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["a-staff"] });
      setStaffDialog({ open: false });
    },
  });

  // ── Open helpers ─────────────────────────────────────────────────────────────

  function openDept(d?: Department) {
    setDeptForm(d ? { name: d.name, head_doctor_id: d.head_doctor_id ?? "" } : EMPTY_DEPT);
    setDeptDialog({ open: true, editing: d });
  }

  function openDoc(d?: Doctor) {
    setDocForm(d ? {
      name: d.name,
      qualification: d.qualification ?? "",
      dept_id: d.dept_id ?? "",
      consultation_fee: String(d.consultation_fee ?? ""),
      is_available: d.is_available,
    } : EMPTY_DOC);
    setDocDialog({ open: true, editing: d });
  }

  function openStaff(s?: Staff) {
    setStaffForm(s ? {
      name: s.name,
      role: s.role as AppRole,
      phone: s.phone ?? "",
      dept_id: s.dept_id ?? "",
      is_active: s.is_active,
    } : EMPTY_STAFF);
    setStaffDialog({ open: true, editing: s });
  }

  // ── Access guard ─────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <Card className="max-w-lg mx-auto mt-10">
        <CardHeader><CardTitle>Access Restricted</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">
          Only Super Admins can access this page. Claim Super Admin from the Dashboard.
        </CardContent>
      </Card>
    );
  }

  // ── Loading / Error ──────────────────────────────────────────────────────────

  const isLoading = depts.isLoading || docs.isLoading || staff.isLoading;
  const anyError = depts.error || docs.error || staff.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="animate-spin h-5 w-5" /> Loading admin data…
      </div>
    );
  }

  if (anyError) {
    const msg = (anyError as Error).message;
    return (
      <Card className="border-destructive max-w-lg mx-auto mt-10">
        <CardHeader><CardTitle className="text-destructive">Failed to load</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">{msg}</CardContent>
      </Card>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <PageHeader title="Admin Panel" description="Manage departments, doctors, and staff" />

      <Tabs defaultValue="depts">
        <TabsList className="mb-2">
          <TabsTrigger value="depts" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Departments
            <Badge variant="secondary" className="ml-1">{depts.data?.length ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-1.5">
            <Stethoscope className="h-4 w-4" /> Doctors
            <Badge variant="secondary" className="ml-1">{docs.data?.length ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            <Users className="h-4 w-4" /> Staff
            <Badge variant="secondary" className="ml-1">{staff.data?.length ?? 0}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── DEPARTMENTS ── */}
        <TabsContent value="depts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base">Departments</CardTitle>
              <Button size="sm" onClick={() => openDept()} className="gap-1">
                <Plus className="h-4 w-4" /> Add Department
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Head Doctor</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depts.data?.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No departments yet</TableCell></TableRow>
                  )}
                  {depts.data?.map((d) => {
                    const head = docs.data?.find(doc => doc.id === d.head_doctor_id);
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{head?.name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.created_at?.slice(0, 10)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDept(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DOCTORS ── */}
        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base">Doctors</CardTitle>
              <Button size="sm" onClick={() => openDoc()} className="gap-1">
                <Plus className="h-4 w-4" /> Add Doctor
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.data?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No doctors yet</TableCell></TableRow>
                  )}
                  {docs.data?.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.qualification ?? "—"}</TableCell>
                      <TableCell className="text-sm">{(d as any).departments?.name ?? "—"}</TableCell>
                      <TableCell>₹{d.consultation_fee}</TableCell>
                      <TableCell>
                        <Badge variant={d.is_available ? "default" : "secondary"}>
                          {d.is_available ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDoc(d)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STAFF ── */}
        <TabsContent value="staff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base">Staff</CardTitle>
              <Button size="sm" onClick={() => openStaff()} className="gap-1">
                <Plus className="h-4 w-4" /> Add Staff
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.data?.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No staff yet</TableCell></TableRow>
                  )}
                  {staff.data?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><RoleBadge role={s.role} /></TableCell>
                      <TableCell className="text-sm">{(s as any).departments?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "secondary"}>
                          {s.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStaff(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══ DEPARTMENT DIALOG ══ */}
      <Dialog open={deptDialog.open} onOpenChange={(o) => setDeptDialog({ open: o })}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{deptDialog.editing ? "Edit Department" : "Add Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Department Name *">
              <Input
                placeholder="e.g. Cardiology"
                value={deptForm.name}
                onChange={(e) => setDeptForm(f => ({ ...f, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Head Doctor (optional)">
              <Select
                value={deptForm.head_doctor_id}
                onValueChange={(v) => setDeptForm(f => ({ ...f, head_doctor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select head doctor…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {docs.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => saveDept.mutate()}
              disabled={!deptForm.name.trim() || saveDept.isPending}
            >
              {saveDept.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {deptDialog.editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
          {saveDept.error && (
            <p className="text-xs text-destructive mt-1">{(saveDept.error as Error).message}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ DOCTOR DIALOG ══ */}
      <Dialog open={docDialog.open} onOpenChange={(o) => setDocDialog({ open: o })}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{docDialog.editing ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Full Name *">
              <Input
                placeholder="Dr. Arjun Mehta"
                value={docForm.name}
                onChange={(e) => setDocForm(f => ({ ...f, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Qualification">
              <Input
                placeholder="MBBS, MD"
                value={docForm.qualification}
                onChange={(e) => setDocForm(f => ({ ...f, qualification: e.target.value }))}
              />
            </FormField>
            <FormField label="Department">
              <Select
                value={docForm.dept_id}
                onValueChange={(v) => setDocForm(f => ({ ...f, dept_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {depts.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Consultation Fee (₹)">
              <Input
                type="number"
                placeholder="500"
                value={docForm.consultation_fee}
                onChange={(e) => setDocForm(f => ({ ...f, consultation_fee: e.target.value }))}
              />
            </FormField>
            <div className="col-span-2 flex items-center gap-3">
              <Switch
                id="doc-avail"
                checked={docForm.is_available}
                onCheckedChange={(v) => setDocForm(f => ({ ...f, is_available: v }))}
              />
              <Label htmlFor="doc-avail">Available for appointments</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => saveDoc.mutate()}
              disabled={!docForm.name.trim() || saveDoc.isPending}
            >
              {saveDoc.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {docDialog.editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
          {saveDoc.error && (
            <p className="text-xs text-destructive mt-1">{(saveDoc.error as Error).message}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ STAFF DIALOG ══ */}
      <Dialog open={staffDialog.open} onOpenChange={(o) => setStaffDialog({ open: o })}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{staffDialog.editing ? "Edit Staff" : "Add Staff"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <FormField label="Full Name *">
              <Input
                placeholder="Priya Sharma"
                value={staffForm.name}
                onChange={(e) => setStaffForm(f => ({ ...f, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Phone">
              <Input
                placeholder="+91 9876543210"
                value={staffForm.phone}
                onChange={(e) => setStaffForm(f => ({ ...f, phone: e.target.value }))}
              />
            </FormField>
            <FormField label="Role *">
              <Select
                value={staffForm.role}
                onValueChange={(v) => setStaffForm(f => ({ ...f, role: v as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Department">
              <Select
                value={staffForm.dept_id}
                onValueChange={(v) => setStaffForm(f => ({ ...f, dept_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {depts.data?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="col-span-2 flex items-center gap-3">
              <Switch
                id="staff-active"
                checked={staffForm.is_active}
                onCheckedChange={(v) => setStaffForm(f => ({ ...f, is_active: v }))}
              />
              <Label htmlFor="staff-active">Active employee</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={() => saveStaff.mutate()}
              disabled={!staffForm.name.trim() || !staffForm.role || saveStaff.isPending}
            >
              {saveStaff.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {staffDialog.editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
          {saveStaff.error && (
            <p className="text-xs text-destructive mt-1">{(saveStaff.error as Error).message}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}