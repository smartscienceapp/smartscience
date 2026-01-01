"use client";

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { ArrowLeft, Trash2, Loader2 } from "lucide-react"

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
    id_kelas?: number;
    id_user?: number;
}

interface Kelas {
    id_kelas: number;
    nama_kelas: string;
}


export default function ListKelasPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [currentKelas, setCurrentKelas] = useState<number>()
    const [currentUserId, setCurrentUserId] = useState<number>()
    const [toDelete, setToDelete] = useState<number | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertData, setAlertData] = useState({
        title: "",
        description: "",
        isSuccess: false
    })
    const [kelasList, setKelasList] = useState<Kelas[]>([])
    const API_URL = process.env.NEXT_PUBLIC_API_URL

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
                    "Terjadi kesalahan saat decode token. Silakan login kembali.";
                setAlertData({
                    title: "Gagal",
                    description: errorMessage,
                    isSuccess: false
                })
                setAlertOpen(true)
            }
        }
    }, [])

    useEffect(() => {
        handleFilter(undefined);
    }, []);

    const handleFilter = async (e?: React.FormEvent) => {
        if (e) e.preventDefault() 
        setIsLoading(true)
        try {
            const response = await axios.post(`${API_URL}/api/v1/kelas/list_kelas`)
            if (response.data && response.data.kelas) {
                setKelasList(response.data.kelas)
            } else if (Array.isArray(response.data)) {
                setKelasList(response.data)
            } else {
                setKelasList([])
                setAlertData({
                    title: "Gagal",
                    description: "Kelas tidak ditemukan.",
                    isSuccess: false
                })
                setAlertOpen(true)
            }
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
            router.push("/kelas/list_kelas")
            router.refresh()
        }
    }

    const handleDeleteClick = async (id_kelas: number) => {
        setToDelete(id_kelas)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            const payload = {
                id_kelas: Number(toDelete)
            }
            await axios.post(`${API_URL}/api/v1/kelas/delete_kelas`, payload)
            handleFilter()
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
            setDeleteDialogOpen(false)
            setToDelete(null)
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">List Kelas</h1>
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
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID Kelas</TableHead>
                                                <TableHead>Kelas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Memuat data...
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                kelasList.map((item) => (
                                                    <TableRow key={item.id_kelas}>
                                                        <TableCell className="font-medium">{item.id_kelas}</TableCell>
                                                        <TableCell>{item.nama_kelas}</TableCell>
                                                        <TableCell  className="w-[50px]">
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item.id_kelas)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
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
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus kelas ini dari database? Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                                <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}