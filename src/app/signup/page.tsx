"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

declare global {
    interface Window {
        hcaptcha: any;
    }
}

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);

    useEffect(() => {
        // Load hCaptcha when component mounts
        if (typeof window !== 'undefined' && window.hcaptcha) {
            window.hcaptcha.render('hcaptcha-container', {
                sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY,
                callback: (token: string) => {
                    setHcaptchaToken(token);
                },
                'expired-callback': () => {
                    setHcaptchaToken(null);
                },
                'error-callback': () => {
                    setHcaptchaToken(null);
                }
            });
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        // Check if hCaptcha is completed
        if (!hcaptchaToken) {
            setMessage("Please complete the CAPTCHA verification");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name, hcaptchaToken }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Registration failed");
            setMessage("Account created. You can now sign in.");
        } catch (err: any) {
            setMessage(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto px-4">
                <div className="mb-6">
                    <Link href="/signin" className="text-sm text-gray-600 hover:text-gray-900">Back to Sign In</Link>
                </div>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Create account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="username">username</Label>
                                <Input id="username" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="email">email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="password">password</Label>
                                <div className="flex gap-2">
                                    <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    <Button type="button" variant="outline" onClick={() => setShowPw((v) => !v)}>
                                        {showPw ? "Hide" : "Show"}
                                    </Button>
                                </div>
                            </div>
                            {/* hCaptcha */}
                            <div id="hcaptcha-container" className="flex justify-center"></div>
                            
                            <Button type="submit" className="w-full" disabled={isLoading || !hcaptchaToken}>
                                {isLoading ? "Creating..." : "Create account"}
                            </Button>
                        </form>
                        {message && <p className="mt-4 text-sm text-center text-gray-600">{message}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


