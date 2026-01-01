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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
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
import { Search, RefreshCcw, FilterX, Eye, FileText } from "lucide-react"
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
}

export const dynamic = "force-dynamic";

export default function ListTOBPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")

    // State Data
    const [dataTOB, setDataTOB] = useState<TOB[]>([])
    const [listKelas, setListKelas] = useState<KelasItem[]>([])
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

        // Cek URL Params untuk restore state saat kembali dari halaman lain
        const paramKelas = searchParams.get("id_kelas")
        const paramMapel = searchParams.get("id_mapel")

        if (paramKelas) {
            setSelectedKelasId(paramKelas)

            // Fetch Mapel berdasarkan paramKelas
            const fetchMapel = async () => {
                try {
                    const payload = { id_kelas: parseInt(paramKelas) }
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

            if (paramMapel) {
                setSelectedMapelId(paramMapel)
                // Fetch TOB otomatis jika ada param mapel
                const fetchTOB = async () => {
                    setIsLoading(true)
                    try {
                        const payload = { id_mapel: parseInt(paramMapel), id_kelas: parseInt(paramKelas) }
                        const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)
                        if (response.data && response.data.tob) {
                            setDataTOB(response.data.tob)
                        } else if (Array.isArray(response.data)) {
                            setDataTOB(response.data)
                        }
                    } catch (error) {
                        console.error("Error filtering:", error)
                    } finally {
                        setIsLoading(false)
                    }
                }
                fetchTOB()
            }
        }
    }, [])

    const handleKelasChange = async (value: string) => {
        setSelectedKelasId(value)
        setSelectedMapelId("")
        setListMapel([])
        setDataTOB([])

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

    // 2. Fungsi Utama: Filter by Mapel (POST)
    const handleFilter = async (id?: string) => {
        const mapelId = typeof id === "string" ? id : selectedMapelId
        if (!mapelId) {
            alert("Silakan pilih mata pelajaran terlebih dahulu!")
            return
        }

        setIsLoading(true)
        try {
            const payload = { id_mapel: parseInt(mapelId), id_kelas: parseInt(selectedKelasId) }

            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)

            if (response.data && response.data.tob) {
                setDataTOB(response.data.tob)
            } else if (Array.isArray(response.data)) {
                setDataTOB(response.data)
            } else {
                setDataTOB([])
                alert(response.data.message || "Tidak ada tob ditemukan.")
            }
        } catch (error) {
            console.error("Error filtering:", error)
            setDataTOB([])
            alert("Gagal memuat data filter.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleLihatSoal = (id_tob: number) => {
        router.push(`/soal/list_soal?id_tob=${id_tob}&id_kelas=${selectedKelasId}&id_mapel=${selectedMapelId}`)
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">List TOB</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-6 bg-background">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader>
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>Pilih kelas dan mata pelajaran untuk melihat tob.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="filter-mapel">Pilih Mata Pelajaran</Label>
                                        <Select value={selectedMapelId} onValueChange={(val) => {
                                            setSelectedMapelId(val)
                                            handleFilter(val)
                                        }} disabled={!selectedKelasId}>
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
                                                            : "Silakan pilih kelas, mata pelajaran, dan klik 'Cari TOB'."}
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
                                                            <div className="flex gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => handleLihatSoal(item.id_tob)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Lihat Soal
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => router.push(`/tob/preview_tob?id_tob=${item.id_tob}&id_kelas=${selectedKelasId}&id_mapel=${selectedMapelId}`)}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Preview
                                                                </Button>
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
                </main>
            </div>
        </div>
    )
}