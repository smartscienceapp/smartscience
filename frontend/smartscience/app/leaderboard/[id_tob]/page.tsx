"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";

interface LeaderboardItem {
    rank: number;
    nama: string;
    nilai: number;
}

export default function LeaderboardPage() {
    const params = useParams();
    const idTob = params.id_tob as string;

    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!idTob) {
                setLoading(false);
                return;
            }
            setLoading(true);

            try {
                const token = Cookies.get("token");

                // --- PERUBAHAN UTAMA DI SINI (POST METHOD) ---
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v2/leaderboard`,
                    {
                        id_tob: parseInt(idTob) // Body request: harus match dengan schema GetLeaderboard
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setLeaderboard(response.data);
            } catch (error) {
                console.error("Gagal mengambil data leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [idTob]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
        return <span className="font-bold text-muted-foreground">#{rank}</span>;
    };

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Leaderboard Hasil TOB</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-6">
                    <Card className="max-w-4xl mx-auto shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-6 w-6 text-primary" />
                                Top 10 Siswa Terbaik
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-10">Memuat data leaderboard...</div>
                            ) : leaderboard.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    Belum ada data pengerjaan untuk TOB ini.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px] text-center">Peringkat</TableHead>
                                            <TableHead>Nama Siswa</TableHead>
                                            <TableHead className="text-right">Nilai Akhir</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaderboard.map((item) => (
                                            <TableRow key={item.rank} className={item.rank <= 3 ? "bg-muted/30" : ""}>
                                                <TableCell className="font-medium text-center">
                                                    <div className="flex justify-center">
                                                        {getRankIcon(item.rank)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{item.nama}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {item.nilai}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}