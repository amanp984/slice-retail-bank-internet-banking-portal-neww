import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  User, Lock, Keyboard, CheckCircle2, PiggyBank, Eye, EyeOff,
  RefreshCw, AlertTriangle, X, ShieldCheck, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Slice Bank Internet Banking" },
      { name: "description", content: "Secure internet banking login for Slice Bank customers." },
    ],
  }),
  component: LoginPage,
});

const VALID_USER = "356642873168";
const VALID_PASS = "Bhai@1985";
const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const makeCaptcha = () => {
  let s = "";
  for (let i = 0; i < 7; i++) s += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  return s;
};

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<null | { title: string; msg: string }>(null);

  const refreshCaptcha = useCallback(() => { setCaptchaCode(makeCaptcha()); setCaptcha(""); }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setCaptchaCode(makeCaptcha());
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleLogin = () => {
    if (loading) return;
    if (username !== VALID_USER || password !== VALID_PASS) {
      setError({
        title: "Authentication Failed",
        msg: "Invalid User ID or Password. Please verify your banking credentials and try again.",
      });
      refreshCaptcha();
      return;
    }
    if (captcha.trim() !== captchaCode) {
      setError({
        title: "CAPTCHA Verification Failed",
        msg: "Incorrect security CAPTCHA entered. Please enter the correct verification code.",
      });
      refreshCaptcha();
      return;
    }
    try {
      sessionStorage.setItem("slice_auth", "1");
      const now = new Date().toISOString();
      sessionStorage.setItem("slice_login_at", now);
      localStorage.setItem("slice_last_login_at", now);
    } catch {}
    setLoading(true);
    setShowSuccess(true);
    window.setTimeout(() => {
      navigate({ to: "/dashboard", replace: true });
    }, 900);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* Gray top strip */}
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
        {/* Left illustration */}
        <div className="relative bg-login-gradient overflow-hidden hidden lg:flex items-center justify-center">
          <FloatingBubbles />
          <div className="relative z-10 text-center px-10">
            <PiggyBank className="w-64 h-64 mx-auto text-white/90 drop-shadow-2xl" strokeWidth={1} />
            <h2 className="mt-4 text-3xl font-bold text-white drop-shadow">Secure Internet Banking</h2>
            <p className="mt-2 text-white/90 text-sm max-w-sm mx-auto">Bank with confidence. Anytime, anywhere.</p>
          </div>
        </div>

        {/* Right login */}
        <div className="flex items-center justify-center px-6 py-6 overflow-y-auto">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold text-destructive mb-6 tracking-wide">LOGIN</h1>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} autoComplete="off">
              <Field icon={<User className="w-4 h-4" />} label="User Name">
                <input
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="ENTER USER NAME" autoComplete="off"
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-muted-foreground/60 text-sm"
                />
              </Field>
              <p className="text-xs text-right mt-1 mb-3 text-muted-foreground">
                Forgot Username? <Link to="/forgot-username" className="text-destructive font-semibold hover:underline">Click Here</Link>
              </p>

              <Field icon={<Lock className="w-4 h-4" />} label="Password">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER PASSWORD" autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 rounded-md border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-muted-foreground/60 text-sm"
                  />
                  <button type="button" onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <p className="text-xs text-right mt-1 mb-3 text-muted-foreground">
                Forgot password? <Link to="/forgot-password" className="text-destructive font-semibold hover:underline">Click Here</Link>
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Keyboard className="w-4 h-4" /> Click to open the virtual keyboard
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 border border-border rounded-md py-2.5 grid place-items-center select-none relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 7px), repeating-linear-gradient(-30deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 5px)",
                    backgroundColor: "#f3f4f6",
                  }}>
                  <span className="text-xl font-bold italic tracking-[0.35em] text-foreground line-through decoration-2 select-none"
                    style={{ fontFamily: "Georgia, serif", textShadow: "1px 1px 0 rgba(0,0,0,0.08)" }}>
                    {captchaCode}
                  </span>
                </div>
                <button type="button" onClick={refreshCaptcha} title="Refresh CAPTCHA"
                  className="p-2.5 rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-destructive transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <input value={captcha} onChange={(e) => setCaptcha(e.target.value)}
                placeholder="Type the text shown above" autoComplete="off"
                className="w-full px-4 py-2.5 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm mb-4" />

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-md bg-destructive text-destructive-foreground font-semibold hover:brightness-110 active:scale-[0.99] transition shadow-soft mb-2.5 disabled:opacity-80 flex items-center justify-center gap-2">
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>) : "Login"}
              </button>
              <Link to="/signup"
                className="block text-center w-full py-2.5 rounded-md bg-destructive text-destructive-foreground font-semibold hover:brightness-110 transition shadow-soft">
                New User Sign Up
              </Link>
              <Link to="/terms-and-conditions" className="block text-center text-sm mt-4 text-destructive font-medium underline">Terms and Conditions</Link>
            </form>
          </div>
        </div>
      </div>

      <footer className="bg-destructive text-destructive-foreground text-center text-xs py-2 shrink-0">
        © 2026 North East Small Finance Bank. All Rights Reserved · BUILD VERSION: V2
      </footer>

      {/* Error popup */}
      {error && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4"
          onClick={() => setError(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl border border-border max-w-sm w-full overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="font-bold text-foreground text-sm">{error.title}</h3>
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-secondary rounded">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm text-foreground/80 leading-relaxed">{error.msg}</p>
                <div className="mt-5 flex justify-end">
                  <button onClick={() => setError(null)}
                    className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 transition">
                    OK, Try Again
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Success toast (bottom-right, dark banking style) */}
      {showSuccess && (
        <div
          className="fixed bottom-6 right-6 z-50 overflow-hidden rounded-xl flex items-center gap-3 pl-4 pr-5 py-3 min-w-[260px] max-w-xs"
            style={{
              background: "linear-gradient(180deg, #1a1d24 0%, #0f1115 100%)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), 0 0 30px rgba(34,197,94,0.12)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full grid place-items-center shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
            </div>
            <div className="text-sm font-medium text-white tracking-tight">Login successfully</div>
            <div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{
                background: "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)",
                boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                width: "100%",
              }}
            />
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
        <span className="text-muted-foreground">{icon}</span>{label}
      </div>
      {children}
    </div>
  );
}

/**
 * Decorative animated bubbles. Only mounts on viewports >= 1024px to avoid
 * running 8 infinite framer-motion RAF loops on mobile, which previously
 * saturated the main thread and froze the UI (buttons/inputs unresponsive).
 */
function FloatingBubbles() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  if (!enabled) return null;
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 backdrop-blur-sm"
          style={{
            width: 40 + i * 20, height: 40 + i * 20,
            left: `${(i * 13) % 80}%`, top: `${(i * 17) % 70}%`,
          }}
        />
      ))}
    </>
  );
}
