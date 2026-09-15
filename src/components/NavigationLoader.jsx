"use client";
import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

const NavigationContext = createContext(null);
export const useSidebarNavigation = () => useContext(NavigationContext);

export default function NavigationProvider({ children }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const navigate = (href) => startTransition(() => router.push(href));
  return (
    <NavigationContext.Provider value={navigate}>
      {children}
      {isPending && (
        <div role="status" aria-live="polite" style={{ position: "fixed", top: 82, left: "50%", transform: "translateX(-50%)", zIndex: 10000, display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", background: "#fff", color: "#c94d00", border: "1px solid #ffcfad", borderRadius: 10, boxShadow: "0 4px 20px #0002", pointerEvents: "none" }}>
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          Loading page...
        </div>
      )}
    </NavigationContext.Provider>
  );
}
