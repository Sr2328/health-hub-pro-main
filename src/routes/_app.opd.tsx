import { createFileRoute } from "@tanstack/react-router";
import { OpdPage } from "@/features/opd/OpdPage";

export const Route = createFileRoute("/_app/opd")({
  component: OpdPage,
});