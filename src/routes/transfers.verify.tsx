import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InfoModal } from "@/components/InfoModal";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, ArrowLeft, Landmark, User, Info } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  name: z.string().optional().default("Beneficiary"),
  bank: z.string().optional().default(""),
  acct: z.string().optional().default(""),
  amount: z.string().optional().default("0"),
  mode: z.string().optional().default("IMPS"),
  remarks: z.string().optional().default(""),
});

export const Route = createFileRoute("/transfers/verify")({
  head: () => ({ meta: [{ title: "Verify Transfer — Slice Bank" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: VerifyPage,
});

function VerifyPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(55);
  const [modal, setModal] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const set = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = ch;
    setOtp(next);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!data) return;
    e.preventDefault();
    const arr = data.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(arr);
    refs.current[Math.min(data.length, 5)]?.focus();
  };

  const filled = otp.every((c) => c !== "");
  const formattedAmount = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Number(search.amount) || 0);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const timerColor = seconds <= 10 ? "text-destructive" : "text-foreground";

  return (
    <DashboardLayout showGreeting={false}>
      <button onClick={() => navigate({ to: "/transfers" })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Transfer
      </button>

      <h1 className="text-2xl font-bold">Verify Transaction</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Review and verify your transfer with OTP</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <h2 className="font-bold mb-4">Transfer Summary</h2>

            <div className="rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent text-primary grid place-items-center"><User className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Beneficiary</div>
                <div className="font-semibold text-sm">{search.name}</div>
                <div className="text-xs text-muted-foreground">{search.bank} • {search.acct}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4 mt-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent text-primary grid place-items-center"><Landmark className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">From Account</div>
                <div className="font-semibold text-sm">Current Account</div>
                <div className="text-xs text-muted-foreground">XXXX XXXX 3842</div>
              </div>
            </div>

            <div className="divide-y divide-border mt-4">
              {[
                ["Amount", `₹${formattedAmount}`],
                ["Payment Mode", search.mode],
                ["Transaction Remarks", search.remarks || "—"],
                ["Charges", "₹0.00"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground font-medium">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-3 text-sm">
                <span className="text-foreground font-semibold">Total Debit</span>
                <span className="text-foreground font-bold">₹{formattedAmount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-bold">OTP Verification</h2>
            </div>
            <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to your registered mobile number ending with XXX87.</p>

            <div className="flex gap-2 justify-between mt-5">
              {otp.map((v, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={v}
                  onChange={(e) => set(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  onPaste={onPaste}
                  inputMode="numeric"
                  maxLength={1}
                  className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className={`font-medium ${timerColor}`}>
                {seconds > 0 ? `OTP expires in ${mm}:${ss}` : "OTP expired"}
              </span>
              <button
                disabled={seconds > 0}
                onClick={() => { setSeconds(55); setOtp(["", "", "", "", "", ""]); }}
                className="font-semibold text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline disabled:no-underline"
              >
                Resend OTP
              </button>
            </div>

            <motion.button
              whileHover={{ scale: filled ? 1.01 : 1 }}
              whileTap={{ scale: filled ? 0.98 : 1 }}
              disabled={!filled}
              onClick={() => setModal(true)}
              className="w-full mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Proceed
            </motion.button>

            <div className="mt-4 bg-accent/30 border border-accent rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Do not share your OTP with anyone. Slice Bank will never ask for your OTP, password or PIN.
              </p>
            </div>
          </div>
        </div>
      </div>

      <InfoModal
        open={modal}
        onClose={() => { setModal(false); navigate({ to: "/transfers" }); }}
        title="Transaction Unable To Process"
        message="We are unable to process this transaction through internet banking at the moment. Please try again later."
        cta="Okay"
        variant="warning"
      />
    </DashboardLayout>
  );
}
