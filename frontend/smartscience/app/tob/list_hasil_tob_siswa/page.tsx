"use client";

import { useEffect, useState } from "react"
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
import { Search, RefreshCcw, FilterX, Eye, FileText, Check, ChevronsUpDown } from "lucide-react"
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

export default function ListTOBPage() {
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
    const [openMapel, setOpenMapel] = useState(false)
    const searchParams = useSearchParams()
    // State Data
    const [dataTOB, setDataTOB] = useState<TOB[]>([])
    const [listMapel, setListMapel] = useState<MataPelajaran[]>([])

    // State Filter
    const [selectedKelasId, setSelectedKelasId] = useState<string>("")
    const [selectedMapelId, setSelectedMapelId] = useState<string>("")

    // 1. Cek Token & Load Data Kelas untuk Dropdown
    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                setCurrentUser(decoded.role || "unknown")
                setCurrentKelas(decoded.id_kelas)
                setCurrentUserId(decoded.id_user)
                console.log(decoded.id_kelas)

                if (decoded.id_kelas) {
                    const kelasId = decoded.id_kelas
                    setSelectedKelasId(kelasId.toString())

                    // Fetch Mapel otomatis berdasarkan kelas dari token
                    const fetchMapel = async () => {
                        try {
                            const payload = { id_kelas: kelasId }
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
    }, [])

    const paramMapel = searchParams.get("id_mapel") 

    useEffect(() => {
        if (paramMapel && currentKelas) {
            setSelectedMapelId(paramMapel)
            // Fetch TOB otomatis jika ada param mapel
            const fetchTOB = async () => {
                setIsLoading(true)
                try {
                    const payload = { id_mapel: parseInt(paramMapel), id_kelas: currentKelas }
                    const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)
                    if (response.data && response.data.tob) {
                        setDataTOB(response.data.tob)
                    } else if (Array.isArray(response.data)) {
                        setDataTOB(response.data)
                    } else {
                        setDataTOB([])
                        setAlertData({
                            title: "Informasi",
                            description: "Tidak ada TOB pada Pelajaran ini",
                            isSuccess: false
                        })
                        setAlertOpen(true)
                    }
                } catch (error) {
                    console.error("Error filtering:", error)
                    setDataTOB([])
                    setAlertData({
                        title: "Gagal",
                        description: "Gagal memuat data filter.",
                        isSuccess: false
                    })
                    setAlertOpen(true)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchTOB()
        }

    }, [paramMapel, currentKelas])

    // 2. Fungsi Utama: Filter by Mapel (POST)
    const handleFilter = async (id?: string) => {
        const mapelId = id || selectedMapelId
        if (!mapelId) {
            setAlertData({
                title: "Peringatan",
                description: "Silakan pilih mata pelajaran terlebih dahulu!",
                isSuccess: false
            })
            setAlertOpen(true)
            return
        }

        setIsLoading(true)
        try {
            const payload = { id_mapel: parseInt(mapelId), id_kelas: currentKelas }

            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)

            if (response.data && response.data.tob) {
                setDataTOB(response.data.tob)
            } else if (Array.isArray(response.data)) {
                setDataTOB(response.data)
            } else {
                setDataTOB([])
                setAlertData({
                    title: "Informasi",
                    description: "Tidak ada TOB pada Pelajaran ini",
                    isSuccess: false
                })
                setAlertOpen(true)
            }
        } catch (error) {
            console.error("Error filtering:", error)
            setDataTOB([])
            setAlertData({
                title: "Gagal",
                description: "Gagal memuat data filter.",
                isSuccess: false
            })
            setAlertOpen(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKerjakanSoal = async (id_tob: number) => {
        if (!currentUserId) return

        try {
            const response = await axios.post(`${API_URL}/api/v1/tob/status_pengerjaan`, {
                id_user: currentUserId,
                id_tob
            })

            if (response.data.message === "Belum Mengerjakan") {
                setAlertData({
                    title: "Informasi",
                    description: "Anda belum mengerjakan TOB ini.",
                    isSuccess: false
                })
                setAlertOpen(true)
            } else {
                router.push(`/tob/preview_hasil_tob?id_user=${currentUserId}&id_tob=${id_tob}&id_mapel=${selectedMapelId}`)
            }
        } catch (error) {
            console.error("Error checking status:", error)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Daftar TOB</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* CARD FILTER */}
                        <Card>
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
                                                <CommandInput placeholder="Cari mapel..." />
                                                <CommandList>
                                                    <CommandEmpty>Mapel tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {listMapel.map((m) => (
                                                            <CommandItem
                                                                key={m.id_mapel}
                                                                value={m.nama_mapel}
                                                                onSelect={() => {
                                                                    const val = m.id_mapel.toString()
                                                                    setSelectedMapelId(val)
                                                                    setOpenMapel(false)
                                                                    handleFilter(val)
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
                                <div className="flex gap-2">
                                    <Button onClick={() => handleFilter()} disabled={isLoading || !selectedMapelId}>
                                        {isLoading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Cari TOB
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CARD TABLE HASIL */}
                        <Card>
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
                                                                    Preview Hasil
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
                    <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{alertData.title}</DialogTitle>
                                <DialogDescription>
                                    {alertData.description}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button onClick={() => setAlertOpen(false)}>Tutup</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    )
}