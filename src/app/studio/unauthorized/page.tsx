import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600 text-lg mb-8">
                        You don't have permission to access the studio.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </main>
        </div>
    );
}

