import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsPage } from "@/features/appointments/AppointmentsPage";

export const Route = createFileRoute("/_app/appointments")({
  component: AppointmentsPage,
});