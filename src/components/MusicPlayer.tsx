"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MusicPlayerProps {
    audioUrl: string;
    songTitle?: string;
    artistName: string;
    className?: string;
}

export default function MusicPlayer({ audioUrl, songTitle, artistName, className = "" }: MusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setIsExpanded(false);
        };

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("loadedmetadata", updateDuration);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
            audio.removeEventListener("loadedmetadata", updateDuration);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!isExpanded) {
            // First click: expand and play
            setIsExpanded(true);
            audio.play();
            setIsPlaying(true);
        } else {
            // Already expanded: just toggle play/pause
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(false);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`relative ${className}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Always visible player that expands */}
            <div className={`bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-xl w-full overflow-hidden ${isExpanded
                ? 'p-3'
                : 'p-2'
                }`} style={{
                    height: isExpanded ? 'auto' : '64px',
                    transition: 'height 500ms ease-out, padding 500ms ease-out'
                }}>
                {/* Always visible: Play button, title, artist */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={togglePlay}
                        className={`rounded-full bg-black/80 hover:bg-black text-white shadow-sm transition-all duration-200 ${isExpanded ? 'h-8 w-8 p-0' : 'h-10 w-10 p-0'
                            }`}
                    >
                        {isPlaying ? (
                            <Pause className={`${isExpanded ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                        ) : (
                            <Play className={`${isExpanded ? 'h-4 w-4 ml-0.5' : 'h-5 w-5 ml-0.5'} text-white`} />
                        )}
                    </Button>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">
                            {songTitle || "Track"}
                        </h3>
                        <p className="text-xs text-gray-600 font-medium truncate">{artistName}</p>
                    </div>

                    {/* Close button - only visible when expanded */}
                    {isExpanded && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsExpanded(false);
                                if (isPlaying) {
                                    audioRef.current?.pause();
                                    setIsPlaying(false);
                                }
                            }}
                            className="h-7 w-7 p-0 rounded-full hover:bg-gray-100/80"
                        >
                            <X className="h-3 w-3 text-gray-500" />
                        </Button>
                    )}
                </div>

                {/* Expanded content - only visible when expanded */}
                {isExpanded && (
                    <div className="mt-3 space-y-3">
                        {/* Progress Bar */}
                        <div>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-gray-200/60 rounded-lg appearance-none cursor-pointer progress-slider"
                                style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span className="font-medium">{formatTime(currentTime)}</span>
                                <span className="font-medium">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Volume Controls */}
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMute}
                                className="h-7 w-7 p-0 rounded-full bg-gray-100/60 hover:bg-gray-200/80 transition-all duration-200"
                            >
                                {isMuted ? (
                                    <VolumeX className="h-3 w-3 text-gray-600" />
                                ) : (
                                    <Volume2 className="h-3 w-3 text-gray-600" />
                                )}
                            </Button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-gray-200/60 rounded-lg appearance-none cursor-pointer volume-slider"
                            />
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .progress-slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }
                .progress-slider::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }
                .volume-slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }
                .volume-slider::-moz-range-thumb {
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #10b981;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }
            `}</style>
        </div>
    );
}