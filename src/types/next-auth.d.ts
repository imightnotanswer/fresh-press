import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            username?: string | null;
            avatar_color?: string | null;
            avatar_url?: string | null;
            is_admin?: boolean;
        };
    }
    interface User {
        id: string;
    }
}
