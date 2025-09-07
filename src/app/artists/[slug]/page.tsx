import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { ARTIST_BY_SLUG, ARTIST_CONTENT } from "@/lib/groq";
import ReviewCard from "@/components/ReviewCard";
import MediaCard from "@/components/MediaCard";
import AuthButton from "@/components/AuthButton";
import Navigation from "@/components/Navigation";

interface ArtistPageProps {
    params: {
        slug: string;
    };
}

async function getArtist(slug: string) {
    try {
        const artist = await sanity.fetch(ARTIST_BY_SLUG, { slug });
        return artist;
    } catch (error) {
        console.error("Error fetching artist:", error);
        return null;
    }
}

async function getArtistContent(artistId: string) {
    try {
        const content = await sanity.fetch(ARTIST_CONTENT, { artistId });
        return content || [];
    } catch (error) {
        console.error("Error fetching artist content:", error);
        return [];
    }
}

export default async function ArtistPage({ params }: ArtistPageProps) {
    const { slug } = await params;
    const artist = await getArtist(slug);

    if (!artist) {
        notFound();
    }

    const content = await getArtistContent(artist._id);
    const reviews = content.filter((item: any) => item._type === "review");
    const media = content.filter((item: any) => item._type === "media");

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Artist Header */}
                <div className="bg-white rounded-lg p-8 shadow-sm mb-8">
                    <div className="flex items-start space-x-6">
                        {artist.image?.asset?.url && (
                            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={artist.image.asset.url}
                                    alt={artist.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{artist.name}</h1>
                            {artist.website && (
                                <a
                                    href={artist.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors mb-4"
                                >
                                    Visit Website
                                </a>
                            )}
                            <div className="text-sm text-gray-500">
                                <p>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                                <p>{media.length} video{media.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {content.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No content for this artist yet.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Reviews */}
                        {reviews.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {reviews.map((review: any) => (
                                        <ReviewCard key={review._id} review={review} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Media */}
                        {media.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Videos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {media.map((item: any) => (
                                        <MediaCard key={item._id} media={item} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}


