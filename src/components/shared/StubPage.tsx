import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Construction className="h-5 w-5" /> Coming next</CardTitle>
          <CardDescription>This module will be built out in the next iteration. The schema and access rules are already in place.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ask Lovable to expand this module — for example: "Build out the {title} module with full CRUD and PDF reports".
        </CardContent>
      </Card>
    </div>
  );
}