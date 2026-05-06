import { createFileRoute } from "@tanstack/react-router";
import { RadiologyPage } from "@/features/radiology/RadiologyPage";

export const Route = createFileRoute("/_app/radiology")({
  component: RadiologyPage,
});