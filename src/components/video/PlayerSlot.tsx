"use client";

import React, { useEffect, useRef } from "react";
import { useYoutubePlayer } from "./YoutubePlayerProvider";

export function PlayerSlot({ className = "" }: { className?: string }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { setDockTarget } = useYoutubePlayer();

    useEffect(() => {
        setDockTarget(ref.current);
        return () => setDockTarget(null);
    }, [setDockTarget]);

    return <div ref={ref} className={className} />;
}



