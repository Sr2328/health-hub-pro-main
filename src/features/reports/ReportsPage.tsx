import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Users, ClipboardList, Pill, Bed, Calendar } from "lucide-react";
import { generatePatientReport, generateOpdReport, generateAppointmentsReport, generateInventoryReport, generateBedReport } from "@/lib/pdf";

export function ReportsPage() {
  const patients = useQuery({ queryKey: ["r-patients"], queryFn: async () => (await supabase.from("patients").select("*").limit(1000)).data ?? [] });
  const visits = useQuery({ queryKey: ["r-visits"], queryFn: async () => (await supabase.from("visits").select("*, patients(name), doctors(name)").limit(1000)).data ?? [] });
  const appts = useQuery({ queryKey: ["r-appts"], queryFn: async () => (await supabase.from("appointments").select("*, patients(name), doctors(name)").limit(1000)).data ?? [] });
  const drugs = useQuery({ queryKey: ["r-drugs"], queryFn: async () => (await supabase.from("drugs").select("*").limit(1000)).data ?? [] });
  const beds = useQuery({ queryKey: ["r-beds"], queryFn: async () => (await supabase.from("beds").select("*").limit(1000)).data ?? [] });
  const reports = [
    { icon: Users, title: "Patient Registry", desc: `${patients.data?.length ?? 0} patients`, fn: () => generatePatientReport(patients.data ?? []) },
    { icon: ClipboardList, title: "OPD Report", desc: `${visits.data?.length ?? 0} visits`, fn: () => generateOpdReport(visits.data ?? []) },
    { icon: Calendar, title: "Appointments", desc: `${appts.data?.length ?? 0} bookings`, fn: () => generateAppointmentsReport(appts.data ?? []) },
    { icon: Pill, title: "Pharmacy Inventory", desc: `${drugs.data?.length ?? 0} drugs`, fn: () => generateInventoryReport(drugs.data ?? []) },
    { icon: Bed, title: "Bed Occupancy", desc: `${beds.data?.length ?? 0} beds`, fn: () => generateBedReport(beds.data ?? []) },
  ];
  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Generate downloadable PDF reports across all modules" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2"><r.icon className="h-5 w-5" /></div>
              <CardTitle className="text-base">{r.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </CardHeader>
            <CardContent><Button onClick={r.fn} className="w-full gap-2"><FileDown className="h-4 w-4" /> Generate PDF</Button></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
