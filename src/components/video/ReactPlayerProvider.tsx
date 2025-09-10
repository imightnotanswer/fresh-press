"use client";

import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic<any>(() => import("react-player"), { ssr: false });

type PlayerContextValue = {
    load: (url: string) => void;
    play: () => void;
    pause: () => void;
    seek: (seconds: number) => void;
    setDockTarget: (el: HTMLElement | null) => void;
    url?: string;
    isPlaying: boolean;
    currentTime: number;
    volume: number; // 0-1
};

const PlayerContext = createContext<PlayerContextValue | null>(null);
export const useGlobalPlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error("useGlobalPlayer must be used within ReactPlayerProvider");
    return ctx;
};

export function ReactPlayerProvider({ children }: { children: React.ReactNode }) {
    const [dockTarget, setDockTarget] = useState<HTMLElement | null>(null);
    const [url, setUrl] = useState<string | undefined>(undefined);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const hostRef = useRef<HTMLDivElement | null>(null);

    // control refs to call player methods
    const playerRef = useRef<any>(null);

    const load = (u: string) => {
        setUrl(u);
    };
    const play = () => setIsPlaying(true);
    const pause = () => setIsPlaying(false);
    const seek = (seconds: number) => {
        try {
            playerRef.current?.seekTo?.(seconds, "seconds");
        } catch { }
    };

    const ctxValue: PlayerContextValue = useMemo(
        () => ({ load, play, pause, seek, setDockTarget, url, isPlaying, currentTime, volume }),
        [url, isPlaying, currentTime, volume]
    );

    const playerNode = (
        <div ref={hostRef} style={{ width: "100%", height: "100%" }}>
            <ReactPlayer
                ref={playerRef}
                url={url}
                playing={isPlaying}
                controls
                width="100%"
                height="100%"
                onProgress={(p: any) => {
                    if (typeof p.playedSeconds === "number") setCurrentTime(p.playedSeconds);
                }}
                onDuration={(d: number) => {
                    // no-op but keeps internal state correct
                }}
                onReady={() => {
                    try {
                        const v = playerRef.current?.getInternalPlayer?.()?.getVolume?.();
                        if (typeof v === "number") setVolume(v / 100);
                    } catch { }
                }}
            />
        </div>
    );

    return (
        <PlayerContext.Provider value={ctxValue}>
            {children}
            {dockTarget ? createPortal(playerNode, dockTarget) : null}
        </PlayerContext.Provider>
    );
}



