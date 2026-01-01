"use client"

import { useEffect, useState } from "react"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import axios from "axios"

interface DecodedToken {
    user: string;
    role: string;
}

export function UserMenu() {
    const [isMounted, setIsMounted] = useState(false);
    // Ganti dengan URL backend FastAPI Anda
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

    const [user, setUser] = useState({
        user: "Pengguna",
        initials: "P",
        role: "",
    })

    const handleLogout = async () => {
        try {
            // 1. Panggil Backend untuk set is_active = False
            // Kita kirim username sebagai query parameter sesuai endpoint FastAPI Anda
            if (user.user && user.user !== "Pengguna") {
                await axios.post(`${API_URL}/api/v1/users/logout`, null, {
                    params: { username: user.user }
                });
                console.log(`User ${user.user} berhasil di-nonaktifkan di server.`);
            }
        } catch (error) {
            // Jika backend error (misal server mati), kita tetap log errornya
            console.error("Gagal melakukan logout di server:", error);
        } finally {
            // 2. Hapus Token & Redirect (Selalu dijalankan sukses atau gagal)
            Cookies.remove("token");
            window.location.href = "/login_page";
        }
    }

    const getinitials = (name: string) => {
        if (!name) return "P";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }

    useEffect(() => {
        setIsMounted(true);

        const fetchUser = async () => {
            const token = Cookies.get("token");

            if (token && token !== "undefined" && token !== "null") {
                try {
                    const decoded = jwtDecode<DecodedToken>(token);
                    const username = decoded.user;
                    const role = decoded.role;

                    setUser({
                        user: username,
                        initials: getinitials(username),
                        role: role,
                    });
                } catch (error) {
                    console.error("Error decoding token or fetching role:", error);
                }
            }
        };

        fetchUser();
    }, []);

    // Hindari hydration mismatch
    if (!isMounted) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent transition-all hover:ring-ring">
                    <AvatarImage src="" alt={user.user} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{user.initials}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator /> 
                <DropdownMenuSeparator />
                {/* Tambahkan onClick handler disini */}
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}