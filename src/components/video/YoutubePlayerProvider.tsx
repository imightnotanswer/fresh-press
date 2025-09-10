"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type YTCtx = {
    load: (videoId: string) => Promise<void>;
    play: () => void;
    pause: () => void;
    seek: (t: number) => void;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    videoId?: string;
    setDockTarget: (el: HTMLElement | null) => void;
};

declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
        YT: any;
    }
}

const Ctx = createContext<YTCtx | null>(null);
export const useYoutubePlayer = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("useYoutubePlayer must be used within <YoutubePlayerProvider>");
    return v;
};

function loadYTApi(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    if ((window as any).YT && (window as any).YT.Player) return Promise.resolve();

    return new Promise<void>((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>("script[src*='youtube.com/iframe_api']");
        if (existing) {
            const done = () => resolve();
            if ((window as any).YT && (window as any).YT.Player) done();
            else window.onYouTubeIframeAPIReady = done;
            return;
        }
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        window.onYouTubeIframeAPIReady = () => resolve();
        document.head.appendChild(s);
    });
}

export function YoutubePlayerProvider({ children }: { children: React.ReactNode }) {
    const [dockTarget, setDockTarget] = useState<HTMLElement | null>(null);
    const playerRef = useRef<any | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [videoId, setVideoId] = useState<string | undefined>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Poll state from YT
    useEffect(() => {
        const i = setInterval(() => {
            const p = playerRef.current;
            if (!p || !(window as any).YT) return;
            try {
                setCurrentTime(p.getCurrentTime?.() ?? 0);
                setDuration(p.getDuration?.() ?? 0);
                setIsPlaying(p.getPlayerState?.() === (window as any).YT.PlayerState.PLAYING);
            } catch { }
        }, 250);
        return () => clearInterval(i);
    }, []);

    // Move iframe into current dock
    useEffect(() => {
        if (!dockTarget || !iframeRef.current) return;
        if (iframeRef.current.parentElement === dockTarget) return;
        dockTarget.innerHTML = "";
        dockTarget.appendChild(iframeRef.current);
        try { playerRef.current?.playVideo?.(); } catch { }
    }, [dockTarget]);

    async function ensurePlayer() {
        if (playerRef.current) return;
        await loadYTApi();

        const host = document.createElement("div");
        host.style.position = "fixed";
        host.style.left = "-99999px";
        host.style.top = "-99999px";
        document.body.appendChild(host);

        playerRef.current = new (window as any).YT.Player(host, {
            width: "100%",
            height: "100%",
            playerVars: {
                autoplay: 0,
                controls: 1,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                origin: typeof window !== "undefined" ? window.location.origin : undefined,
            },
            events: {
                onReady: () => {
                    const iframe: HTMLIFrameElement = playerRef.current.getIframe();
                    iframe.style.width = "100%";
                    iframe.style.height = "100%";
                    iframe.style.display = "block";
                    iframeRef.current = iframe;
                    if (dockTarget) {
                        dockTarget.innerHTML = "";
                        dockTarget.appendChild(iframe);
                    }
                },
            },
        });
    }

    const load = async (id: string) => {
        await ensurePlayer();
        setVideoId(id);
        const p = playerRef.current;
        if (!p) return;
        try {
            const curId = p.getVideoData?.().video_id;
            if (curId !== id) p.cueVideoById({ videoId: id });
        } catch {
            p.cueVideoById({ videoId: id });
        }
    };
    const play = () => { try { playerRef.current?.playVideo?.(); } catch { } };
    const pause = () => { try { playerRef.current?.pauseVideo?.(); } catch { } };
    const seek = (t: number) => { try { playerRef.current?.seekTo?.(Math.max(0, t), true); } catch { } };

    const value: YTCtx = {
        load, play, pause, seek,
        isPlaying, currentTime, duration,
        videoId, setDockTarget,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}



