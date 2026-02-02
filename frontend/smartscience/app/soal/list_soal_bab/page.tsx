"use client";

import { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Loader2, Search } from "lucide-react"
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

// --- Interfaces ---
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

export const dynamic = "force-dynamic";

export function ListSoalContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    
    // --- States ---
    const [isLoading, setIsLoading] = useState(false)
    const [toDelete, setToDelete] = useState<number | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    
    // Alerts
    const [alertOpen, setAlertOpen] = useState(false)
    const [alertData, setAlertData] = useState({
        title: "",
        description: "",
        isSuccess: false
    })

    // Dropdown Data
    const [kelasList, setKelasList] = useState<Kelas[]>([])
    const [openKelas, setOpenKelas] = useState(false)
    const [isKelasLoading, setIsKelasLoading] = useState(false)
    
    const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([])
    const [openMapel, setOpenMapel] = useState(false)
    const [isMapelLoading, setIsMapelLoading] = useState(false)
    
    const [babList, setBabList] = useState<Bab[]>([])
    const [openBab, setOpenBab] = useState(false)
    const [isBabLoading, setIsBabLoading] = useState(false)

    // Form Selection
    const [formData, setFormData] = useState({
        id_kelas: "",
        nama_kelas: "",
        id_mapel: "",
        nama_mapel: "",
        id_bab: "",
        nama_bab: "",
    })

    // --- Pagination & Search States (NEW) ---
    const [soalList, setSoalList] = useState<Soal[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const searchParams = useSearchParams()

    // --- Effects ---

    // 1. Initial Fetch (Kelas & Token)
    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                jwtDecode<DecodedToken>(token)
            } catch (error) {
                setAlertData({ title: "Gagal", description: "Token invalid", isSuccess: false })
                setAlertOpen(true)
            }
        }
        
        const fetchKelas = async () => {
            setIsKelasLoading(true)
            try {
                const kelasRes = await axios.post(`${API_URL}/api/v1/kelas/list_kelas`)
                if (kelasRes.data?.kelas) {
                    setKelasList(kelasRes.data.kelas)
                } else if (Array.isArray(kelasRes.data)) {
                    setKelasList(kelasRes.data)
                }
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || "Terjadi kesalahan koneksi.";
                setAlertData({ title: "Gagal", description: errorMessage, isSuccess: false })
                setAlertOpen(true)
            } finally {
                setIsKelasLoading(false)
            }
        }
        fetchKelas()
    }, [API_URL])

    // 2. Restore State from URL Params
    useEffect(() => {
        const paramKelas = searchParams.get("id_kelas");
        const paramMapel = searchParams.get("id_mapel");
        const paramBab = searchParams.get("id_bab");

        if (paramKelas && paramMapel && paramBab) {
            // Only set if we have kelasList loaded to verify existence (optional)
            if (kelasList.length > 0) {
                 setFormData(prev => ({ ...prev, id_kelas: paramKelas, id_mapel: paramMapel, id_bab: paramBab }));
                 // Trigger fetch for page 1 immediately
                 handleFilter(undefined, { id_bab: paramBab, page: 1 });
            }
        }
    }, [searchParams, kelasList]);

    // 3. Debounce Search Input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500) // 500ms delay
        return () => clearTimeout(timer)
    }, [searchQuery])

    // 4. Trigger Search when Debounced value changes
    useEffect(() => {
        // Only search if a Bab is selected
        if (formData.id_bab) {
            // Always reset to page 1 when searching
            handleFilter(undefined, { page: 1 }) 
        }
    }, [debouncedSearch])


    // --- Handlers ---

    const handleKelasChange = async (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${value}`)
        const nama_kelas = kelasList.find((k) => k.id_kelas.toString() === value)?.nama_kelas || ""
        setFormData((prev) => ({ 
            ...prev, id_kelas: value, nama_kelas: nama_kelas, 
            id_mapel: "", nama_mapel: "", id_bab: "", nama_bab: "" 
        }))
        setMataPelajaranList([])
        setBabList([])
        setSoalList([])
        setPagination(prev => ({ ...prev, page: 1, totalPages: 0, totalItems: 0 }))

        setIsMapelLoading(true)
        try {
            const payload = { id_kelas: parseInt(value) }
            const response = await axios.post(`${API_URL}/api/v1/mapel/list_mapel`, payload)
            if (response.data?.mapel) setMataPelajaranList(response.data.mapel)
            else if (Array.isArray(response.data)) setMataPelajaranList(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsMapelLoading(false)
        }
    }

    const handleMataPelajaranChange = async (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${formData.id_kelas}&id_mapel=${value}`)
        const nama_mapel = mataPelajaranList.find((k) => k.id_mapel.toString() === value)?.nama_mapel || ""
        setFormData((prev) => ({ ...prev, id_mapel: value, nama_mapel: nama_mapel, id_bab: "", nama_bab: "" }))
        setBabList([])
        setSoalList([])
        setPagination(prev => ({ ...prev, page: 1, totalPages: 0, totalItems: 0 }))

        setIsBabLoading(true)
        try {
            const payload = { id_mapel: parseInt(value), id_kelas: parseInt(formData.id_kelas) }
            const response = await axios.post(`${API_URL}/api/v1/bab/list_bab`, payload)
            if (response.data?.bab) setBabList(response.data.bab)
            else if (Array.isArray(response.data)) setBabList(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsBabLoading(false)
        }
    }

    const handleBabChange = (value: string) => {
        router.push(`/soal/list_soal_bab?id_kelas=${formData.id_kelas}&id_mapel=${formData.id_mapel}&id_bab=${value}`)
        const nama_bab = babList.find((mp) => mp.id_bab.toString() === value)?.nama_bab || ""
        setFormData((prev) => ({ ...prev, id_bab: value, nama_bab: nama_bab }))
        
        // Reset search and page when changing Bab
        setSearchQuery("")
        setDebouncedSearch("")
        handleFilter(undefined, { id_bab: value, page: 1 })
    }

    // --- Main Fetch/Filter Function ---
    const handleFilter = async (
        e?: React.FormEvent, 
        overrides?: { id_bab?: string, page?: number }
    ) => {
        if (e) e.preventDefault()
        
        const targetBabId = overrides?.id_bab ?? formData.id_bab
        const targetPage = overrides?.page ?? pagination.page
        
        if (!targetBabId) return

        setIsLoading(true)
        try {
            const payload = { 
                id_bab: Number(targetBabId),
                page: targetPage,
                limit: pagination.limit,
                search: searchQuery // Send current search query
            }
            
            const response = await axios.post(`${API_URL}/api/v1/soal/list_soal`, payload)
            
            // Handle response based on the NEW structure
            if (response.data?.data) {
                setSoalList(response.data.data)
                setPagination(prev => ({
                    ...prev,
                    page: response.data.pagination.current_page,
                    totalPages: response.data.pagination.total_pages,
                    totalItems: response.data.pagination.total_items
                }))
            } else if (Array.isArray(response.data)) {
                // Fallback for old API if needed
                setSoalList(response.data)
                setPagination(prev => ({ ...prev, totalPages: 1, totalItems: response.data.length }))
            } else {
                setSoalList([])
                setPagination(prev => ({ ...prev, totalPages: 0, totalItems: 0 }))
            }
        } catch (error: any) {
            setSoalList([])
            setPagination(prev => ({ ...prev, totalPages: 0, totalItems: 0 }))
        } finally {
            setIsLoading(false)
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }))
            handleFilter(undefined, { page: newPage })
        }
    }

    const handleDeleteClick = async (id_soal: number) => {
        setToDelete(id_soal)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        try {
            const payload = { id_soal: Number(toDelete) }
            await axios.post(`${API_URL}/api/v1/soal/delete_soal`, payload)
            // Refresh current page after delete
            handleFilter(undefined, { page: pagination.page })
        } catch (error: any) {
            setAlertData({
                title: "Gagal",
                description: "Gagal menghapus soal.",
                isSuccess: false
            })
            setAlertOpen(true)
        } finally {
            setDeleteDialogOpen(false)
            setToDelete(null)
        }
    }
    
    const handleAlertClose = () => {
        setAlertOpen(false)
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

                <main className="flex-1 p-4 md:p-6 bg-background">
                    <div className="mx-auto max-w-6xl space-y-6">
                        
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
                                onClick={() => router.push("/dashboard")}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </div>

                        {/* --- CARD FILTER --- */}
                        <Card className="border-t-4 border-t-primary shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>Pilih parameter berikut untuk menampilkan soal.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {/* Dropdown Kelas */}
                                    <div className="space-y-2">
                                        <Label>Kelas <span className="text-red-500">*</span></Label>
                                        <Popover open={openKelas} onOpenChange={setOpenKelas}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openKelas} className="w-full justify-between">
                                                    {formData.id_kelas
                                                        ? kelasList.find((k) => k.id_kelas.toString() === formData.id_kelas)?.nama_kelas || formData.nama_kelas
                                                        : "Pilih Kelas"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari kelas..." />
                                                    <CommandList>
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
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.id_kelas === k.id_kelas.toString() ? "opacity-100" : "opacity-0")} />
                                                                    {k.nama_kelas}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Dropdown Mapel */}
                                    <div className="space-y-2">
                                        <Label>Mata Pelajaran <span className="text-red-500">*</span></Label>
                                        <Popover open={openMapel} onOpenChange={setOpenMapel}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openMapel} className="w-full justify-between" disabled={!formData.id_kelas}>
                                                    {formData.id_mapel
                                                        ? mataPelajaranList.find((k) => k.id_mapel.toString() === formData.id_mapel)?.nama_mapel || formData.nama_mapel
                                                        : "Pilih Mapel"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari mapel..." />
                                                    <CommandList>
                                                        <CommandEmpty>Mapel tidak ditemukan.</CommandEmpty>
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
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.id_mapel === k.id_mapel.toString() ? "opacity-100" : "opacity-0")} />
                                                                    {k.nama_mapel}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Dropdown Bab */}
                                    <div className="space-y-2">
                                        <Label>Bab <span className="text-red-500">*</span></Label>
                                        <Popover open={openBab} onOpenChange={setOpenBab}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={openBab} className="w-full justify-between" disabled={!formData.id_mapel}>
                                                    <span className="truncate">
                                                        {formData.id_bab
                                                            ? babList.find((k) => k.id_bab.toString() === formData.id_bab)?.nama_bab || formData.nama_bab
                                                            : "Pilih Bab"}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari bab..." />
                                                    <CommandList>
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
                                                                    <Check className={cn("mr-2 h-4 w-4", formData.id_bab === k.id_bab.toString() ? "opacity-100" : "opacity-0")} />
                                                                    {k.nama_bab}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Label htmlFor="search-soal">Cari Soal</Label>
                                    <div className="relative mt-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search-soal"
                                            placeholder="Ketik kata kunci isi soal..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                            disabled={!formData.id_bab} // Disable if Bab not selected
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* --- CARD TABLE --- */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[80px] text-center">ID</TableHead>
                                                <TableHead>Isi Soal</TableHead>
                                                <TableHead className="w-[80px] text-center">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : soalList.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                        {formData.id_bab 
                                                            ? "Tidak ada soal ditemukan." 
                                                            : "Silakan pilih filter Kelas, Mapel, dan Bab terlebih dahulu."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                // Map directly over soalList (search is now server-side)
                                                soalList.map((item) => (
                                                    <TableRow key={item.id_soal}>
                                                        <TableCell className="text-center font-medium">{item.id_soal}</TableCell>
                                                        <TableCell>
                                                            <div className="max-w-[300px] md:max-w-[500px] truncate" title={item.nama_soal}>
                                                                {item.nama_soal}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDeleteClick(item.id_soal)}
                                                            >
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

                            {/* --- PAGINATION CONTROLS --- */}
                            {soalList.length > 0 && (
                                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                                    <div className="flex-1 text-sm text-muted-foreground">
                                        Halaman {pagination.page} dari {pagination.totalPages} ({pagination.totalItems} Data)
                                    </div>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page <= 1 || isLoading}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            Prev
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.totalPages || isLoading}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Dialogs */}
                    <Dialog open={alertOpen} onOpenChange={(open) => !open && handleAlertClose()}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{alertData.title}</DialogTitle>
                                <DialogDescription>{alertData.description}</DialogDescription>
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
                                    Apakah Anda yakin ingin menghapus soal ID <b>{toDelete}</b>? Tindakan ini tidak dapat dibatalkan.
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

export default function ListSoalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ListSoalContent />
        </Suspense>
    )
}