"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch("/api/auth/request-password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to send reset link");
            setMessage("If the email exists, a reset link has been sent.");
        } catch (err: any) {
            setMessage(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto px-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Reset Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
                        </form>
                        {message && <p className="text-sm text-gray-600 mt-4 text-center">{message}</p>}
                        <div className="text-center mt-4">
                            <Link href="/signin" className="text-sm text-blue-600 hover:underline">Back to Sign In</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


