import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "Offers — Slice Bank" }, { name: "description", content: "Exclusive offers for Slice Bank customers." }, { property: "og:title", content: "Offers — Slice Bank" }, { property: "og:description", content: "Exclusive offers for Slice Bank customers." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <DashboardLayout showGreeting>
      <h1 className="text-2xl font-bold">Offers</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Exclusive deals curated for you</p>
      <div className="bg-card rounded-2xl p-8 shadow-card border border-border text-center text-muted-foreground">
        No offers available right now.
      </div>
    </DashboardLayout>
  ),
});
