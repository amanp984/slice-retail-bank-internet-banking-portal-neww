import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { IdCard, MapPin, Building, Mail, Phone, Clock, ShieldCheck, Eye, UserCheck, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — Slice Bank" },
      { name: "description", content: "View your Slice Bank banking profile information." },
    ],
  }),
  component: Profile,
});

const info = [
  { i: IdCard, k: "Customer ID", v: "380682354256" },
  { i: IdCard, k: "Aadhaar Card (Last 4 Digits)", v: "XXXX XXXX 3842" },
  { i: MapPin, k: "Address", v: "Sodawala Nagar complex number 3, sector 44 Mumbai 400092" },
  { i: IdCard, k: "PAN Card Number", v: "GOXXXXXX77B" },
  { i: MapPin, k: "Permanent Address", v: "Sodawala Nagar complex number 3, sector 44 Mumbai 400092" },
  { i: Building, k: "Bank Address", v: "Slice Bank, 6th Floor, Tower 1,\nOne World Centre, Senapati Bapat Marg,\nLower Parel, Mumbai - 400013" },
  { i: Building, k: "Branch Address", v: "Slice Bank, Mumbai - Corporate Branch,\nTower A, BKC,\nMumbai, Maharashtra - 400051" },
];

function Profile() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Profile & Settings</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">View your banking profile information</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 space-y-5">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <div className="border-b-2 border-primary inline-block pb-2 mb-6">
              <span className="text-sm font-semibold text-primary">Profile Overview</span>
            </div>

            <h3 className="font-bold mb-4">Profile Picture</h3>
            <div className="flex items-center gap-5 pb-6 border-b border-border">
              <div className="w-20 h-20 rounded-full bg-accent text-primary grid place-items-center text-2xl font-bold">AJ</div>
              <div>
                <div className="text-lg font-bold">ANJAN </div>
                <div className="text-sm text-muted-foreground">Customer ID: 380682354256</div>
              </div>
            </div>

            <h3 className="font-bold mt-6 mb-4">Personal Information</h3>
            <div className="divide-y divide-border">
              {info.map(({ i: I, k, v }) => (
                <div key={k} className="grid grid-cols-12 gap-4 py-4 items-start">
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3 text-sm text-foreground">
                    <I className="w-4 h-4 text-primary" /> {k}
                  </div>
                  <div className="col-span-12 md:col-span-7 text-sm text-foreground whitespace-pre-line">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold mb-4">Bank Contact Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3"><Mail className="w-4 h-4 text-primary mt-1" /><div><div className="text-xs text-muted-foreground">Official Email</div><div>support@slice.bank</div></div></div>
              <div className="flex gap-3"><Phone className="w-4 h-4 text-primary mt-1" /><div><div className="text-xs text-muted-foreground">Customer Care</div><div>1800 572 9999 (Toll Free)</div><div>+91 80 4567 8999</div></div></div>
              <div className="flex gap-3"><Clock className="w-4 h-4 text-primary mt-1" /><div><div className="text-xs text-muted-foreground">Customer Care Timings</div><div>24x7, All Days</div></div></div>
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-accent/40 border border-accent">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-primary">Security Tip</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Keep your profile information updated to ensure smooth banking experience.</p>
                <button className="mt-3 text-xs font-semibold text-primary hover:underline">Learn More →</button>
              </div>
              <ShieldCheck className="w-10 h-10 text-primary/70" />
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <ul className="divide-y divide-border">
              {[{i: Eye, l: "View Contact Details"}, {i: UserCheck, l: "View Nominee"}, {i: FileText, l: "Account Statement"}].map(({i: I, l}) => (
                <li key={l} className="flex items-center justify-between py-3 text-sm cursor-pointer hover:text-primary">
                  <span className="flex items-center gap-3"><I className="w-4 h-4 text-primary" /> {l}</span>
                  <span className="text-muted-foreground">›</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-4 bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <div className="font-bold text-sm text-green-800">Profile Complete</div>
              <div className="text-xs text-green-700">Your banking profile is verified.</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
