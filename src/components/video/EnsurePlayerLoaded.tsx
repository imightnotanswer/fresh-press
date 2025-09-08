"use client";

import { useEffect } from "react";
import { useGlobalPlayer } from "./ReactPlayerProvider";

export default function EnsurePlayerLoaded({ url, autoplay = false }: { url: string; autoplay?: boolean }) {
  const player = useGlobalPlayer();

  useEffect(() => {
    if (!url) return;
    if (player.url !== url) {
      player.load(url);
    }
    if (autoplay) {
      player.play();
    }
  }, [url]);

  return null;
}


