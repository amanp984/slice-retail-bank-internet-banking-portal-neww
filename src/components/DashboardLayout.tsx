import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Receipt, CreditCard,
  PiggyBank, Landmark, TrendingUp, Tag, UserCog, HelpCircle, LogOut,
  Bell, Mail, ShieldCheck, AlertTriangle, CheckCircle2, Info, X, Clock
} from "lucide-react";
import { type ReactNode, useState, useEffect, useRef } from "react";
import { RestrictionModal } from "./RestrictionModal";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { to: "/payments", label: "Payments", icon: Receipt },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/fixeddeposits", label: "Fixed Deposits", icon: PiggyBank },
  { to: "/loans", label: "Loans", icon: Landmark },
  { to: "/investments", label: "Investments", icon: TrendingUp, restricted: "invest" as const },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/profile", label: "Profile & Settings", icon: UserCog },
  { to: "/help", label: "Help & Support", icon: HelpCircle },
];

type ModalKind = null | "loan" | "fd" | "invest";

const messages = [
  { i: ShieldCheck, t: "Security Alert", d: "New device login detected from Mumbai.", ts: "2 min ago", color: "text-amber-600 bg-amber-50" },
  { i: Receipt, t: "Payment Successful", d: "Your electricity bill of ₹1,249 paid to TATA Power.", ts: "1 hour ago", color: "text-emerald-600 bg-emerald-50" },
  { i: ArrowLeftRight, t: "IMPS Transfer", d: "₹5,000 transferred to Rahul Sharma successfully.", ts: "Yesterday", color: "text-primary bg-accent" },
  { i: Info, t: "Statement Ready", d: "Your April 2024 account statement is now available.", ts: "2 days ago", color: "text-blue-600 bg-blue-50" },
];

const notifs = [
  { i: CheckCircle2, t: "Login successful", d: "Signed in from Chrome on Windows.", ts: "Just now", color: "text-emerald-600 bg-emerald-50", unread: true },
  { i: Receipt, t: "Bill Payment Confirmed", d: "Mobile recharge of ₹299 completed.", ts: "30 min ago", color: "text-primary bg-accent", unread: true },
  { i: AlertTriangle, t: "Unusual Activity", d: "A login attempt was blocked.", ts: "1 hour ago", color: "text-amber-600 bg-amber-50", unread: true },
  { i: Clock, t: "EMI Reminder", d: "Home loan EMI due on 5th June.", ts: "Today", color: "text-blue-600 bg-blue-50", unread: false },
  { i: Info, t: "New Offer", d: "Earn cashback on your next credit card spend.", ts: "Yesterday", color: "text-purple-600 bg-purple-50", unread: false },
];

function HeaderPanel({
  open, onClose, title, children, badge,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; badge?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 top-full mt-3 w-[360px] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
          style={{ transformOrigin: "top right" }}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm">{title}</h3>
              {badge && <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">{badge}</span>}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DashboardLayout({
  children, showGreeting = false,
}: { children: ReactNode; showGreeting?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalKind>(null);
  const [openPanel, setOpenPanel] = useState<null | "messages" | "notifs">(null);
  const [readSet, setReadSet] = useState<Set<number>>(new Set());
  const [lastLogin, setLastLogin] = useState<string>("");
  const unread = notifs.filter((_, i) => !readSet.has(i) && notifs[i].unread).length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("slice_auth")) {
      navigate({ to: "/" });
      return;
    }
    const iso =
      sessionStorage.getItem("slice_login_at") ||
      localStorage.getItem("slice_last_login_at");
    if (iso) {
      const d = new Date(iso);
      const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      setLastLogin(`${date}, ${time}`);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-[220px] bg-sidebar-gradient text-white flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="px-6 py-7">
          <div className="text-3xl font-bold tracking-tight italic">slice</div>
          <div className="text-xs tracking-[0.3em] font-semibold opacity-90 mt-0.5">BANK</div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
            const content = (
              <span className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${active ? "bg-white text-primary shadow-md" : "text-white/85 hover:bg-white/10 hover:text-white"}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {item.label}
              </span>
            );
            if (item.restricted) {
              return (
                <button key={item.to} onClick={() => setModal(item.restricted)} className="w-full text-left">
                  {content}
                </button>
              );
            }
            return <Link key={item.to} to={item.to} preload="intent">{content}</Link>;
          })}
        </nav>
        <div className="px-3 pb-6 pt-2 border-t border-white/10 mt-2">
          <Link to="/" onClick={() => { try { sessionStorage.removeItem("slice_auth"); } catch {} }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/85 hover:bg-white/10">
            <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} /> Log Out
          </Link>
          <div className="px-4 mt-6 text-xs text-white/60">© 2026 Slice Bank.<br/>All rights reserved.</div>
        </div>
      </aside>

      <main className="flex-1 ml-[220px]">
        <header className="px-8 pt-7 pb-4 flex items-start justify-between gap-6">
          <div>
            {showGreeting && (
              <>
                <h1 className="text-2xl font-bold text-foreground">Hello, ​AKASH TUFANI</h1>
                <p className="text-sm text-muted-foreground mt-1">Last login: {lastLogin || "—"}</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setOpenPanel(openPanel === "messages" ? null : "messages")}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition relative"
              >
                <Mail className="w-5 h-5" /> Messages
                <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-primary" />
              </button>
              <HeaderPanel open={openPanel === "messages"} onClose={() => setOpenPanel(null)} title="Messages" badge={`${messages.length} new`}>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                  {messages.map((m, i) => (
                    <div key={i} className="flex gap-3 px-5 py-4 hover:bg-secondary/40 transition cursor-pointer">
                      <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${m.color}`}>
                        <m.i className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm text-foreground truncate">{m.t}</div>
                          <div className="text-[10px] text-muted-foreground shrink-0">{m.ts}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-border bg-secondary/20 text-center">
                  <button className="text-xs font-semibold text-primary hover:underline">View All Messages</button>
                </div>
              </HeaderPanel>
            </div>

            <div className="relative">
              <button
                onClick={() => setOpenPanel(openPanel === "notifs" ? null : "notifs")}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition"
              >
                <Bell className="w-5 h-5" /> Notifications
                {unread > 0 && (
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unread}</span>
                )}
              </button>
              <HeaderPanel open={openPanel === "notifs"} onClose={() => setOpenPanel(null)} title="Notifications" badge={unread > 0 ? `${unread} unread` : undefined}>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
                  {notifs.map((n, i) => {
                    const isRead = readSet.has(i) || !n.unread;
                    return (
                      <div
                        key={i}
                        onClick={() => setReadSet((s) => new Set(s).add(i))}
                        className={`flex gap-3 px-5 py-4 hover:bg-secondary/40 transition cursor-pointer ${!isRead ? "bg-accent/20" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${n.color}`}>
                          <n.i className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm text-foreground truncate">{n.t}</div>
                              {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            </div>
                            <div className="text-[10px] text-muted-foreground shrink-0">{n.ts}</div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.d}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-border bg-secondary/20 flex items-center justify-between">
                  <button
                    onClick={() => setReadSet(new Set(notifs.map((_, i) => i)))}
                    className="text-xs font-semibold text-primary hover:underline"
                  >Mark all as read</button>
                  <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">View All</button>
                </div>
              </HeaderPanel>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent text-primary grid place-items-center font-semibold text-sm">AT</div>
            </div>
          </div>
        </header>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          className="px-8 pb-10">
          {children}
        </motion.div>
      </main>

      <RestrictionModal kind={modal} onClose={() => setModal(null)} />
    </div>
  );
}
