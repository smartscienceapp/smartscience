"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, BookOpen, Trophy, Activity } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";

// Interface untuk data grafik
interface ChartData {
    name: string;
    avg: number;
}

export default function GuruDashboard() {
    // State untuk data
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPengerjaan, setTotalPengerjaan] = useState<number>(0);
    const [totalSiswa, setTotalSiswa] = useState<number>(0);
    
    // Mock data untuk inisialisasi (bisa diganti dengan fetch API)
    const mockData: ChartData[] = [
        { name: "Matematika", avg: 75 },
        { name: "Fisika", avg: 68 },
        { name: "Biologi", avg: 82 },
        { name: "Kimia", avg: 70 },
        { name: "B. Inggris", avg: 85 },
    ];

    useEffect(() => {
        // Simulasi fetch data
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const res = await axios.get(`${API_URL}/api/v1/tob/total_pengerjaan_tob`);
                setTotalPengerjaan(res.data.total_pengerjaan);
            } catch (error) {
                console.error("Failed to fetch total pengerjaan", error);
            }

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const res = await axios.get(`${API_URL}/api/v1/users/total_siswa`);
                setTotalSiswa(res.data.total_siswa);
            } catch (error) {
                console.error("Failed to fetch total siswa", error);
            }

            try {
                // Di sini Anda bisa memanggil API endpoint backend Anda
                // const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/guru/stats`);
                
                // Simulasi delay network
                setTimeout(() => {
                    setChartData(mockData);
                    setIsLoading(false);
                }, 1000);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Dashboard Guru</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalSiswa}</div> 
                                </CardContent>
                            </Card>  
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Aktivitas</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">+{totalPengerjaan}</div>
                                    <p className="text-xs text-muted-foreground">Pengerjaan soal minggu ini</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Chart Section */}
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Rata-rata Nilai per Mata Pelajaran</CardTitle>
                                    <CardDescription>
                                        Grafik perbandingan rata-rata nilai siswa antar mata pelajaran.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[350px] w-full">
                                        {isLoading ? (
                                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                                Memuat grafik...
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        stroke="#888888" 
                                                        fontSize={12} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                    />
                                                    <YAxis 
                                                        stroke="#888888" 
                                                        fontSize={12} 
                                                        tickLine={false} 
                                                        axisLine={false} 
                                                        tickFormatter={(value) => `${value}`} 
                                                    />
                                                    <Tooltip 
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Bar 
                                                        dataKey="avg" 
                                                        fill="currentColor" 
                                                        radius={[4, 4, 0, 0]} 
                                                        className="fill-primary" 
                                                        barSize={40}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity / Additional Info */}
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Perlu Perhatian</CardTitle>
                                    <CardDescription>
                                        Siswa dengan nilai di bawah KKM pada ujian terakhir.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[
                                            { name: "Ahmad Rizki", mapel: "Fisika", nilai: 45 },
                                            { name: "Siti Aminah", mapel: "Matematika", nilai: 52 },
                                            { name: "Budi Santoso", mapel: "Kimia", nilai: 58 },
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.mapel}</p>
                                                </div>
                                                <div className="font-bold text-red-500">
                                                    {item.nilai}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}