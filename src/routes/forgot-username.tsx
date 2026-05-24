import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Phone, Calendar, RefreshCw, CheckCircle2, ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/forgot-username")({
  head: () => ({
    meta: [
      { title: "Forgot Username — Slice Retail" },
      { name: "description", content: "Recover your Slice Retail platform username." },
    ],
  }),
  component: ForgotUsernamePage,
});

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCaptcha = () => Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

function ForgotUsernamePage() {
  const [card, setCard] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(() => { setCode(makeCaptcha()); setCaptcha(""); }, []);
  useEffect(() => { setCode(makeCaptcha()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!card || !mobile || !dob) return setErr("Please fill in all required fields.");
    if (captcha.trim() !== code) { setErr("Incorrect verification code."); refresh(); return; }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <header className="border-b border-border bg-white px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-destructive transition">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <span className="h-6 w-px bg-border" />
        <span className="text-xl font-bold italic tracking-tight text-primary">slice</span>
        <div className="ml-auto text-[11px] text-muted-foreground hidden md:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> Secured by 256-bit TLS
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-card border border-border overflow-hidden">
          <div className="bg-destructive/10 px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground grid place-items-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Recover Username</h1>
                <p className="text-xs text-muted-foreground">Verify your details to retrieve your username</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field icon={<CreditCard className="w-4 h-4" />} label="Debit Card Number">
              <input value={card} onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, ""))} maxLength={19}
                placeholder="XXXX XXXX XXXX XXXX" inputMode="numeric"
                className="w-full px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm" />
            </Field>
            <Field icon={<Phone className="w-4 h-4" />} label="Registered Mobile Number">
              <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} maxLength={10}
                placeholder="10-digit mobile number" inputMode="numeric"
                className="w-full px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm" />
            </Field>
            <Field icon={<Calendar className="w-4 h-4" />} label="Date of Birth">
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm" />
            </Field>

            <div>
              <div className="text-sm font-medium text-foreground mb-1.5">Verification Code</div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 border border-border rounded-md py-2.5 grid place-items-center select-none"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 7px)", backgroundColor: "#f3f4f6" }}>
                  <span className="text-lg font-bold italic tracking-[0.35em] text-foreground line-through decoration-2"
                    style={{ fontFamily: "Georgia, serif" }}>{code}</span>
                </div>
                <button type="button" onClick={refresh}
                  className="p-2.5 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-destructive transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="Type the code above"
                className="w-full px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
            </div>

            {err && <p className="text-sm text-destructive">{err}</p>}

            <button type="submit"
              className="w-full py-2.5 rounded-md bg-destructive text-destructive-foreground font-semibold hover:brightness-110 active:scale-[0.99] transition shadow-soft">
              Submit Request
            </button>
            <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-destructive">Cancel and return to login</Link>
          </form>
        </motion.div>
      </main>

      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.92, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-white rounded-xl shadow-2xl border border-border max-w-sm w-full p-6 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-success/15 grid place-items-center mb-3">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-bold text-foreground">Request Submitted</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your username recovery request has been submitted successfully.
              </p>
              <Link to="/" className="mt-5 inline-block px-5 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110">
                Back to Login
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
        <span className="text-muted-foreground">{icon}</span>{label}
      </div>
      {children}
    </div>
  );
}