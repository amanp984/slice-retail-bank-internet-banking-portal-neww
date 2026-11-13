import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InfoModal } from "@/components/InfoModal";
import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Car, GraduationCap, Briefcase, IndianRupee, ShieldCheck, Info } from "lucide-react";

export const Route = createFileRoute("/loans")({
  head: () => ({ meta: [{ title: "Loans — Slice Bank" }, { name: "description", content: "Loans in the Slice Bank test environment." }, { property: "og:title", content: "Loans — Slice Bank" }, { property: "og:description", content: "Loans in the Slice Bank test environment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: LoansPage,
});

const products = [
  { icon: Home, name: "Home Loan", rate: "8.40% p.a.", tenure: "Up to 30 years" },
  { icon: Car, name: "Vehicle Loan", rate: "9.25% p.a.", tenure: "Up to 7 years" },
  { icon: GraduationCap, name: "Education Loan", rate: "10.50% p.a.", tenure: "Up to 15 years" },
  { icon: Briefcase, name: "Personal Loan", rate: "11.99% p.a.", tenure: "Up to 5 years" },
];

function LoansPage() {
  const [open, setOpen] = useState(true);

  return (
    <DashboardLayout showGreeting={false}>
      <h1 className="text-2xl font-bold">Loans</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Explore our loan products and manage existing loans</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold mb-4">My Active Loans</h2>
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent grid place-items-center mb-3">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Active Loans</p>
              <p className="text-xs text-muted-foreground mt-1">You currently have no active loan accounts with Slice Bank.</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold mb-4">Loan Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <motion.div whileHover={{ y: -2 }} key={p.name}
                  className="border border-border rounded-xl p-4 flex items-start gap-3 hover:border-primary/40 transition">
                  <div className="w-10 h-10 rounded-lg bg-accent grid place-items-center shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Starting at {p.rate}</div>
                    <div className="text-xs text-muted-foreground">{p.tenure}</div>
                    <button onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-primary hover:underline">Check Eligibility →</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-3">Why Slice Bank Loans</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5" /> Competitive interest rates</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5" /> Flexible repayment tenure</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5" /> Minimal documentation</li>
              <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-primary mt-0.5" /> Quick disbursal</li>
            </ul>
          </div>
          <div className="bg-accent/30 border border-accent rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-bold">Need Assistance?</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Visit your nearest Slice Bank branch for loan-related queries and assistance.</p>
          </div>
        </div>
      </div>

      <InfoModal
        open={open}
        onClose={() => setOpen(false)}
        title="Not Eligible for New Loan"
        message="Based on your current profile, you are not eligible for a new loan request through internet banking. Please visit your registered branch for further assistance."
        cta="Okay"
        variant="warning"
      />
    </DashboardLayout>
  );
}
