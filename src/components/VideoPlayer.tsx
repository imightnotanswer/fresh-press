"use client";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type Props = {
  url: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean;
};

export default function VideoPlayer({
  url,
  width = "100%",
  height = "100%",
  controls = true,
}: Props) {
  return (
    <div className="relative aspect-video">
      <ReactPlayer
        url={url}
        width={width}
        height={height}
        controls={controls}
        // keep Vimeo config if you use it; YouTube params go in the URL
        config={{ vimeo: { playerOptions: { responsive: true } } }}
      />
    </div>
  );
}
