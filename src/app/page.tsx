import Link from "next/link";
import { sanity } from "@/lib/sanity";
import { ALL_REVIEWS, ALL_MEDIA } from "@/lib/groq";
import ReviewCard from "@/components/ReviewCard";
import MediaCard from "@/components/MediaCard";

async function getRecentReviews() {
  try {
    if (!sanity) {
      console.error("Sanity client not configured");
      return [];
    }
    const data = await sanity.fetch(ALL_REVIEWS);
    return data || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

async function getRecentMedia() {
  try {
    if (!sanity) {
      console.error("Sanity client not configured");
      return [];
    }
    const data = await sanity.fetch(ALL_MEDIA);
    return data || [];
  } catch (error) {
    console.error("Error fetching media:", error);
    return [];
  }
}

export default async function Home() {
  const [reviews, media] = await Promise.all([
    getRecentReviews(),
    getRecentMedia()
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation removed: now mounted in root layout */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-16 text-center md:text-left">
          <h1 className="cutting-edge-section-title">Latest Music</h1>
          <p className="cutting-edge-section-subtitle">Reviews, videos, and more from the music world</p>
        </div>

        {/* Recent Reviews Section */}
        <section className="mb-20">
          <div className="flex flex-col items-center gap-3 mb-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="cutting-edge-section-title">Recent Reviews</h2>
              <p className="cutting-edge-section-subtitle">Latest music reviews and critiques</p>
            </div>
            <Link
              href="/reviews"
              className="cutting-edge-button-outline"
            >
              View all reviews
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No reviews yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {reviews.slice(0, 4).map((review: any) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Media Section */}
        <section>
          <div className="flex flex-col items-center gap-3 mb-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="cutting-edge-section-title">Recent Media</h2>
              <p className="cutting-edge-section-subtitle">Latest videos, podcasts, and media content</p>
            </div>
            <Link
              href="/media"
              className="cutting-edge-button-outline"
            >
              View all media
            </Link>
          </div>

          {media.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No media content yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {media.slice(0, 4).map((mediaItem: any) => (
                <MediaCard key={mediaItem._id} media={mediaItem} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
