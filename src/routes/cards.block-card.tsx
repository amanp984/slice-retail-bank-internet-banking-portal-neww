import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/cards/block-card")({
  head: () => ({ meta: [{ title: "Block Card — Slice Bank" }, { name: "description", content: "Block Card in the Slice Bank test environment." }, { property: "og:title", content: "Block Card — Slice Bank" }, { property: "og:description", content: "Block Card in the Slice Bank test environment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: BlockCard,
});

function BlockCard() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [reason, setReason] = useState("lost");
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();

  const setDigit = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = ch;
    setOtp(next);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      e.preventDefault();
      const next = [...otp];
      for (let i = 0; i < 6; i++) next[i] = text[i] || "";
      setOtp(next);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
  };

  const submit = () => {
    if (otp.join("").length !== 6) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setDone(true); }, 1400);
  };

  return (
    <DashboardLayout>
      <Link to="/cards" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Cards
      </Link>
      <h1 className="text-2xl font-bold">Block Debit Card</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Verify with OTP to immediately block your card. This action cannot be undone.</p>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8 bg-card rounded-2xl border border-border shadow-sm p-7">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive text-sm">Security Warning</div>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                Blocking your card will instantly disable all transactions including online, ATM and POS. A replacement card can be requested after blocking.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-foreground mb-2">Card to be blocked</div>
            <div className="rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Visa Platinum Debit</div>
                <div className="font-semibold tracking-widest mt-1">**** **** **** 5678</div>
              </div>
              <Lock className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-foreground mb-2">Reason for blocking</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { k: "lost", l: "Card Lost" },
                { k: "stolen", l: "Card Stolen" },
                { k: "fraud", l: "Suspicious Activity" },
                { k: "damaged", l: "Damaged" },
              ].map((r) => (
                <button key={r.k} onClick={() => setReason(r.k)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition ${reason === r.k ? "border-primary bg-accent text-primary" : "border-border hover:border-primary/40"}`}>
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-foreground">Enter OTP</div>
            <p className="text-xs text-muted-foreground mt-1">A 6-digit OTP has been sent to your registered mobile ending with •••• 4521</p>
            <div className="mt-3 flex gap-2.5" onPaste={onPaste}>
              {otp.map((v, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" maxLength={1}
                  value={v}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus(); }}
                  className="w-12 h-14 text-center text-xl font-bold border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition" />
              ))}
            </div>
            <button className="text-xs text-primary font-semibold mt-3 hover:underline">Resend OTP in 00:30</button>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <Link to="/cards" className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary">Cancel</Link>
            <button onClick={submit} disabled={otp.join("").length !== 6 || verifying}
              className="px-5 py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {verifying ? "Verifying…" : <><ShieldCheck className="w-4 h-4" /> Verify & Block Card</>}
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <h3 className="font-bold mb-3">What happens next?</h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li>• Card is blocked instantly across all channels</li>
              <li>• All scheduled payments on this card will fail</li>
              <li>• A replacement card can be requested from Cards page</li>
              <li>• Confirmation SMS will be sent to your registered number</li>
            </ul>
          </div>
          <div className="bg-accent/40 border border-accent rounded-2xl p-5">
            <h3 className="font-bold text-primary">24x7 Card Helpline</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">For urgent assistance, call our toll-free number anytime.</p>
            <div className="mt-3 text-sm font-semibold text-primary">1800 572 9999</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center px-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl shadow-2xl border border-border max-w-md w-full p-7 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 grid place-items-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold">Card Blocked Successfully</h3>
              <p className="text-sm text-muted-foreground mt-2">Your card ending 5678 has been blocked. Reference ID: <span className="font-semibold text-foreground">BLK{Date.now().toString().slice(-8)}</span></p>
              <button onClick={() => nav({ to: "/cards" })}
                className="mt-6 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                Back to Cards
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
