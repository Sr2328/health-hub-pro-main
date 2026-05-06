import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const schema = z.object({
  name: z.string().trim().min(2, "Name required").max(150),
  registration_no: z.string().trim().max(80).optional().or(z.literal("")),
  hospital_type: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(150).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().trim().max(15).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  total_beds: z.coerce.number().int().min(0).max(100000).optional(),
  established_year: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  accreditation: z.string().trim().max(120).optional().or(z.literal("")),
  working_hours: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

type HospitalForm = z.infer<typeof schema>;

const empty: HospitalForm = {
  name: "", registration_no: "", hospital_type: "", email: "", phone: "", website: "",
  address: "", city: "", state: "", pincode: "", country: "India",
  total_beds: 0, established_year: undefined, accreditation: "", working_hours: "", description: "",
};

export function HospitalPage() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const isAdmin = roles.includes("super_admin");
  const [form, setForm] = useState<HospitalForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: hospital } = useQuery({
    queryKey: ["hospital"],
    queryFn: async () => (await supabase.from("hospitals").select("*").order("created_at").limit(1).maybeSingle()).data,
  });

  useEffect(() => {
    if (hospital) {
      const cleaned: any = { ...empty };
      Object.keys(empty).forEach(k => {
        const v = (hospital as any)[k];
        if (v !== null && v !== undefined) cleaned[k] = v;
      });
      setForm(cleaned);
    }
  }, [hospital]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        parsed.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
        setErrors(errs);
        throw new Error("Please fix the errors");
      }
      setErrors({});
      const payload: any = { ...parsed.data, updated_at: new Date().toISOString() };
      if (hospital?.id) {
        const { error } = await supabase.from("hospitals").update(payload).eq("id", hospital.id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from("hospitals").insert({ ...payload, created_by: u.user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Hospital details saved"); qc.invalidateQueries({ queryKey: ["hospital"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const upd = (k: keyof HospitalForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Hospital Profile" description="Hospital registration & details" />
        <Card><CardContent className="p-6 text-muted-foreground">Only Super Admins can register/manage hospital details. Current details below.</CardContent></Card>
        {hospital && (
          <Card className="mt-4"><CardHeader><CardTitle>{hospital.name}</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Reg No:</span> {hospital.registration_no ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {hospital.phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {hospital.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Beds:</span> {hospital.total_beds ?? 0}</div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {hospital.address ?? "—"}</div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={hospital ? "Hospital Profile" : "Register Hospital"}
        description="Manage your hospital's official information"
        action={<Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2"><Save className="h-4 w-4" /> Save</Button>}
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" /> Basic Information</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Field label="Hospital Name *" error={errors.name}><Input value={form.name} onChange={e => upd("name", e.target.value)} /></Field>
            <Field label="Registration No." error={errors.registration_no}><Input value={form.registration_no ?? ""} onChange={e => upd("registration_no", e.target.value)} /></Field>
            <Field label="Hospital Type" error={errors.hospital_type}>
              <Input placeholder="Multi-specialty / Clinic / Trust" value={form.hospital_type ?? ""} onChange={e => upd("hospital_type", e.target.value)} />
            </Field>
            <Field label="Established Year" error={errors.established_year}>
              <Input type="number" value={form.established_year ?? ""} onChange={e => upd("established_year", e.target.value ? Number(e.target.value) : undefined)} />
            </Field>
            <Field label="Total Beds" error={errors.total_beds}><Input type="number" value={form.total_beds ?? 0} onChange={e => upd("total_beds", Number(e.target.value))} /></Field>
            <Field label="Accreditation" error={errors.accreditation}><Input placeholder="NABH / JCI / ISO" value={form.accreditation ?? ""} onChange={e => upd("accreditation", e.target.value)} /></Field>
            <Field label="Working Hours" error={errors.working_hours}><Input placeholder="24x7 / Mon-Sat 8AM-8PM" value={form.working_hours ?? ""} onChange={e => upd("working_hours", e.target.value)} /></Field>
            <Field label="Website" error={errors.website}><Input value={form.website ?? ""} onChange={e => upd("website", e.target.value)} /></Field>
            <div className="sm:col-span-2">
              <Field label="Description" error={errors.description}>
                <Textarea rows={3} value={form.description ?? ""} onChange={e => upd("description", e.target.value)} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Location</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Email" error={errors.email}><Input type="email" value={form.email ?? ""} onChange={e => upd("email", e.target.value)} /></Field>
            <Field label="Phone" error={errors.phone}><Input value={form.phone ?? ""} onChange={e => upd("phone", e.target.value)} /></Field>
            <Field label="Address" error={errors.address}><Textarea rows={2} value={form.address ?? ""} onChange={e => upd("address", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="City" error={errors.city}><Input value={form.city ?? ""} onChange={e => upd("city", e.target.value)} /></Field>
              <Field label="State" error={errors.state}><Input value={form.state ?? ""} onChange={e => upd("state", e.target.value)} /></Field>
              <Field label="Pincode" error={errors.pincode}><Input value={form.pincode ?? ""} onChange={e => upd("pincode", e.target.value)} /></Field>
              <Field label="Country" error={errors.country}><Input value={form.country ?? ""} onChange={e => upd("country", e.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}