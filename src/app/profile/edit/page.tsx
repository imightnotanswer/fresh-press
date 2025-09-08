"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function EditProfilePage() {
    const { data: session, status } = useSession();
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setUsername(data.profile.username || "");
                setDisplayName(data.profile.display_name || "");
                setBio(data.profile.bio || "");
                setIsPublic(Boolean(data.profile.is_public));
            }
        })();
    }, []);

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, display_name: displayName, bio, is_public: isPublic })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setMessage(data?.error || "Failed to update profile");
        } else {
            setMessage("Profile saved");
        }
    };

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session?.user?.email, newPassword })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setMessage(data?.error || "Failed to update password");
        else setMessage("Password updated");
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-xl mx-auto px-4 space-y-6">
                <Link href="/profile" className="text-sm text-gray-600">Back to profile</Link>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="display">Display name</Label>
                                <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="public" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                                <Label htmlFor="public">Public profile</Label>
                            </div>
                            <Button type="submit">Save</Button>
                        </form>

                        <form onSubmit={changePassword} className="space-y-3 mt-8">
                            <Label htmlFor="pw">New password</Label>
                            <Input id="pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <Button type="submit" variant="outline">Update password</Button>
                        </form>

                        {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


