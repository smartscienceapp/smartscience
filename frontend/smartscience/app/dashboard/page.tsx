"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// --- Types ---
interface DecodedToken {
  role: string;
}

interface RataNilai {
  rata: number;
  mapel: string;
}

// 1. HARDCODE URL (Ensures we hit the live server)
const API_URL = "https://smartscience-smartscience-backend.hf.space";

export default function DashboardPage() {
  // --- State ---
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [lastUserCreatedAt, setLastUserCreatedAt] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState<RataNilai[]>([]);
  
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const initDashboard = async () => {
      console.log("--- DASHBOARD INIT ---");
      const token = Cookies.get("token");
      
      // DEBUG: Allow render even if token is missing (for testing UI layout)
      // remove this 'if' block when strictly enforcing auth
      if (!token) { 
        console.warn("No token found - running in Layout Test Mode");
      }

      try {
        // Decode token if exists, otherwise assume authorized for testing
        const decoded = token ? jwtDecode<DecodedToken>(token) : { role: "admin" }; 
        
        if (decoded.role === "admin" || decoded.role === "guru") {
          setIsAuthorized(true);
          try {
            // 2. CACHE BUSTING HEADERS (Fixes 304 Issue)
            const config = {
              headers: { 
                'Cache-Control': 'no-cache', 
                'Pragma': 'no-cache', 
                'Expires': '0' 
              }
            };

            console.log(`Fetching from: ${API_URL}`);
            
            const [resTotal, resLastUser, resGrades] = await Promise.all([
              axios.get(`${API_URL}/api/v1/users/total_user`, config),
              axios.get(`${API_URL}/api/v1/users/last_user_create`, config),
              axios.get(`${API_URL}/api/v2/daftar_nilai/rata_rata_nilai`, config)
            ]);

            console.log("Total User Payload:", resTotal.data); // Check console for "61"

            setTotalSiswa(resTotal.data.total_user);
            setLastUserCreatedAt(resLastUser.data.created_at);
            setGradeData(resGrades.data);
            
          } catch (error) {
            console.error("API Fetch Error:", error);
          } finally {
            setIsDataLoading(false);
          }
        } else {
          setIsAuthorized(false); 
        }
      } catch (error) {
        setIsAuthorized(false); 
        setIsAuthLoading(false); 
      } finally { 
        setIsAuthLoading(false); 
      }
    };
    initDashboard();
  }, []);

  const renderTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Belum ada data";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) { return "Invalid date"; }
  };

  // Skip auth check return for UI testing
  // if (isAuthLoading) return <div>Checking Auth...</div>;
  // if (!isAuthorized) return <div>Unauthorized</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/40">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full">
        {/* HEADER */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 shadow-sm">
          <h1 className="text-xl font-semibold md:text-2xl">Dashboard Guru</h1>
          <div className="ml-auto"><UserMenu /></div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 min-h-0 overflow-y-auto">
          
          {/* --- TOP ROW: STATS (Matches Screenshot Layout) --- */}
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* Card 1: Total Siswa */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isDataLoading ? "..." : totalSiswa}</div>
              </CardContent>
            </Card>

            {/* Card 2: Aktivitas (Last User Create) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktivitas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="text-2xl font-bold">New User</div>
                 <p className="text-xs text-muted-foreground mt-1">
                    {isDataLoading ? "Loading..." : `Registered ${renderTimeAgo(lastUserCreatedAt)}`}
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* --- BOTTOM ROW: CHART + ALERT (Matches Screenshot Layout) --- */}
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            
            {/* LEFT: CHART (Takes up 2 columns) */}
            <Card className="lg:col-span-2 shadow-sm flex flex-col h-[400px]">
              <CardHeader>
                <CardTitle>Rata-rata Nilai per Mata Pelajaran</CardTitle>
                <CardDescription>Grafik perbandingan rata-rata nilai siswa.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pb-4">
                {isDataLoading ? (
                   <div className="flex h-full items-center justify-center">Loading Data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="mapel" 
                        tick={{ fontSize: 10, fill: '#888888' }} 
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                         domain={[0, 100]}
                         tick={{ fontSize: 12, fill: '#888888' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        cursor={{ fill: 'transparent' }}
                      />
                      {/* FIXED COLOR to Black (#000000) */}
                      <Bar dataKey="rata" radius={[4, 4, 0, 0]} fill="#000000" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* RIGHT: PERLU PERHATIAN (Takes up 1 column) */}
            {/* NOTE: You do not have an endpoint for this yet. This is Static Data. */}
            <Card className="lg:col-span-1 shadow-sm h-[400px] overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle>Perlu Perhatian</CardTitle>
                <CardDescription>Siswa dengan nilai di bawah KKM.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                 <div className="space-y-4">
                    {/* MOCK DATA - Replace with real API map later */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Ahmad Rizki</p>
                        <p className="text-xs text-muted-foreground">Fisika</p>
                      </div>
                      <span className="font-bold text-red-500">45</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Siti Aminah</p>
                        <p className="text-xs text-muted-foreground">Matematika</p>
                      </div>
                      <span className="font-bold text-red-500">52</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Budi Santoso</p>
                        <p className="text-xs text-muted-foreground">Kimia</p>
                      </div>
                      <span className="font-bold text-red-500">58</span>
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