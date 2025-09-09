
export default function NewsletterPage() {
    return (
        <div className="min-h-screen bg-black text-white">

            <div className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Newsletter
                    </h1>

                    <div className="space-y-8">
                        <p className="text-xl text-gray-300 leading-relaxed">
                            Stay updated with the latest music reviews, artist features, and industry insights from Fresh Press.
                        </p>

                        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                            <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
                            <p className="text-gray-300 mb-6">
                                We're working on setting up our newsletter system. Check back soon for updates!
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Weekly music reviews</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Artist spotlights</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Industry news and insights</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Exclusive content and early access</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <a
                                href="/"
                                className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Back to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



