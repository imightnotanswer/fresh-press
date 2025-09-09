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
    const [bio, setBio] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [avatarColor, setAvatarColor] = useState<string>("#e5e7eb");
    const [saving, setSaving] = useState(false);
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setUsername(data.profile.username || "");
                setBio(data.profile.bio || "");
                setAvatarColor(data.profile.avatar_color || "#e5e7eb");
                setIsPublic(Boolean(data.profile.is_public));
            }
        })();
    }, []);

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, bio, is_public: isPublic, avatar_color: avatarColor })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 409) setMessage("Username is already taken");
                else setMessage(data?.error || "Failed to update profile");
            } else {
                setMessage("Profile saved");
                try {
                    // Notify header/avatar listeners immediately
                    window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar_color: avatarColor } }));
                } catch { }
            }
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setChanging(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) setMessage(data?.error || "Failed to update password");
            else setMessage("Password updated");
        } finally {
            setChanging(false);
        }
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
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Avatar color</label>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full" style={{ backgroundColor: avatarColor }} />
                                <input type="color" value={avatarColor} onChange={(e) => setAvatarColor(e.target.value)} />
                            </div>
                        </div>
                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bio">Bio</Label>
                                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input id="public" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                                <Label htmlFor="public">Public profile</Label>
                            </div>
                            <Button type="submit" disabled={saving}>Save</Button>
                        </form>

                        <form onSubmit={changePassword} className="space-y-3 mt-8">
                            <div>
                                <Label htmlFor="old">Current password</Label>
                                <Input id="old" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pw">New password</Label>
                                <Input id="pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" variant="outline" disabled={changing}>Update password</Button>
                        </form>

                        {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


