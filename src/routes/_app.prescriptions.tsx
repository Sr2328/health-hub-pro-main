import { createFileRoute } from "@tanstack/react-router";
import { PrescriptionPage } from "@/features/prescriptions/Prescriptionpage";

export const Route = createFileRoute("/_app/prescriptions")({
  component: PrescriptionPage,
});
