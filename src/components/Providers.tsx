"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { ReactPlayerProvider } from "@/components/video/ReactPlayerProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReactPlayerProvider>
        {children}
        <Toaster />
      </ReactPlayerProvider>
    </SessionProvider>
  );
}

