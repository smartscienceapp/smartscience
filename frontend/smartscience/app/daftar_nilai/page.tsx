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
import { Loader2, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

// --- Interfaces ---
interface MataPelajaran {
    id_mapel: number;
    nama_mapel: string;
}

interface TOB {
    id_tob: number;
    nama_tob: string;
}

interface KelasItem {
    id_kelas: number;
    nama_kelas: string;
}

interface NilaiSiswa {
    id_user: number;
    nama: string;
    total_correct: number;
    nilai: number;
}

// Interface Pagination Meta
interface PaginationMeta {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
}

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
}

export const dynamic = "force-dynamic";

export function ListTOBContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)

    // State Data
    const [listKelas, setListKelas] = useState<KelasItem[]>([])
    const [listMapel, setListMapel] = useState<MataPelajaran[]>([])
    const [listTOB, setListTOB] = useState<TOB[]>([])
    const [dataDaftarNilai, setDataDaftarNilai] = useState<NilaiSiswa[]>([])

    // State Filter
    const [selectedKelasId, setSelectedKelasId] = useState<string>("")
    const [selectedMapelId, setSelectedMapelId] = useState<string>("")
    const [selectedTobId, setSelectedTobId] = useState<string>("")

    // State Pagination
    const [pagination, setPagination] = useState<PaginationMeta>({
        page: 1,
        limit: 10, // Default 10 per halaman
        total_items: 0,
        total_pages: 0
    })

    // 1. Initial Load (List Kelas)
    useEffect(() => {
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
    }, [API_URL])

    const handleKelasChange = async (value: string) => {
        setSelectedKelasId(value)
        setSelectedMapelId("")
        setSelectedTobId("")
        setListMapel([])
        setListTOB([])
        setDataDaftarNilai([])
        setPagination(prev => ({ ...prev, page: 1, total_items: 0, total_pages: 0 }))

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
        setSelectedTobId("")
        setListTOB([])
        setDataDaftarNilai([])
        setPagination(prev => ({ ...prev, page: 1, total_items: 0, total_pages: 0 }))

        try {
            const payload = { id_mapel: parseInt(value), id_kelas: parseInt(selectedKelasId) }
            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_tob`, payload)

            if (response.data && response.data.tob) {
                setListTOB(response.data.tob)
            } else if (Array.isArray(response.data)) {
                setListTOB(response.data)
            }
        } catch (error) {
            console.error("Error fetching TOB List:", error)
        }
    }

    // Fungsi Fetch Data (Reusable untuk Button Click & Pagination Click)
    const fetchDataNilai = async (page: number) => {
        if (!selectedTobId) return

        setIsLoading(true)
        // Jangan kosongkan table saat ganti page agar UX lebih smooth (opsional)
        // setDataDaftarNilai([]) 

        try {
            const payload = {
                id_tob: parseInt(selectedTobId),
                page: page,
                limit: pagination.limit
            }
            const response = await axios.post(`${API_URL}/api/v2/daftar_nilai/daftar_nilai`, payload)

            // Handle Response baru { data: [], meta: {} }
            if (response.data && response.data.data) {
                setDataDaftarNilai(response.data.data)

                // Update pagination state dari backend
                if (response.data.meta) {
                    setPagination({
                        page: response.data.meta.page,
                        limit: response.data.meta.limit,
                        total_items: response.data.meta.total_items,
                        total_pages: response.data.meta.total_pages
                    })
                }
            } else {
                setDataDaftarNilai([])
                alert("Format data tidak sesuai.")
            }
        } catch (error) {
            console.error("Error fetching nilai:", error)
            alert("Gagal memuat data nilai.")
        } finally {
            setIsLoading(false)
        }
    }

    // Trigger saat tombol "Tampilkan Nilai" diklik (Reset ke halaman 1)
    const handleCariNilai = () => {
        fetchDataNilai(1)
    }

    // Trigger saat tombol Next/Prev diklik
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            fetchDataNilai(newPage)
        }
    }

    const handlePreviewSiswa = (idSiswa: number) => {
        if (!selectedTobId || !selectedMapelId) return;
        router.push(`/tob/preview_hasil_tob?id_user=${idSiswa}&id_tob=${selectedTobId}&id_mapel=${selectedMapelId}`)
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Daftar Nilai Siswa</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-6 bg-background">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {/* CARD FILTER */}
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader>
                                <CardTitle>Filter Data Nilai</CardTitle>
                                <CardDescription>Pilih parameter untuk melihat hasil ujian siswa.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Kelas</Label>
                                        <SearchableSelect
                                            placeholder="-- Pilih Kelas --"
                                            searchPlaceholder="Cari kelas..."
                                            emptyMessage="Kelas tidak ditemukan."
                                            value={selectedKelasId}
                                            onChange={handleKelasChange} // Langsung pass function handleKelasChange
                                            options={listKelas.map(k => ({
                                                label: k.nama_kelas,
                                                value: k.id_kelas.toString()
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Mata Pelajaran</Label>
                                        <SearchableSelect
                                            placeholder="-- Pilih Mapel --"
                                            searchPlaceholder="Cari mapel..."
                                            emptyMessage="Mapel tidak ditemukan."
                                            value={selectedMapelId}
                                            onChange={handleMapelChange}
                                            disabled={!selectedKelasId}
                                            options={listMapel.map(m => ({
                                                label: m.nama_mapel,
                                                value: m.id_mapel.toString()
                                            }))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Nama TOB</Label>
                                        <SearchableSelect
                                            placeholder="-- Pilih TOB --"
                                            searchPlaceholder="Cari TOB..."
                                            emptyMessage="TOB tidak ditemukan."
                                            value={selectedTobId}
                                            onChange={setSelectedTobId}
                                            disabled={!selectedMapelId || listTOB.length === 0}
                                            options={listTOB.map(t => ({
                                                label: t.nama_tob,
                                                value: t.id_tob.toString()
                                            }))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button onClick={handleCariNilai} disabled={!selectedTobId || isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Tampilkan Nilai
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
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[50px] text-center">No</TableHead>
                                                <TableHead>Nama Siswa</TableHead>
                                                <TableHead className="text-center">Total Benar</TableHead>
                                                <TableHead className="text-center">Nilai Akhir</TableHead>
                                                <TableHead className="text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : dataDaftarNilai.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        {selectedTobId
                                                            ? "Belum ada data nilai."
                                                            : "Silakan pilih Filter dan klik 'Tampilkan Nilai'."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                dataDaftarNilai.map((siswa, index) => (
                                                    <TableRow key={index}>
                                                        {/* Hitung nomor urut berdasarkan page */}
                                                        <TableCell className="text-center">
                                                            {(pagination.page - 1) * pagination.limit + index + 1}
                                                        </TableCell>
                                                        <TableCell className="font-medium uppercase">{siswa.nama}</TableCell>
                                                        <TableCell className="text-center font-mono">
                                                            {siswa.total_correct}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-primary">
                                                            {siswa.nilai}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePreviewSiswa(siswa.id_user)}
                                                            >
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Preview
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* PAGINATION CONTROLS */}
                                {pagination.total_pages > 1 && (
                                    <div className="flex items-center justify-end space-x-2 py-4">
                                        <div className="text-sm text-muted-foreground mr-4">
                                            Halaman {pagination.page} dari {pagination.total_pages} (Total: {pagination.total_items})
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page <= 1 || isLoading}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.total_pages || isLoading}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
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