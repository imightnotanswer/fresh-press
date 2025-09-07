import Navigation from "@/components/Navigation";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <Navigation />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="cutting-edge-section-title text-4xl md:text-5xl mb-4">
                        Contact Us
                    </h1>
                    <p className="cutting-edge-section-subtitle text-lg">
                        Get in touch with the Fresh Press team
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Review Requests */}
                    <div className="cutting-edge-card p-8">
                        <h2 className="cutting-edge-title text-2xl mb-4">
                            Want Your Music Reviewed?
                        </h2>
                        <p className="cutting-edge-blurb mb-6">
                            We&apos;re always looking for fresh, exciting music to feature on Fresh Press.
                            If you&apos;re an artist, band, or label with new music you&apos;d like us to consider for review,
                            we&apos;d love to hear from you.
                        </p>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Send us your music:</h3>
                            <p className="text-gray-700 mb-2">
                                <strong>Email:</strong> submissions@freshlypressed.com
                            </p>
                            <p className="text-sm text-gray-600">
                                Please include your artist name, track/album title, and a brief description.
                                We&apos;ll review all submissions and get back to you if we&apos;re interested in featuring your work.
                            </p>
                        </div>
                    </div>

                    {/* General Contact */}
                    <div className="cutting-edge-card p-8">
                        <h2 className="cutting-edge-title text-2xl mb-4">
                            General Inquiries
                        </h2>
                        <p className="cutting-edge-blurb mb-6">
                            Have a question, suggestion, or just want to say hello?
                            We&apos;d love to hear from you.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Press & Media</h3>
                                <p className="text-gray-700">press@freshlypressed.com</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Partnerships</h3>
                                <p className="text-gray-700">partnerships@freshlypressed.com</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">General Questions</h3>
                                <p className="text-gray-700">hello@freshlypressed.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-16 text-center">
                    <div className="cutting-edge-card p-8 max-w-2xl mx-auto">
                        <h2 className="cutting-edge-title text-2xl mb-4">
                            What We're Looking For
                        </h2>
                        <p className="cutting-edge-blurb mb-6">
                            We focus on independent artists, emerging talent, and music that pushes boundaries.
                            While we can&apos;t review everything, we&apos;re particularly interested in:
                        </p>
                        <ul className="text-left space-y-2 text-gray-700">
                            <li>• Original, innovative music across all genres</li>
                            <li>• High-quality production and thoughtful songwriting</li>
                            <li>• Artists with a unique voice or perspective</li>
                            <li>• Music that tells a story or makes a statement</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

