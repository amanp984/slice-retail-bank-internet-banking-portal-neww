import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/LoginPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Slice Bank Internet Banking" },
      { name: "description", content: "Secure internet banking login for Slice Bank customers." },
    ],
  }),
  component: LoginPage,
});
