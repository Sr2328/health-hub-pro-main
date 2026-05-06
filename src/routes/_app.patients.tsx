import { createFileRoute } from "@tanstack/react-router";
import { PatientsPage } from "@/features/patients/PatientsPage";

export const Route = createFileRoute("/_app/patients")({
  component: PatientsPage,
}); 