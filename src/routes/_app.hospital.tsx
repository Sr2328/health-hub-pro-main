import { createFileRoute } from "@tanstack/react-router";
import { HospitalPage } from "@/features/hospital/HospitalPage";

export const Route = createFileRoute("/_app/hospital")({
  component: HospitalPage,
});