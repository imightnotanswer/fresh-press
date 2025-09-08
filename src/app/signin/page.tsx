"use client";

import { useEffect, useState } from "react";
import { signIn, getProviders } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [availableProviders, setAvailableProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

    useEffect(() => {
        getProviders().then(setAvailableProviders).catch(() => setAvailableProviders({}));
    }, []);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
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

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/" });
    };

    const handleCredentialsSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: true,
                callbackUrl: "/",
            });
            if (!res?.ok && (res as any)?.error) {
                console.error("Credentials sign in failed:", (res as any).error);
            }
        } catch (err) {
            console.error("Error with credentials sign in:", err);
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
                        {Boolean(availableProviders?.github) && (
                            <Button
                                onClick={handleGitHubSignIn}
                                className="w-full"
                                variant="outline"
                            >
                                <Github className="h-5 w-5 mr-2" />
                                Continue with GitHub
                            </Button>
                        )}

                        {Boolean(availableProviders?.google) && (
                            <Button
                                onClick={handleGoogleSignIn}
                                className="w-full"
                                variant="outline"
                            >
                                Continue with Google
                            </Button>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">Or</span>
                            </div>
                        </div>

                        {/* Email Sign In */}
                        {Boolean(availableProviders?.email) && (
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
                                    {isLoading ? "Sending..." : "Continue with Email"}
                                </Button>
                            </form>
                        )}

                        {/* Credentials Sign In */}
                        {Boolean(availableProviders?.credentials) && (
                            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                                <div>
                                    <Label htmlFor="cred-email">Email</Label>
                                    <Input
                                        id="cred-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cred-password">Password</Label>
                                    <Input
                                        id="cred-password"
                                        type="password"
                                        placeholder="Your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
                                    {isLoading ? "Signing in..." : "Sign in with Password"}
                                </Button>
                            </form>
                        )}

                        <div className="text-center space-y-2">
                            <p className="text-xs text-gray-500">
                                By signing in, you agree to our terms of service and privacy policy.
                            </p>
                            <p className="text-sm">
                                New here? <Link className="text-blue-600 hover:underline" href="/signup">Create an account</Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



