"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function SetupAdminPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    if (status === "unauthenticated") {
        redirect("/api/auth/signin");
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    const handleSetupAdmin = async () => {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/setup-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setIsSuccess(true);
            } else {
                setMessage(data.error);
                setIsSuccess(false);
            }
        } catch (error) {
            setMessage("Failed to setup admin. Please try again.");
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl">Setup Admin Account</CardTitle>
                        <p className="text-gray-600">
                            Set up your admin account to manage the Fresh Press site
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {session && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Current User:</h3>
                                <p className="text-sm text-gray-600">
                                    <strong>Name:</strong> {session.user?.name || "N/A"}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Email:</strong> {session.user?.email || "N/A"}
                                </p>
                            </div>
                        )}

                        {message && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 ${isSuccess
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-red-50 text-red-800 border border-red-200"
                                }`}>
                                {isSuccess ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5" />
                                )}
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900">What this will do:</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    Create your user profile
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    Grant you admin privileges
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    Enable admin dashboard access
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleSetupAdmin}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? "Setting up..." : "Setup Admin Account"}
                        </Button>

                        {isSuccess && (
                            <div className="text-center">
                                <Button asChild variant="outline">
                                    <a href="/admin">Go to Admin Dashboard</a>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}



