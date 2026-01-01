"use client";

import { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useRouter, useSearchParams} from "next/navigation"
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

interface MataPelajaran {
    id_mapel: number;
    nama_mapel: string;
}

export const dynamic = "force-dynamic";

export function ListMataPelajaranContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
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
    const [openKelas, setOpenKelas] = useState(false)
    const [isKelasLoading, setIsKelasLoading] = useState(false)
    const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([])

    const [formData, setFormData] = useState({
        id_kelas: "",
        nama_kelas: "",
    })

    const searchParams = useSearchParams()

    const fetchData = async () => {
        setIsKelasLoading(true)
        try {
            const kelasRes = await axios.post(`${API_URL}/api/v1/kelas/list_kelas`)
            if (kelasRes.data?.kelas) {
                setKelasList(kelasRes.data.kelas)
            } else if (Array.isArray(kelasRes.data)) {
                setKelasList(kelasRes.data)
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
            setIsKelasLoading(false)
        }
    }

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
        fetchData()
    }, [])

    useEffect(() => {
        const paramKelas = searchParams.get("id_kelas");

        if (paramKelas) {
            if (kelasList.length > 0) {
                setFormData(prev => ({ ...prev, id_kelas: paramKelas }));
                handleFilter(undefined, { id_kelas: paramKelas });
            }
        }   
    }, [searchParams]);

    const handleKelasChange = (value: string) => {
        router.push(`/mata_pelajaran/list_mata_pelajaran?id_kelas=${value}`)
        const nama_kelas = kelasList.find((mp) => mp.id_kelas.toString() === value)?.nama_kelas || ""
        setFormData((prev) => ({ ...prev, id_kelas: value, nama_kelas: nama_kelas}))
        setMataPelajaranList([])
    }

    const handleFilter = async (e?: React.FormEvent, filterIds?: { id_kelas: string }) => {
        if (e) e.preventDefault()
        console.log(formData)
        if (!formData.id_kelas) {
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
                id_kelas: Number(filterIds ? filterIds.id_kelas : formData.id_kelas),
            }
            const response = await axios.post(`${API_URL}/api/v1/mapel/list_mapel`, payload)
            if (response.data && response.data.mapel) {
                setMataPelajaranList(response.data.mapel)
            } else if (Array.isArray(response.data)) {
                setMataPelajaranList(response.data)
            } else {
                setMataPelajaranList([])
                setAlertData({
                    title: "Gagal",
                    description: "Mata Pelajaran tidak ditemukan untuk kelas ini.",
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
            router.push("/mata_pelajaran/list_mata_pelajaran")
            router.refresh()
        }
    }

    const handleDeleteClick = async (id_mapel: number) => {
        setToDelete(id_mapel)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            const payload = {
                id_mapel: Number(toDelete)
            }
            await axios.post(`${API_URL}/api/v1/mapel/delete_mapel`, payload)
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
                    <h1 className="text-xl font-semibold md:text-2xl">List Mata Pelajaran</h1>
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
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>
                                    Pilih kelas untuk melihat mata pelajaran.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="kelas">Kelas<span className="text-red-500">*</span></Label>
                                        <Popover open={openKelas} onOpenChange={setOpenKelas}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openKelas}
                                                    className="w-full justify-between"
                                                >
                                                    {formData.id_kelas
                                                        ? kelasList.find((k) => k.id_kelas.toString() === formData.id_kelas)?.nama_kelas
                                                        : "Pilih Kelas"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari kelas..." />
                                                    <CommandList>
                                                        {isKelasLoading ? (
                                                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Memuat data kelas...
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {kelasList.map((k) => (
                                                                        <CommandItem
                                                                            key={k.id_kelas}
                                                                            value={k.nama_kelas}
                                                                            onSelect={() => {
                                                                                handleKelasChange(k.id_kelas.toString())
                                                                                setOpenKelas(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formData.id_kelas === k.id_kelas.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {k.nama_kelas}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </>)}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID Mata Pelajaran</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Memuat data...
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                mataPelajaranList.map((item) => (
                                                    <TableRow key={item.id_mapel}>
                                                        <TableCell className="font-medium">{item.id_mapel}</TableCell>
                                                        <TableCell>{formData.nama_kelas || "-"}</TableCell>
                                                        <TableCell>{item.nama_mapel}</TableCell>
                                                        <TableCell  className="w-[50px]">
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item.id_mapel)}>
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
                                    Apakah Anda yakin ingin menghapus mata pelajaran ini dari database? Tindakan ini tidak dapat dibatalkan.
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

export default function ListMataPelajaranPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ListMataPelajaranContent />
        </Suspense>
    )
}