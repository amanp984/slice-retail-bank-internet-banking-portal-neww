import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, ShieldCheck, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "New User Sign Up — Slice Bank" },
      { name: "description", content: "Register for Slice Bank internet banking." },
    { property: "og:title", content: "New User Sign Up — Slice Bank" }, { property: "og:description", content: "Register for Slice Bank internet banking." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    mode: "Debit Card", customerId: "", cardNumber: "", expiry: "", username: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 1800);
    }, 1100);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      <header className="border-b border-border bg-secondary/70 px-6 py-3 flex items-center gap-5 shrink-0">
        <span className="text-2xl font-bold italic tracking-tight text-primary">slice</span>
        <span className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-destructive text-destructive-foreground grid place-items-center text-xs font-bold shadow-soft">N</div>
          <div className="leading-tight">
            <div className="text-[11px] font-bold text-destructive">North East</div>
            <div className="text-[11px] font-bold text-destructive">Small Finance Bank</div>
          </div>
        </div>
        <div className="ml-auto text-[11px] text-muted-foreground hidden md:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> Secured by 256-bit TLS
        </div>
      </header>

      <div className="flex-1 min-h-0 grid lg:grid-cols-[1.4fr_1fr]">
        <div className="relative bg-login-gradient overflow-hidden hidden lg:flex items-center justify-center">
          {[...Array(8)].map((_, i) => (
            <motion.div key={i}
              className="absolute rounded-full bg-white/20 backdrop-blur-sm"
              style={{ width: 40 + i * 20, height: 40 + i * 20, left: `${(i * 13) % 80}%`, top: `${(i * 17) % 70}%` }}
              animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }} className="relative z-10 text-center px-10">
            <PiggyBank className="w-64 h-64 mx-auto text-white/90 drop-shadow-2xl" strokeWidth={1} />
            <h2 className="mt-4 text-3xl font-bold text-white drop-shadow">Open Your Banking Account</h2>
            <p className="mt-2 text-white/90 text-sm max-w-sm mx-auto">Quick registration. Begin in minutes.</p>
          </motion.div>
        </div>

        <div className="flex items-center justify-center px-6 py-6 overflow-y-auto">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-destructive mb-1 tracking-wide">NEW USER SIGN UP</h1>
            <p className="text-xs text-muted-foreground mb-5">Register your internet banking access</p>

            <form onSubmit={onSubmit} autoComplete="off" className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Registration Mode</label>
                <select value={form.mode} onChange={upd("mode")}
                  className="mt-1 w-full px-3 py-2.5 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option>Debit Card</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Customer ID</label>
                <input value={form.customerId} onChange={upd("customerId")} required
                  placeholder="Enter Customer ID"
                  className="mt-1 w-full px-3 py-2.5 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Debit Card Number</label>
                <input value={form.cardNumber} onChange={upd("cardNumber")} required maxLength={19}
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="mt-1 w-full px-3 py-2.5 rounded-md border border-border text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                <input value={form.expiry} onChange={upd("expiry")} required placeholder="MM/YY" maxLength={5}
                  className="mt-1 w-full px-3 py-2.5 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Login Username</label>
                <input value={form.username} onChange={upd("username")} required
                  placeholder="Choose a username"
                  className="mt-1 w-full px-3 py-2.5 rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-md bg-destructive text-destructive-foreground font-semibold hover:brightness-110 active:scale-[0.99] transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-80">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>) : "Submit"}
              </button>

              <Link to="/" className="flex items-center justify-center gap-1.5 text-sm font-medium text-destructive hover:underline mt-2">
                <ArrowLeft className="w-4 h-4" /> Go back to Sign-in
              </Link>
            </form>
          </motion.div>
        </div>
      </div>

      <footer className="bg-destructive text-destructive-foreground text-center text-xs py-2 shrink-0">
        © 2026 North East Small Finance Bank. All Rights Reserved
      </footer>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-xl border border-border shadow-2xl px-4 py-3 flex items-center gap-3 max-w-xs">
            <div className="w-10 h-10 rounded-full grid place-items-center" style={{ backgroundColor: "color-mix(in oklab, var(--success) 18%, white)" }}>
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--success)" }} />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Registration Submitted</div>
              <div className="text-[11px] text-muted-foreground">Redirecting to login…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
