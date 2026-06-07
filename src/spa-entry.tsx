import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) throw new Error("#root element not found");

const root = createRoot(container);
const path = window.location.pathname;

if (path === "/" || path === "") {
  const { LoginPage } = await import("./components/LoginPage");
  root.render(
    <StrictMode>
      <LoginPage />
    </StrictMode>,
  );
} else {
  const [{ RouterProvider }, { getRouter }] = await Promise.all([
    import("@tanstack/react-router"),
    import("./router"),
  ]);
  root.render(
    <StrictMode>
      <RouterProvider router={getRouter()} />
    </StrictMode>,
  );
}