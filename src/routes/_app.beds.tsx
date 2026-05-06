import { createFileRoute } from "@tanstack/react-router";
import { BedsPage } from "@/features/beds/BedsPage";

export const Route = createFileRoute("/_app/beds")({
  component: BedsPage,
});