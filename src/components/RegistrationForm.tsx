"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegistrationForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Basic validation
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            setIsLoading(false);
            return;
        }

        try {
            // Get hCaptcha token
            const hcaptchaToken = await getHCaptchaToken();
            if (!hcaptchaToken) {
                setError("Please complete the CAPTCHA");
                setIsLoading(false);
                return;
            }

            // Register user
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    hcaptchaToken,
                }),
            });

            if (response.ok) {
                // Registration successful
                window.location.href = "/signin";
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Registration failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getHCaptchaToken = (): Promise<string | null> => {
        return new Promise((resolve) => {
            if (typeof window !== "undefined" && (window as any).hcaptcha) {
                (window as any).hcaptcha.execute(process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY, {
                    async: true,
                }).then((token: string) => {
                    resolve(token);
                }).catch(() => {
                    resolve(null);
                });
            } else {
                resolve(null);
            }
        });
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                    Join Fresh Press to comment and like posts
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            minLength={8}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>

                {/* hCaptcha widget */}
                <div
                    className="h-captcha mt-4"
                    data-sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY}
                    data-callback="onHCaptchaSuccess"
                />
            </CardContent>
        </Card>
    );
}
