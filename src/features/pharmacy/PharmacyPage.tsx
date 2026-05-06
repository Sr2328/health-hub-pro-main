import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, AlertTriangle } from "lucide-react";
import { generateInventoryReport } from "@/lib/pdf";

export function PharmacyPage() {
  const { data: drugs = [] } = useQuery({ queryKey: ["drugs"], queryFn: async () => (await supabase.from("drugs").select("*").order("name")).data ?? [] });
  return (
    <div>
      <PageHeader title="Pharmacy" description="Drug inventory with expiry & reorder alerts"
        action={<Button variant="outline" onClick={() => generateInventoryReport(drugs)} className="gap-2"><FileDown className="h-4 w-4" /> Inventory PDF</Button>} />
      <Card><CardContent className="p-4 overflow-x-auto"><Table>
        <TableHeader><TableRow>
          <TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead>Stock</TableHead><TableHead className="hidden md:table-cell">Price</TableHead>
          <TableHead className="hidden md:table-cell">Expiry</TableHead><TableHead>Status</TableHead>
        </TableRow></TableHeader>
        <TableBody>{drugs.map((d: any) => {
          const low = d.stock_qty <= d.reorder_level;
          return (<TableRow key={d.id}>
            <TableCell className="font-medium">{d.name}</TableCell>
            <TableCell className="hidden sm:table-cell">{d.category}</TableCell>
            <TableCell>{d.stock_qty}</TableCell>
            <TableCell className="hidden md:table-cell">₹{d.price}</TableCell>
            <TableCell className="hidden md:table-cell">{d.expiry_date}</TableCell>
            <TableCell>{low ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Reorder</Badge> : <Badge variant="outline">OK</Badge>}</TableCell>
          </TableRow>);
        })}</TableBody>
      </Table></CardContent></Card>
    </div>
  );
}
