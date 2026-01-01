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
import { ArrowLeft, Trash2, Loader2, Plus } from "lucide-react"

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

interface Bab {
    id_bab: number,
    nama_bab: string,
}

interface Soal {
    id_soal: number;
    nama_soal: string;
}

export default function ListSoalPage() {
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
    const [openMapel, setOpenMapel] = useState(false)
    const [isMapelLoading, setIsMapelLoading] = useState(false)
    const [babList, setBabList] = useState<Bab[]>([])
    const [openBab, setOpenBab] = useState(false)
    const [isBabLoading, setIsBabLoading] = useState(false)
    const [soalList, setSoalList] = useState<Soal[]>([])

    const [formData, setFormData] = useState({
        id_kelas: "",
        nama_kelas: "",
        id_mapel: "",
        nama_mapel: "",
        id_bab: "",
        nama_bab: "",
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
        const paramMapel = searchParams.get("id_mapel");
        const paramBab = searchParams.get("id_bab");

        if (paramKelas && paramMapel && paramBab) {
            if (kelasList.length > 0 && mataPelajaranList.length > 0 && babList.length > 0) {
                setFormData(prev => ({ ...prev, id_kelas: paramKelas, id_mapel: paramMapel, id_bab: paramBab }));
                handleFilter(undefined, { id_bab: paramBab });
            }
        }
    }, [searchParams]);

    const handleKelasChange = async (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${value}`)
        const nama_kelas = kelasList.find((k) => k.id_kelas.toString() === value)?.nama_kelas || ""
        setFormData((prev) => ({ ...prev, id_kelas: value, nama_kelas: nama_kelas }))
        setMataPelajaranList([])
        setBabList([])
        setSoalList([])
        setIsMapelLoading(true)

        try {
            const payload = { id_kelas: parseInt(value) }
            const response = await axios.post(`${API_URL}/api/v1/mapel/list_mapel`, payload)
            if (response.data?.mapel) {
                setMataPelajaranList(response.data.mapel)
            } else if (Array.isArray(response.data)) {
                setMataPelajaranList(response.data)
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
            setIsMapelLoading(false)
        }
    }

    const handleMataPelajaranChange = async (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${formData.id_kelas}&id_mapel=${value}`)
        const nama_mapel = mataPelajaranList.find((k) => k.id_mapel.toString() === value)?.nama_mapel || ""
        setFormData((prev) => ({ ...prev, id_mapel: value, nama_mapel: nama_mapel }))
        setIsBabLoading(true)

        try {
            const payload = { id_mapel: parseInt(value), id_kelas: parseInt(formData.id_kelas) }
            const response = await axios.post(`${API_URL}/api/v1/bab/list_bab`, payload)
            if (response.data?.bab) {
                setBabList(response.data.bab)
            } else if (Array.isArray(response.data)) {
                setBabList(response.data)
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
            setIsBabLoading(false)
        }
    }

    const handleBabChange = (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${formData.id_kelas}&id_mapel=${formData.id_mapel}&id_bab=${value}`)
        const nama_bab = babList.find((mp) => mp.id_bab.toString() === value)?.nama_bab || ""
        setFormData((prev) => ({ ...prev, id_bab: value, nama_bab: nama_bab }))
    }

    const handleFilter = async (e?: React.FormEvent, filterIds?: { id_bab: string }) => {
        if (e) e.preventDefault()
        if (!formData.id_bab || !formData.id_kelas || !formData.id_mapel) {
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
                id_bab: Number(filterIds ? filterIds.id_bab : formData.id_bab),
            }
            console.log(payload)
            const response = await axios.post(`${API_URL}/api/v1/soal/list_soal`, payload)
            if (response.data && response.data.soal) {
                setSoalList(response.data.soal)
            } else if (Array.isArray(response.data)) {
                setSoalList(response.data)
            } else {
                setSoalList([])
                setAlertData({
                    title: "Gagal",
                    description: "Soal tidak ditemukan untuk mata pelajaran, kelas, dan bab ini.",
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
            router.push("/bab/list_bab")
            router.refresh()
        }
    }

    const handleDeleteClick = async (id_bab: number) => {
        setToDelete(id_bab)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            const payload = {
                id_bab: Number(toDelete)
            }
            await axios.post(`${API_URL}/api/v1/soal/delete_soal`, payload)
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
                    <h1 className="text-xl font-semibold md:text-2xl">List Soal</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">
                    <div className="mx-auto max-w-auto">
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
                                <CardDescription>Pilih kelas, mata pelajaran dan bab untuk melihat soal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="kelas">Kelas <span className="text-red-500">*</span></Label>
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

                                    <div className="space-y-2">
                                        <Label htmlFor="mata_pelajaran">Mata Pelajaran <span className="text-red-500">*</span></Label>
                                        <Popover open={openMapel} onOpenChange={setOpenMapel}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openMapel}
                                                    className="w-full justify-between"
                                                    disabled={!formData.id_kelas}
                                                >
                                                    {formData.id_mapel
                                                        ? mataPelajaranList.find((k) => k.id_mapel.toString() === formData.id_mapel)?.nama_mapel
                                                        : "Pilih Mata Pelajaran"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari mata pelajaran..." />
                                                    <CommandList>
                                                        {isMapelLoading ? (
                                                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Memuat data mata pelajaran...
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <CommandEmpty>Mata pelajaran tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {mataPelajaranList.map((k) => (
                                                                        <CommandItem
                                                                            key={k.id_mapel}
                                                                            value={k.nama_mapel}
                                                                            onSelect={() => {
                                                                                handleMataPelajaranChange(k.id_mapel.toString())
                                                                                setOpenMapel(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formData.id_mapel === k.id_mapel.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {k.nama_mapel}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </>)}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bab">Bab<span className="text-red-500">*</span></Label>
                                        <Popover open={openBab} onOpenChange={setOpenBab}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openMapel}
                                                    className="w-full justify-between"
                                                    disabled={!formData.id_mapel}
                                                >
                                                    {formData.id_bab
                                                        ? babList.find((k) => k.id_bab.toString() === formData.id_bab)?.nama_bab
                                                        : "Pilih Bab"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari bab..." />
                                                    <CommandList>
                                                        {isMapelLoading ? (
                                                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Memuat data bab
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <CommandEmpty>Bab tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {babList.map((k) => (
                                                                        <CommandItem
                                                                            key={k.id_bab}
                                                                            value={k.nama_bab}
                                                                            onSelect={() => {
                                                                                handleBabChange(k.id_bab.toString())
                                                                                setOpenBab(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formData.id_bab === k.id_bab.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {k.nama_bab}
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
                                                <TableHead>ID Soal</TableHead>
                                                <TableHead>Kelas</TableHead>
                                                <TableHead>Mata Pelajaran</TableHead>
                                                <TableHead>Bab</TableHead>
                                                <TableHead>Nama Soal</TableHead>
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
                                                soalList.map((item) => (
                                                    <TableRow key={item.id_soal}>
                                                        <TableCell className="font-medium">{item.id_soal}</TableCell>
                                                        <TableCell>{formData.nama_kelas || "-"}</TableCell>
                                                        <TableCell>{formData.nama_mapel || "-"}</TableCell>
                                                        <TableCell>{formData.nama_bab || "-"}</TableCell>
                                                        <TableCell>{item.nama_soal}</TableCell>
                                                        <TableCell  className="w-[50px]">
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item.id_soal)}>
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
                                    Apakah Anda yakin ingin menghapus soal ini dari database? Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                                <Button variant="destructive" onClick={confirmDelete}>Hapus</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div >
        </div >
    )
}