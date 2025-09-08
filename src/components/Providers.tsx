"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { YoutubePlayerProvider } from "@/components/video/YoutubePlayerProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <YoutubePlayerProvider>
        {children}
        <Toaster />
      </YoutubePlayerProvider>
    </SessionProvider>
  );
}

