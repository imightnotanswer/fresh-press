"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pwEmail, setPwEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pwError, setPwError] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            // First, ensure the user exists; if not, direct them to signup
            const check = await fetch('/api/auth/user-exists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            }).then(r => r.json());

            if (!check?.exists) {
                // Send them to create an account
                window.location.href = `/signup?email=${encodeURIComponent(email)}`;
                return;
            }

            const result = await signIn("email", {
                email,
                redirect: false,
            });

            if (result?.ok) {
                setEmailSent(true);
            } else {
                console.error("Email sign in failed:", result?.error);
            }
        } catch (error) {
            console.error("Error signing in with email:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubSignIn = () => {
        signIn("github", { callbackUrl: "/" });
    };

    const handlePasswordSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(null);
        if (!pwEmail || !pw) return;
        setIsLoading(true);
        try {
            const res = await signIn("credentials", {
                email: pwEmail,
                password: pw,
                redirect: false,
            });
            if (res?.error) {
                setPwError("That email or password is incorrect");
            } else {
                window.location.href = "/";
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-md mx-auto px-4">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl">Check Your Email</CardTitle>
                            <p className="text-gray-600">
                                We've sent a sign-in link to <strong>{email}</strong>
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    Click the link in the email to sign in. The link will expire in 24 hours.
                                </p>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-600">
                                    Didn't receive the email? Check your spam folder.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setEmailSent(false)}
                                    className="w-full"
                                >
                                    Try Different Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto px-4">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Fresh Press
                    </Link>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Sign In</CardTitle>
                        <p className="text-gray-600">
                            Choose your preferred sign-in method
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* GitHub Sign In */}
                        <Button
                            onClick={handleGitHubSignIn}
                            className="w-full"
                            variant="outline"
                        >
                            <Github className="h-5 w-5 mr-2" />
                            Continue with GitHub
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        {/* Email Sign In (requires existing account) */}
                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !email}
                            >
                                <Mail className="h-5 w-5 mr-2" />
                                {isLoading ? "Checking..." : "Continue with Email"}
                            </Button>
                        </form>

                        {/* Password Sign In */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or sign in with password</span>
                            </div>
                        </div>
                        <form onSubmit={handlePasswordSignIn} className="space-y-3">
                            <div>
                                <Label htmlFor="pw-email">Email</Label>
                                <Input id="pw-email" type="email" value={pwEmail} onChange={(e) => setPwEmail(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="pw">Password</Label>
                                <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
                            </div>
                            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign in with Password"}
                            </Button>
                        </form>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                By signing in, you agree to our terms of service and privacy policy.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



