"use client";

import { useEffect, useState, Suspense} from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, Trash2, Plus, Loader2 } from "lucide-react"
import "katex/dist/katex.min.css"
import Latex from "react-latex-next"

// --- Interfaces ---
interface SoalTOB {
    id_soal: number;
    isi_soal: string;
    nama_mapel: string;
    nama_kelas: string;
}

export const dynamic = "force-dynamic";

export function ListSoalContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const id_tob = searchParams.get("id_tob")
    const id_kelas = searchParams.get("id_kelas")
    const id_mapel = searchParams.get("id_mapel") 

    const [listSoal, setListSoal] = useState<SoalTOB[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [soalToDelete, setSoalToDelete] = useState<number | null>(null)

    useEffect(() => {
        if (id_tob) {
            fetchSoal(parseInt(id_tob))
        }
    }, [id_tob])

    const fetchSoal = async (id: number) => {
        setIsLoading(true)
        try {
            const response = await axios.post(`${API_URL}/api/v1/tob/post/list_soal_tob`, {
                id_tob: id
            })
            if (response.data && response.data.soaltob) {
                // Filter duplicates based on id_soal
                const uniqueSoal = response.data.soaltob.filter((soal: SoalTOB, index: number, self: SoalTOB[]) =>
                    index === self.findIndex((t) => t.id_soal === soal.id_soal)
                )
                setListSoal(uniqueSoal)
            } else {
                setListSoal([])
            }
        } catch (error) {
            console.error("Gagal load soal:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteClick = (id_soal: number) => {
        setSoalToDelete(id_soal)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!id_tob || !soalToDelete) return

        try {
            await axios.post(`${API_URL}/api/v1/tob/delete_soal_tob`, {
                id_soal: soalToDelete,
                id_tob: parseInt(id_tob)
            })
            fetchSoal(parseInt(id_tob))
        } catch (error) {
            console.error("Gagal menghapus soal:", error) 
        } finally {
            setDeleteDialogOpen(false)
            setSoalToDelete(null)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Daftar Soal TOB</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background relative">
                    <div className="max-w-5xl mx-auto space-y-6 pb-16">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle>Soal-soal dalam TOB</CardTitle>
                                <Button onClick={() => router.push(`/soal/tambah_soal?id_tob=${id_tob}`)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Soal
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">No</TableHead>
                                                <TableHead>Isi Soal</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead>Kelas</TableHead>
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
                                            ) : listSoal.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        Tidak ada soal ditemukan.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                listSoal.map((soal, index) => (
                                                    <TableRow key={soal.id_soal}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell className="max-w-md truncate" title={soal.isi_soal}><Latex>{soal.isi_soal}</Latex></TableCell>
                                                        <TableCell>{soal.nama_mapel}</TableCell>
                                                        <TableCell>{soal.nama_kelas}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button variant="outline" size="sm" onClick={() => router.push(`/soal/edit_soal?id_soal=${soal.id_soal}`)}>
                                                                    Edit Soal
                                                                </Button>
                                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(soal.id_soal)}>
                                                                    <Trash2 className="h-4 w-4" />
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
                    <div className="fixed bottom-6 right-6">
                        <Button onClick={() => router.push(`/tob/list_tob?id_kelas=${id_kelas}&id_mapel=${id_mapel}`)} size="lg">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke List TOB
                        </Button>
                    </div>

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus soal ini dari TOB? Tindakan ini tidak dapat dibatalkan.
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

export default function ListSoalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ListSoalContent />
        </Suspense>
    )
}