"use client";

import React, { useEffect, useRef } from "react";
import { useGlobalPlayer } from "./ReactPlayerProvider";

export default function PlayerDock({ className = "" }: { className?: string }) {
    const player = useGlobalPlayer();
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (ref.current) player.setDockTarget(ref.current);
        return () => {
            // only clear the dock if we're still using this target
            player.setDockTarget(null);
        };
    }, [player]);

    return <div ref={ref} className={className} />;
}


