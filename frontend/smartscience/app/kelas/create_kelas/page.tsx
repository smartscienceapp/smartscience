"use client";

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button" 
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog" 
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { ArrowLeft, Loader2, Save } from "lucide-react"

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
    id_kelas?: number;
    id_user?: number;
}

export default function CreateKelasPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [currentKelas, setCurrentKelas] = useState<number>()
    const [currentUserId, setCurrentUserId] = useState<number>()
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertData, setAlertData] = useState({
        title: "",
        description: "",
        isSuccess: false
    })

    const [formData, setFormData] = useState({
        nama_kelas: "",
        created_by: ""
    })

    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                const userIdentifier = decoded.sub || decoded.username || decoded.role || "unknown"
                setCurrentUser(decoded.role || "unknown")
                setCurrentKelas(decoded.id_kelas)
                setCurrentUserId(decoded.id_user)
            } catch (error: any) {
                const errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.detail ||
                    "Terjadi kesalahan koneksi atau server tidak merespons.";
                setAlertData({
                    title: "Gagal",
                    description: errorMessage,
                    isSuccess: false
                })
                setAlertOpen(true)
            }
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nama_kelas) {
            setAlertData({
                title: "Gagal",
                description: "Mohon lengkapi semua formulir.",
                isSuccess: false
            })
            setAlertOpen(true)
            return
        }
        setIsLoading(true)
        try {
            const payload = {
                nama_kelas: formData.nama_kelas,
                created_by: currentUser,
            }
            await axios.post(`${API_URL}/api/v1/kelas/create_kelas`, payload)
            setAlertData({
                title: "Berhasil",
                description: "Kelas berhasil dibuat.",
                isSuccess: true
            })
            setAlertOpen(true)
            formData.nama_kelas = ""
            formData.created_by = ""
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                "Terjadi kesalahan koneksi atau server tidak merespons.";
            setAlertData({
                title: "Gagal",
                description: errorMessage,
                isSuccess: false
            })
            setAlertOpen(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAlertClose = () => {
        setAlertOpen(false)
        if (alertData.isSuccess) {
            router.push("/kelas/create_kelas")
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Buat Kelas Baru</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <div className="mx-auto max-w-auto space-y-6">
                        <Button
                            variant="ghost"
                            className="mb-4 pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader>
                                <CardTitle>Formulir Kelas</CardTitle>
                                <CardDescription>
                                    Silakan isi nama kelas baru.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="nama_bab">Nama Kelas <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="nama_kelas"
                                            name="nama_kelas"
                                            value={formData.nama_kelas}
                                            onChange={handleChange}
                                            placeholder="Contoh : 10 SMA IPA"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !formData.nama_kelas}
                                            className="w-full md:w-auto"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Simpan Kelas
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                    <Dialog open={alertOpen} onOpenChange={(open) => !open && handleAlertClose()}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{alertData.title}</DialogTitle>
                                <DialogDescription>
                                    {alertData.description}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button onClick={handleAlertClose}>OK</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}