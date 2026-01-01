"use client";

import { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { FileText, Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { decode } from "punycode";
// --- Interfaces ---
interface MataPelajaran {
    id_mapel: number;
    nama_mapel: string;
}

interface TOB {
    id_tob: number;
    nama_tob: string;
    nama_kelas?: string;
    nama_mapel?: string;
}

interface KelasItem {
    id_kelas: number;
    nama_kelas: string;
}

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
    id_kelas?: number;
    id_user?: number;
}

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL

const TOBStatus = ({ id_tob, id_user }: { id_tob: number; id_user: number | undefined }) => {
    const [status, setStatus] = useState<string>("...")

    useEffect(() => {
        if (!id_user) return

        const fetchStatus = async () => {
            try {
                const response = await axios.post(`${API_URL}/api/v1/tob/status_pengerjaan`, {
                    id_user,
                    id_tob
                })
                setStatus(response.data.message)
            } catch (error) {
                console.error("Error fetching status:", error)
                setStatus("Error")
            }
        }
        fetchStatus()
    }, [id_tob, id_user])

    return (
        <span className={`text-xs font-medium px-2 py-1 rounded ${status === "Sudah Mengerjakan" ? "bg-green-100 text-green-800" : status === "Belum Mengerjakan" ? "bg-yellow-100 text-yellow-800" : "text-muted-foreground"}`}>
            {status}
        </span>
    )
}

export function ListTOBContent() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [currentKelas, setCurrentKelas] = useState<number>()
    const [currentUserId, setCurrentUserId] = useState<number>()
    const [alertData, setAlertData] = useState({
        open: false,
        title: "",
        description: ""
    })
    const searchParams = useSearchParams()
    // State Data
    const [dataTOB, setDataTOB] = useState<TOB[]>([])
    const [listMapel, setListMapel] = useState<MataPelajaran[]>([])

    // State Filter
    const [selectedKelasId, setSelectedKelasId] = useState<string>("")
    const [selectedMapelId, setSelectedMapelId] = useState<string>("")
    const [openMapel, setOpenMapel] = useState(false)

    // Prevent accidental exit
    useEffect(() => {
        // Push state to prevent immediate back
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
            setAlertData({
                open: true,
                title: "Peringatan",
                description: "Anda tidak dapat kembali ke halaman sebelumnya."
            })
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Fungsi Fetch TOB
    const fetchTOB = async (mapelId: string, kelasId: number | undefined) => {
        if (!mapelId) return
        const idKelasToUse = kelasId || currentKelas
        if (!idKelasToUse) return

        setIsLoading(true)
        try {
            const payload = { id_mapel: parseInt(mapelId), id_kelas: idKelasToUse }
            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)

            if (response.data && response.data.tob) {
                setDataTOB(response.data.tob)
            } else if (Array.isArray(response.data)) {
                setDataTOB(response.data)
            } else {
                setDataTOB([])
                setAlertData({
                    open: true,
                    title: "Informasi",
                    description: "Tidak ada TOB pada Pelajaran ini"
                })
            }
        } catch (error) {
            console.error("Error filtering:", error)
            setDataTOB([])
            setAlertData({
                open: true,
                title: "Gagal",
                description: "Gagal memuat data filter."
            })
        } finally {
            setIsLoading(false)
        }
    }

    // 1. Cek Token & Load Data Kelas untuk Dropdown
    useEffect(() => {
        const token = Cookies.get("token")
        let kelasId: number | undefined
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                setCurrentUser(decoded.role || "unknown")
                setCurrentKelas(decoded.id_kelas)
                setCurrentUserId(decoded.id_user)  
                if (decoded.id_kelas) {
                    setSelectedKelasId(decoded.id_kelas.toString()) 
                    const fetchMapel = async () => {
                        try {
                            const payload = { id_kelas: decoded.id_kelas }
                            const response = await axios.post(`${API_URL}/api/v1/mapel/list_mapel`, payload)
                            if (response.data && response.data.mapel) {
                                setListMapel(response.data.mapel)
                            } else if (Array.isArray(response.data)) {
                                setListMapel(response.data)
                            }
                        } catch (error) {
                            console.error("Error fetching mapel:", error)
                        }
                    }
                    fetchMapel()
                }
            } catch (error) {
                console.error("Token invalid:", error)
            }
        }

        const paramMapel = searchParams.get("id_mapel")

        if (paramMapel) {
            setSelectedMapelId(paramMapel)
            fetchTOB(paramMapel, kelasId)
        }

    }, [])

    const handleMapelChange = (value: string) => {
        setSelectedMapelId(value)
        fetchTOB(value, currentKelas)
    }

    const handleKerjakanSoal = async (id_tob: number) => {
        if (!currentUserId) return

        try {
            const response = await axios.post(`${API_URL}/api/v1/tob/status_pengerjaan`, {
                id_user: currentUserId,
                id_tob
            })

            if (response.data.message === "Sudah Mengerjakan") {
                setAlertData({
                    open: true,
                    title: "Informasi",
                    description: "Anda sudah mengerjakan TOB ini."
                })
            } else {
                router.push(`/tob/kerjakan_soal?id_tob=${id_tob}&id_mapel=${selectedMapelId}&id_kelas=${currentKelas}`)
            }
        } catch (error) {
            console.error("Error checking status:", error)
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Daftar TOB</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* CARD FILTER */}
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader>
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>Pilih mata pelajaran untuk melihat tob.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="filter-mapel">Pilih Mata Pelajaran</Label>
                                    <Popover open={openMapel} onOpenChange={setOpenMapel}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openMapel}
                                                className="w-full justify-between"
                                            >
                                                {selectedMapelId
                                                    ? listMapel.find((m) => m.id_mapel.toString() === selectedMapelId)?.nama_mapel
                                                    : "-- Pilih Mapel --"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Cari mata pelajaran..." />
                                                <CommandList>
                                                    <CommandEmpty>Mata pelajaran tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {listMapel.map((m) => (
                                                            <CommandItem
                                                                key={m.id_mapel}
                                                                value={m.nama_mapel}
                                                                onSelect={() => {
                                                                    handleMapelChange(m.id_mapel.toString())
                                                                    setOpenMapel(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedMapelId === m.id_mapel.toString() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {m.nama_mapel}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CARD TABLE HASIL */}
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardContent className="pt-6">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">ID TOB</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead>Nama TOB</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        Memuat data...
                                                    </TableCell>
                                                </TableRow>
                                            ) : dataTOB.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        {selectedMapelId
                                                            ? "Silahkan klik 'Cari TOB' untuk melihat tob."
                                                            : "Silakan pilih mata pelajaran, dan klik 'Cari TOB'."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                dataTOB.map((item) => (
                                                    <TableRow key={item.id_tob}>
                                                        <TableCell className="font-medium">{item.id_tob}</TableCell>
                                                        <TableCell>{item.nama_kelas || "-"}</TableCell>
                                                        <TableCell>{item.nama_mapel || "-"}</TableCell>
                                                        <TableCell>{item.nama_tob}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2 items-center">
                                                                <Button variant="outline" size="sm" onClick={() => handleKerjakanSoal(item.id_tob)}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Kerjakan Soal
                                                                </Button>
                                                                <TOBStatus id_tob={item.id_tob} id_user={currentUserId} />
                                                            </div>
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
                    <Dialog open={alertData.open} onOpenChange={(open) => setAlertData(prev => ({ ...prev, open }))}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{alertData.title}</DialogTitle>
                                <DialogDescription>
                                    {alertData.description}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button onClick={() => setAlertData(prev => ({ ...prev, open: false }))}>Tutup</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}

export default function ListTOBPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ListTOBContent />
        </Suspense>
    )
}