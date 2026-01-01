"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// 1. Definisi Tipe Token
interface DecodedToken { 
    role: string;
}

export default function DashboardPage() {
    const [totalSiswa, setTotalSiswa] = useState(0);
    const [lastUserCreatedAt, setLastUserCreatedAt] = useState<string | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const initDashboard = async () => {
            const token = Cookies.get("token");

            if (!token) {
                setIsAuthLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode<DecodedToken>(token);
                const userRole = decoded.role; 

                if (userRole === "admin" || userRole === "guru") {
                    setIsAuthorized(true);
                    
                    // Fetch Data Parallel
                    try {
                        const [resTotal, resLastUser] = await Promise.all([
                            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/total_user`),
                            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/last_user_create`)
                        ]);
                        
                        setTotalSiswa(resTotal.data.total_siswa);
                        setLastUserCreatedAt(resLastUser.data.created_at);
                    } catch (error) {
                        console.error("Gagal mengambil data dashboard:", error);
                    } finally {
                        setIsDataLoading(false);
                    }
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Gagal verifikasi role:", error);
                setIsAuthorized(false);
            } finally {
                setIsAuthLoading(false);
            }
        };

        initDashboard();
    }, []); 

    const renderTimeAgo = (dateString: string | null) => {
        if (!dateString) return "Belum ada data";
        try {
            const utcDateString = dateString.endsWith("Z")
                ? dateString
                : `${dateString}Z`;
            return formatDistanceToNow(new Date(utcDateString), { addSuffix: true });
        } catch (error) {
            return "Invalid date";
        }
    };

    if (isAuthLoading) {
        return <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">Loading...</div>;
    }

    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen bg-muted/40">
                <Sidebar />
                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                        <h1 className="text-xl font-semibold md:text-2xl">Overview</h1>
                        <div className="ml-auto">
                            <UserMenu />
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-6">
                        <div className="flex h-full items-center justify-center">
                            <p className="text-muted-foreground"></p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Overview</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total User Aktif</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {isDataLoading ? "..." : totalSiswa}
                                    </div> 
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Aktivitas Terbaru</CardTitle>
                                <CardDescription>Pembaruan terkini dalam sistem</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                            <Activity className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">Pendaftaran pengguna baru</p>
                                            <p className="text-sm text-muted-foreground">
                                                {isDataLoading ? "Loading..." : renderTimeAgo(lastUserCreatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
