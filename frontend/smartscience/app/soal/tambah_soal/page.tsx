"use client";

import { useEffect, useState, Suspense} from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, RefreshCcw, Plus, Loader2} from "lucide-react"

// --- Interfaces ---
interface MataPelajaran {
    id_mapel: number;
    nama_mapel: string;
}

interface Bab {
    id_bab: number;
    nama_bab: string;
}

interface KelasItem {
    id_kelas: number;
    nama_kelas: string;
}

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
}

interface Soal {
    id_soal: number;
    isi_soal: string;
}

export const dynamic = "force-dynamic";

export function TambahSoalContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const id_tob = searchParams.get("id_tob")
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [soalToPlus, setSoalToPlus] = useState<number | null>(null)
    const [plusDialogOpen, setPlusDialogOpen] = useState(false)

    // State Data
    const [listSoal, setListSoal] = useState<Soal[]>([])
    const [listKelas, setListKelas] = useState<KelasItem[]>([])
    const [listMapel, setListMapel] = useState<MataPelajaran[]>([])
    const [listBab, setListBab] = useState<Bab[]>([])
    const [listSoalTOB, setListSoalTOB] = useState<Soal[]>([])

    // State Filter
    const [selectedKelasId, setSelectedKelasId] = useState<string>("")
    const [selectedMapelId, setSelectedMapelId] = useState<string>("")
    const [selectedBabId, setSelectedBabId] = useState<string>("")

    const [formData, setFormData] = useState({
        id_kelas: "",
    })
    // 1. Cek Token & Load Data Kelas untuk Dropdown
    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                setCurrentUser(decoded.sub || decoded.username || decoded.role || "unknown")
            } catch (error) {
                console.error("Token invalid:", error)
            }
        }

        // Ambil list kelas untuk mengisi Dropdown Filter
        const fetchKelasOptions = async () => {
            try {
                const res = await axios.post(`${API_URL}/api/v1/kelas/list_kelas`)
                if (res.data && res.data.kelas) {
                    setListKelas(res.data.kelas)
                }
            } catch (error) {
                console.error("Gagal load opsi kelas:", error)
            }
        }

        fetchKelasOptions()
    }, [])

    const handleKelasChange = async (value: string) => {
        setSelectedKelasId(value)
        setSelectedMapelId("")
        setListMapel([])
        setListBab([])
        setListSoal([]) 

        try {
            const payload = { id_kelas: parseInt(value) }
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

    const handleMapelChange = async (value: string) => {
        setSelectedMapelId(value)
        setSelectedBabId("")
        setListSoal([])
        try {
            const payload = { id_mapel: parseInt(value), id_kelas: parseInt(selectedKelasId)}
            const response = await axios.post(`${API_URL}/api/v1/bab/list_bab`, payload)
            if (response.data && response.data.bab) {
                setListBab(response.data.bab)
            } else if (Array.isArray(response.data)) {
                setListBab(response.data)
            }
        } catch (error) {
            console.error("Error fetching bab:", error)
        }
    }

    const fetchSoalTOB = async (id: number) => {
        setIsLoading(true)
        try {
            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_soal_tob`, {
                id_tob: id
            })
            if (response.data && response.data.soaltob) {
                setListSoalTOB(response.data.soaltob)
            } else {
                setListSoalTOB([])
            }
        } catch (error) {
            console.error("Gagal load soal:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (id_tob) {
            fetchSoalTOB(parseInt(id_tob))
        }
    }, [id_tob])

    // 2. Fungsi Utama: Filter by Mapel (POST)
    const handleFilter = async () => {
        if (!selectedBabId) {
            alert("Silakan pilih bab terlebih dahulu!")
            return
        }

        setIsLoading(true)
        try {
            const payload = { id_bab: parseInt(selectedBabId) }

            const response = await axios.post(`${API_URL}/api/v1/soal/list_soal`, payload)

            if (response.data && response.data.soal) {
                setListSoal(response.data.soal)
            } else if (Array.isArray(response.data)) {
                setListSoal(response.data)
            } else {
                setListSoal([])
                alert(response.data.message || "Tidak ada soal ditemukan.")
            }
        } catch (error) {
            console.error("Error filtering:", error)
            setListSoal([])
            alert("Gagal memuat data filter.")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePlusClick = async (id_soal: number) => {
        setSoalToPlus(id_soal)
        setPlusDialogOpen(true)
    }

    const confirmPlus = async () => {
        if (!id_tob || !soalToPlus) return

        try {
            await axios.post(`${API_URL}/api/v1/tob/tambah_soal_tob`, {
                id_tob: id_tob,
                id_soal: soalToPlus,
                created_by: currentUser
            })
            fetchSoalTOB(parseInt(id_tob))
        } catch (error) {
            console.error("Gagal menambahkan soal", error)
        }
        finally {
            setPlusDialogOpen(false)
            setSoalToPlus(null)
        }
    }


    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Daftar Soal</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* CARD FILTER */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>Pilih kelas, mata pelajaran dan bab untuk melihat soal.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="filter-kelas">Pilih Kelas</Label>
                                    <Select value={selectedKelasId} onValueChange={handleKelasChange}>
                                        <SelectTrigger id="filter-kelas" className="w-full">
                                            <SelectValue placeholder="-- Pilih Kelas --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {listKelas.map((k) => (
                                                <SelectItem key={k.id_kelas} value={k.id_kelas.toString()}>
                                                    {k.nama_kelas}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="filter-mapel">Pilih Mata Pelajaran</Label>
                                    <Select value={selectedMapelId} onValueChange={handleMapelChange} disabled={!selectedKelasId}>
                                        <SelectTrigger id="filter-mapel" className="w-full">
                                            <SelectValue placeholder="-- Pilih Mapel --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {listMapel.map((m) => (
                                                <SelectItem key={m.id_mapel} value={m.id_mapel.toString()}>
                                                    {m.nama_mapel}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="filter-mapel">Pilih Bab</Label>
                                    <Select value={selectedBabId} onValueChange={setSelectedBabId} disabled={!selectedMapelId}>
                                        <SelectTrigger id="filter-bab" className="w-full">
                                            <SelectValue placeholder="-- Pilih Bab --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {listBab.map((m) => (
                                                <SelectItem key={m.id_bab} value={m.id_bab.toString()}>
                                                    {m.nama_bab}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleFilter} disabled={isLoading || !selectedBabId}>
                                        {isLoading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Cari Soal
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
                                                <TableHead className="w-[100px]">ID Soal</TableHead>
                                                <TableHead>Isi Soal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        Memuat data...
                                                    </TableCell>
                                                </TableRow>
                                            ) : listSoal.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                        {selectedBabId
                                                            ? "Tidak ada soal ditemukan untuk bab ini."
                                                            : "Silakan pilih kelas, mata pelajaran, bab dan klik 'Cari Soal'."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                listSoal
                                                    .filter((item) => !listSoalTOB.some((tob) => tob.id_soal === item.id_soal))
                                                    .map((item) => (
                                                        <TableRow key={item.id_soal}>
                                                            <TableCell className="font-medium">{item.id_soal}</TableCell>
                                                            <TableCell>{item.isi_soal}</TableCell>
                                                            <TableCell>
                                                                <Button onClick={() => handlePlusClick(item.id_soal)}>
                                                                    <Plus className="mr-2 h-4 w-4" />
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
                    <Dialog open={plusDialogOpen} onOpenChange={setPlusDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Konfirmasi Tambah</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin tambah soal ini ke TOB? Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setPlusDialogOpen(false)}>Batal</Button>
                                <Button variant="destructive" onClick={confirmPlus}>Tambah</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div >
        </div >
    )
}

export default function TambahSoalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <TambahSoalContent />
        </Suspense>
    )
}