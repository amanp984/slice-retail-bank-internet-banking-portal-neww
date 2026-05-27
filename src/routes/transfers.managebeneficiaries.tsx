import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InfoModal } from "@/components/InfoModal";
import { motion } from "framer-motion";
import { Search, Filter, Plus, MoreVertical, UserPlus, Bell, Info, ChevronLeft, ChevronRight, Banknote, PiggyBank } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/transfers/managebeneficiaries")({
  head: () => ({ meta: [{ title: "Manage Beneficiaries — Slice Bank" }] }),
  component: ManageBeneficiaries,
});

const beneficiaries = [
  { initials: "RA", name: "Rahul Sharma", email: "", acct: "XXXX XXXX 3842", bank: "HDFC Bank", ifsc: "HDFC0006942", ifscBank: "HDFC Bank Ltd", type: "Personal" },
  { initials: "SA", name: "Sunita Agarwal", email: "", acct: "XXXX XXXX 8901", bank: "ICICI Bank", ifsc: "ICIC0CH4044", ifscBank: "ICICI Bank Ltd", type: "Personal" },
  { initials: "VB", name: "Vijay Builders Pvt Ltd", email: "\u200b", acct: "XXXX XXXX 3456", bank: "Axis Bank", ifsc: "UTIBAGS9765", ifscBank: "Axis Bank Ltd", type: "Business" },
  { initials: "NT", name: "Neha Tripathi", email: "", acct: "XXXX XXXX 1122", bank: "State Bank of India", ifsc: "SBIN0007789", ifscBank: "State Bank of India", type: "Personal" },
];

type ModalKey = null | "row" | "add" | "pending";

const modalContent: Record<Exclude<ModalKey, null>, { title: string; message: string; cta: string; variant: "warning" | "info" }> = {
  row: {
    title: "Action Restricted",
    message: "This action cannot be completed through internet banking at this moment. Please use your registered banking channel to continue.",
    cta: "Okay",
    variant: "warning",
  },
  add: {
    title: "Beneficiary Addition Restricted",
    message: "Beneficiary addition is currently unavailable through this portal. Please use your registered banking channel to continue.",
    cta: "Okay",
    variant: "warning",
  },
  pending: {
    title: "No Pending Requests",
    message: "There are currently no pending service requests associated with your account.",
    cta: "Close",
    variant: "info",
  },
};

function ManageBeneficiaries() {
  const [tab, setTab] = useState<"all" | "req">("all");
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Manage Beneficiaries</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">View, add and manage your beneficiaries</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-9 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-6 border-b border-transparent">
                <button onClick={() => setTab("all")}
                  className={`pb-2 text-sm font-semibold relative ${tab === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  All Beneficiaries (4)
                  {tab === "all" && <motion.div layoutId="benTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button onClick={() => setTab("req")}
                  className={`pb-2 text-sm font-semibold relative ${tab === "req" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Request Received (0)
                  {tab === "req" && <motion.div layoutId="benTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input placeholder="Search Beneficiaries" className="pl-9 pr-3 py-2 text-sm border border-border rounded-lg w-56 focus:outline-none focus:border-primary" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary"><Filter className="w-4 h-4" /> Filter</button>
                <button onClick={() => setModal("add")} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"><Plus className="w-4 h-4" /> Add Beneficiary</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left font-medium py-3">Beneficiary Details</th>
                    <th className="text-left font-medium py-3">Account Details</th>
                    <th className="text-left font-medium py-3">IFSC Code</th>
                    <th className="text-left font-medium py-3">Type</th>
                    <th className="text-left font-medium py-3">Status</th>
                    <th className="text-right font-medium py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "all" ? beneficiaries : []).map((b) => (
                    <tr key={b.name} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent text-primary grid place-items-center font-semibold text-xs">{b.initials}</div>
                          <div>
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-muted-foreground">{b.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>{b.acct}</div>
                        <div className="text-xs text-muted-foreground">{b.bank}</div>
                      </td>
                      <td className="py-4">
                        <div>{b.ifsc}</div>
                        <div className="text-xs text-muted-foreground">{b.ifscBank}</div>
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${b.type === "Personal" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{b.type}</span>
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-100 text-green-700">Active</span>
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => setModal("row")} className="p-1.5 hover:bg-secondary rounded-md"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
                      </td>
                    </tr>
                  ))}
                  {tab === "req" && (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No pending requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">Showing 1 to {tab === "all" ? 4 : 0} of {tab === "all" ? 4 : 0} beneficiaries</span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-md border border-border grid place-items-center hover:bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
                <button className="w-8 h-8 rounded-md bg-primary text-primary-foreground text-sm font-semibold">1</button>
                <button className="w-8 h-8 rounded-md border border-border grid place-items-center hover:bg-secondary"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-2">Quick Actions</h3>
            <ul className="divide-y divide-border">
              {[
                { i: UserPlus, l: "Add Beneficiary", action: () => setModal("add") },
                { i: PiggyBank, l: "Loans", to: "/loans" as const },
                { i: Banknote, l: "Fixed Deposits", to: "/fixeddeposits" as const },
                { i: Bell, l: "Pending Request", action: () => setModal("pending") },
              ].map(({ i: I, l, to, action }) => (
                <li key={l}>
                  {to ? (
                    <Link to={to} className="flex items-center justify-between py-3 text-sm hover:text-primary">
                      <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                      <span className="text-muted-foreground">›</span>
                    </Link>
                  ) : (
                    <button onClick={action} className="w-full flex items-center justify-between py-3 text-sm hover:text-primary">
                      <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                      <span className="text-muted-foreground">›</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-accent/30 border border-accent rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="font-bold">Important Note</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Please ensure all beneficiary details are correct before making any transfer.</p>
            <button className="mt-3 text-xs font-semibold text-primary hover:underline">Know More →</button>
          </div>
        </div>
      </div>

      <InfoModal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal ? modalContent[modal].title : ""}
        message={modal ? modalContent[modal].message : ""}
        cta={modal ? modalContent[modal].cta : "Okay"}
        variant={modal ? modalContent[modal].variant : "warning"}
      />
    </DashboardLayout>
  );
}
