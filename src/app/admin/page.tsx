"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    MessageSquare,
    Heart,
    BarChart3,
    Settings,
    Shield,
    Eye,
    Trash2
} from "lucide-react";

interface AdminStats {
    totalUsers: number;
    totalComments: number;
    totalLikes: number;
    recentUsers: any[];
    recentComments: any[];
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/api/auth/signin");
        }
        if (status === "authenticated") {
            checkAdminStatus();
        }
    }, [status]);

    const checkAdminStatus = async () => {
        try {
            const response = await fetch("/api/admin/check");
            if (response.ok) {
                const data = await response.json();
                setIsAdmin(data.isAdmin);
                if (data.isAdmin) {
                    fetchStats();
                }
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // This would need to be implemented in your API
            // For now, we'll show a placeholder
            setStats({
                totalUsers: 0,
                totalComments: 0,
                totalLikes: 0,
                recentUsers: [],
                recentComments: []
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                            <p className="text-gray-600 mb-6">
                                You don't have admin privileges to access this page.
                            </p>
                            <Button asChild>
                                <a href="/">Go Home</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600">Manage your Fresh Press site</p>
                    </div>
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                    </Badge>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Registered users
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                User comments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalLikes || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Post likes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                User Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View All Users
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Manage Permissions
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Content Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                Review Comments
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Moderate Content
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Activity data will appear here</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
