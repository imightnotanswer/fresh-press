import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { REVIEW_BY_SLUG, RELATED_BY_ARTIST } from "@/lib/groq";
import PortableTextRenderer from "@/components/PortableTextRenderer";
import Comments from "@/components/Comments";
import AuthButton from "@/components/AuthButton";
import Navigation from "@/components/Navigation";
import ReviewContent from "@/components/ReviewContent";
import ClickableImage from "@/components/ClickableImage";


interface ReviewPageProps {
    params: {
        slug: string;
    };
}

async function getReview(slug: string) {
    try {
        const review = await sanity.fetch(REVIEW_BY_SLUG, { slug });
        return review;
    } catch (error) {
        console.error("Error fetching review:", error);
        return null;
    }
}

async function getRelatedReviews(artistId: string) {
    try {
        const reviews = await sanity.fetch(RELATED_BY_ARTIST, { artistId });
        return reviews || [];
    } catch (error) {
        console.error("Error fetching related reviews:", error);
        return [];
    }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
    const { slug } = await params;
    const review = await getReview(slug);

    if (!review) {
        notFound();
    }


    const relatedReviews = await getRelatedReviews(review.artist._id);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Cover Image - Clickable to Album Link */}
                        {review.cover?.asset?.url && (
                            <div className="aspect-square max-w-md mx-auto lg:mx-0">
                                <ClickableImage
                                    src={review.cover.asset.url}
                                    alt={`${review.artist.name} - ${review.title}`}
                                    className="w-full h-full object-cover rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                    href={review.albumUrl}
                                />
                            </div>
                        )}

                        {/* Review Content */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{review.title}</h1>
                                <p className="text-xl text-gray-600 mb-4">
                                    by{" "}
                                    <Link
                                        href={`/artists/${review.artist.slug.current}`}
                                        className="hover:underline"
                                    >
                                        {review.artist.name}
                                    </Link>
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(review.publishedAt).toLocaleDateString()}
                                </p>
                            </div>


                            {/* Seamless Review Reading */}
                            {review.body && (
                                <ReviewContent content={review.body} maxPreviewLength={300} />
                            )}

                        </div>

                        {/* Comments */}
                        <Comments postType="review" postId={review._id} />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Related Reviews */}
                        {relatedReviews.length > 0 && (
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    More by {review.artist.name}
                                </h3>
                                <div className="space-y-3">
                                    {relatedReviews.map((related: any) => (
                                        <Link
                                            key={related._id}
                                            href={`/reviews/${related.slug.current}`}
                                            className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <h4 className="font-medium text-gray-900">{related.title}</h4>
                                            <p className="text-sm text-gray-500">
                                                {related.releaseDate
                                                    ? new Date(related.releaseDate).toLocaleDateString()
                                                    : ''
                                                }
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}


