"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
    const params = useSearchParams();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const token = params.get("token") || "";
    const email = params.get("email") || "";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        const res = await fetch("/api/auth/verify-password-reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, email, newPassword: password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setMessage(data?.error || "Reset failed");
        else {
            setMessage("Password updated. You may sign in now.");
            setTimeout(() => router.push("/signin"), 1500);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto px-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Set a new password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="pw">New password</Label>
                                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full">Update password</Button>
                            {message && <p className="text-sm text-gray-600 mt-2 text-center">{message}</p>}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


