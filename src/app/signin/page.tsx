"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
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

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/" });
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
                        {/* Google Sign In - Only show if properly configured */}
                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                            !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-google-client-id') && (
                                <>
                                    <Button
                                        onClick={handleGoogleSignIn}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Continue with Google
                                    </Button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-white px-2 text-gray-500">Or</span>
                                        </div>
                                    </div>
                                </>
                            )}

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

                        <div className="text-center space-y-3">
                            <p className="text-xs text-gray-500">
                                By signing in, you agree to our terms of service and privacy policy.
                            </p>
                            <div className="border-t pt-3">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{" "}
                                    <Link href="/signup" className="text-black font-medium hover:underline">
                                        Create one here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



