"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale"; // Optional: for Indonesian format
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
      const token = Cookies.get("token");
      
      // DEBUG: Remove this if-check if you want to test without login locally
      if (!token) { 
        console.error("No token found in cookies");
        setIsAuthLoading(false); 
        return; 
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token); 
        
        if (decoded.role === "admin" || decoded.role === "guru") {
          setIsAuthorized(true);
          try { 
            
            const [resTotal, resLastUser, resGrades] = await Promise.all([
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/total_user`),
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/last_user_create`),
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/daftar_nilai/rata_rata_nilai`)
            ]); 

            setTotalSiswa(resTotal.data.total_user);
            setLastUserCreatedAt(resLastUser.data.created_at);
            setGradeData(resGrades.data);
          } catch (error) {
            console.error("API Fetch Error:", error);
          } finally {
            setIsDataLoading(false);
          }
        } else {
          console.warn("Unauthorized Role");
          setIsAuthorized(false); 
        }
      } catch (error) {
        console.error("Token Decode Error:", error);
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
      const dateObj = new Date(dateString);
      // Added locale for better formatting, optional
      return formatDistanceToNow(dateObj, { addSuffix: true }); 
    } catch (error) { return "Invalid date"; }
  };

  if (isAuthLoading) return <div>Checking Auth...</div>;
  if (!isAuthorized) return <div>Unauthorized Access. Role must be Admin/Guru.</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/40">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6 shadow-sm">
          <h1 className="text-xl font-semibold md:text-2xl">Overview</h1>
          <div className="ml-auto"><UserMenu /></div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 min-h-0">
          
          {/* TOP SECTION */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total User Aktif</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isDataLoading ? "..." : totalSiswa}</div>
              </CardContent>
            </Card>
          </div>

          {/* BOTTOM SECTION */}
          <div className="flex-1 grid gap-4 md:grid-cols-1 lg:grid-cols-7 min-h-0">
            
            {/* CHART */}
            <Card className="col-span-4 shadow-sm flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle>Rata-Rata Nilai</CardTitle>
                <CardDescription>Performa per mata pelajaran</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pb-4 pl-0">
                {isDataLoading ? (
                   <div className="flex h-full items-center justify-center">Loading Data...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis 
                        dataKey="mapel" 
                        type="category" 
                        width={150} 
                        tick={{ fontSize: 11, fill: '#64748b' }} 
                        interval={0}
                      />
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="rata" radius={[0, 4, 4, 0]} barSize={24}>
                        {gradeData.map((entry, index) => (
                            /* FIXED: Hex color was missing a digit (#00000 -> #000000) */
                            <Cell key={`cell-${index}`} fill={'#000000'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* ACTIVITY (Last User) */}
            <Card className="col-span-3 shadow-sm h-full overflow-y-auto">
              <CardHeader className="shrink-0">
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>Pendaftaran User Terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">User Registered</p>
                    <p className="text-sm text-muted-foreground">
                      {isDataLoading ? "..." : renderTimeAgo(lastUserCreatedAt)}
                    </p>
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