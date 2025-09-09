"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Heart, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AuthButton() {
    const { data: session, status } = useSession();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            checkAdminStatus();
        }
    }, [session]);

    const checkAdminStatus = async () => {
        try {
            const response = await fetch("/api/admin/check");
            if (response.ok) {
                const data = await response.json();
                setIsAdmin(data.isAdmin);
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        }
    };

    if (status === "loading") {
        return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
    }

    if (!session) {
        return (
            <Link
                href="/signin"
                className="cutting-edge-nav hover:text-white cursor-pointer"
            >
                Sign In
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                {/* Liked Posts now merged into Profile page; remove extra item */}
                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

