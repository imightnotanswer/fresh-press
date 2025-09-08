import Link from "next/link";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { MEDIA_BY_SLUG } from "@/lib/groq";
import Comments from "@/components/Comments";
import AuthButton from "@/components/AuthButton";
import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";
import Image from "next/image";
import { PlayerSlot } from "@/components/video/PlayerSlot";
import { getYouTubeId } from "@/lib/youtube";
import LikeButton from "@/components/LikeButton";

interface MediaPageProps {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}

async function getMedia(slug: string) {
    try {
        if (!sanity) {
            console.error("Sanity client not configured");
            return null;
        }
        const media = await sanity.fetch(MEDIA_BY_SLUG, { slug });
        return media;
    } catch (error) {
        console.error("Error fetching media:", error);
        return null;
    }
}

export default async function MediaPage({ params, searchParams }: MediaPageProps) {
    const { slug } = params;
    const sp = searchParams;
    const media = await getMedia(slug);

    if (!media) {
        notFound();
    }

    // Read search params (?t=, ?v=) directly and pass through to the player URL
    let playerUrl = media.videoUrl as string;
    const tParam = (sp?.["t"] as string | undefined) ?? undefined;
    const vParam = (sp?.["v"] as string | undefined) ?? (sp?.["vol"] as string | undefined) ?? undefined;
    if (tParam) {
        const sep = playerUrl.includes('?') ? '&' : '?';
        playerUrl = `${playerUrl}${sep}t=${encodeURIComponent(tParam)}`;
    }
    if (vParam) {
        const sep = playerUrl.includes('?') ? '&' : '?';
        playerUrl = `${playerUrl}${sep}v=${encodeURIComponent(vParam)}`;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Dock the persistent YouTube iframe if available; fallback to standard player */}
                    {media.videoUrl && (
                        <div className="bg-black rounded-lg overflow-hidden">
                            {getYouTubeId(media.videoUrl) ? (
                                <PlayerSlot className="relative aspect-video" />
                            ) : (
                                <VideoPlayer url={playerUrl} />
                            )}
                        </div>
                    )}

                    {/* Media Content */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{media.title}</h1>
                                <LikeButton postId={media._id} postType="media" />
                            </div>
                            <p className="text-xl text-gray-600 mb-4">
                                by{" "}
                                <Link
                                    href={`/artists/${media.artist.slug.current}`}
                                    className="hover:underline"
                                >
                                    {media.artist.name}
                                </Link>
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(media.publishedAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Description */}
                        {media.description && (
                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-700 leading-relaxed">{media.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Comments */}
                    <Comments postType="media" postId={media._id} />
                </div>
            </main>
        </div>
    );
}


