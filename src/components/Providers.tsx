"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Scroll to top on route change
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}

