import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Define admin users
        const adminEmails = [
            "admin@freshlypressed.com", // Add your admin email here
            // Add more admin emails as needed
        ];

        // If accessing studio, check if user is admin
        if (req.nextUrl.pathname.startsWith("/studio")) {
            const isAdmin = req.nextauth.token?.email && adminEmails.includes(req.nextauth.token.email);

            if (!isAdmin) {
                return NextResponse.redirect(new URL("/studio/unauthorized", req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // For studio routes, we handle authorization in the middleware function above
                if (req.nextUrl.pathname.startsWith("/studio")) {
                    return !!token; // Just check if user is logged in, admin check is in middleware function
                }

                // For all other routes, allow access
                return true;
            },
        },
    }
);

export const config = {
    matcher: [
        // "/studio/:path*", // Temporarily disabled to allow studio access
    ],
};
