"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react"; // Pastikan install lucide-react jika belum

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Reset error setiap kali tombol ditekan
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("username", username);
            params.append("password", password);
            
            // Perbaikan URL: Pastikan port dan endpoint benar
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/login`, params);
            
            const token = response.data.access_token;
            Cookies.set("token", token);   
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            // Logika error handling
            console.error("Login Error:", err);
            const errorMessage = err.response?.data?.detail || err.response?.data?.message || "Username atau password salah.";
            setError(errorMessage);
        } finally {
            setIsLoading(false); // Stop loading apapun hasilnya
        }
    }; 

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md border-border bg-card shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-balance">Masuk ke Akun Anda</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Masukkan username dan password untuk melanjutkan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* --- BAGIAN MENAMPILKAN ERROR (POP UP/ALERT) --- */}
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}
                    {/* ------------------------------------------------ */}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Masukkan username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading} // Disable saat loading
                                className="bg-secondary/50 transition-colors focus:bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label> 
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading} // Disable saat loading
                                className="bg-secondary/50 transition-colors focus:bg-background"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? "Memproses..." : "Masuk"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}