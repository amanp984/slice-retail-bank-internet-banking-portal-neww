import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const INACTIVITY_MS = 3 * 60 * 1000;
const AUTH_KEYS = ["slice_auth", "slice_login_at"];

function clearSession() {
  try {
    AUTH_KEYS.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

/**
 * Frontend-only security layer:
 *  - Auto-logout on page refresh (sessionStorage cleared via beforeunload)
 *  - Auto-logout after 3 minutes of inactivity
 *  - Disables right-click context menu
 *  - Blocks common devtools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 */
export function SecurityGuard() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Logout on refresh / tab close
  useEffect(() => {
    const onUnload = () => clearSession();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Inactivity auto-logout (only on authenticated routes)
  useEffect(() => {
    const isAuthRoute = !["/", "/signup", "/forgot-username", "/forgot-password", "/terms-and-conditions"].includes(pathname);
    if (!isAuthRoute) return;

    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearSession();
        window.location.replace("/");
      }, INACTIVITY_MS);
    };
    const events: Array<keyof WindowEventMap> = [
      "mousemove", "mousedown", "keydown", "scroll", "touchstart", "click", "wheel",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [pathname]);

  // Disable right click + inspect shortcuts
  useEffect(() => {
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      const key = (e.key ?? "").toLowerCase();
      if (e.key === "F12") { e.preventDefault(); return; }
      if (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && key === "u") { e.preventDefault(); return; }
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}