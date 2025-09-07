import Link from "next/link";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { MEDIA_BY_SLUG } from "@/lib/groq";
import Comments from "@/components/Comments";
import AuthButton from "@/components/AuthButton";
import Navigation from "@/components/Navigation";
import ReactPlayer from "react-player";

interface MediaPageProps {
    params: Promise<{
        slug: string;
    }>;
}

async function getMedia(slug: string) {
    try {
        const media = await sanity.fetch(MEDIA_BY_SLUG, { slug });
        return media;
    } catch (error) {
        console.error("Error fetching media:", error);
        return null;
    }
}

export default async function MediaPage({ params }: MediaPageProps) {
    const { slug } = await params;
    const media = await getMedia(slug);

    if (!media) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Video Player */}
                    {media.videoUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <ReactPlayer
                                url={media.videoUrl}
                                width="100%"
                                height="100%"
                                controls
                                config={{
                                    youtube: {
                                        // valid IFrame API params live directly under `youtube`
                                        rel: 0,
                                        modestbranding: 1,
                                        playsinline: 1,
                                        // controls: 1, // optional
                                    },
                                    vimeo: {
                                        playerOptions: { responsive: true }
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Media Content */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{media.title}</h1>
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


