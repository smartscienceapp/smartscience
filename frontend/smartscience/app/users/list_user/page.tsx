"use client";

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { Search, RefreshCcw, FilterX, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

// --- Interfaces ---
interface User {
    id_user: number;
    username: string;
    nama_kelas?: string;
}

interface RoleItem {
    id_role: number;
    nama_role: string;
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

export default function ListUser() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [open, setOpen] = useState(false)
    // State Data
    const [dataUser, setDataUser] = useState<User[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [listRole, setListRole] = useState<RoleItem[]>([])
    const [listKelas, setListKelas] = useState<KelasItem[]>([]) 
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const itemsPerPage = 10

    // State Filter
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    const [selectedKelasId, setSelectedKelasId] = useState<string>("")
    const [openKelas, setOpenKelas] = useState(false)
    const [formData, setFormData] = useState({
        id_role: "",
    })
    const [userToDelete, setUserToDelete] = useState<number | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    
    // Cek apakah role yang dipilih adalah guru
    const isGuru = listRole.find((r) => r.id_role.toString() === selectedRoleId)?.nama_role.toLowerCase() === "guru"
    const isSiswa = listRole.find((r) => r.id_role.toString() === selectedRoleId)?.nama_role.toLowerCase() === "siswa"

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
        
        const fetchRoleOptions = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:8000/api/v1/users/get_role_detail")
                if (res.data && res.data.roles) {
                    setListRole(res.data.roles)
                } 
            } catch (error) {
                console.error("Gagal load opsi role:", error)
            }
        }

        const fetchKelasOptions = async () => {
            try {
                const res = await axios.post("http://127.0.0.1:8000/api/v1/kelas/list_kelas")
                if (res.data && res.data.kelas) {
                    setListKelas(res.data.kelas)
                } else if (Array.isArray(res.data)) {
                    setListKelas(res.data)
                }
            } catch (error) {
                console.error("Gagal load opsi kelas:", error)
            }
        }

        fetchRoleOptions()
        fetchKelasOptions()
    }, [])

    // Effect untuk Fetch Data User (Server-side Pagination & Filtering)
    useEffect(() => {
        if (!selectedRoleId) {
            setDataUser([])
            return
        }

        const fetchUsers = async () => {
            setIsLoading(true)
            try {
                const payload = { 
                    id_role: parseInt(selectedRoleId),
                    id_kelas: selectedKelasId ? parseInt(selectedKelasId) : undefined,
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchQuery // Mengirim search query ke backend
                }

                const response = await axios.post("http://127.0.0.1:8000/api/v1/users/list_user", payload)

                if (response.data && response.data.users) {
                    setDataUser(response.data.users)
                    setTotalPages(response.data.total_pages || 1)
                } else {
                    setDataUser([])
                    setTotalPages(1)
                }
            } catch (error) {
                console.error("Error fetching users:", error)
                setDataUser([])
            } finally {
                setIsLoading(false)
            }
        }

        // Debounce search agar tidak spam API setiap ketik
        const timeoutId = setTimeout(() => {
            fetchUsers()
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [selectedRoleId, selectedKelasId, currentPage, searchQuery])

    // Handler ganti role (hanya set state, useEffect yang akan fetch)
    const handleRoleChange = (value: string) => {
        setFormData((prev) => ({ ...prev, id_role: value }))
        setSelectedRoleId(value)
        setSelectedKelasId("") // Reset kelas saat ganti role
        setCurrentPage(1) // Reset ke halaman 1
    }

    const handleDeleteClick = (id_user: number) => {
        setUserToDelete(id_user)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!userToDelete) return

        try {
            await axios.post("http://127.0.0.1:8000/api/v1/users/delete_user", {
                id_user: userToDelete
            })
            // Refresh data
            if (selectedRoleId) {
                // Trigger re-fetch via effect dependency update (hacky but works, or extract fetchUsers)
                // Cara termudah: toggle currentPage atau biarkan user refresh manual. 
                // Idealnya fetchUsers dipanggil ulang. Kita bisa set search query ulang sebentar atau reload page.
                window.location.reload() 
            }
        } catch (error) {
            console.error("Gagal menghapus user", error)
            alert("Gagal menghapus user")
        } finally {
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Daftar User</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* CARD FILTER */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Filter Data</CardTitle>
                                <CardDescription>Pilih detail untuk melihat list user.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="filter-kelas">Pilih Role</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between"
                                            >
                                                {formData.id_role
                                                    ? listRole.find((k) => k.id_role.toString() === formData.id_role)?.nama_role
                                                    : "Pilih Role"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Cari kelas..." />
                                                <CommandList>
                                                    <CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
                                                    <CommandGroup>
                                                        {listRole.map((k) => (
                                                            <CommandItem
                                                                key={k.id_role}
                                                                value={k.nama_role}
                                                                onSelect={() => {
                                                                    handleRoleChange(k.id_role.toString()) 
                                                                    setOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.id_role === k.id_role.toString() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {k.nama_role}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div> 

                                {/* FILTER KELAS (Hanya muncul jika Role = Siswa) */}
                                {isSiswa && (
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="filter-kelas-user">Pilih Kelas</Label>
                                        <Popover open={openKelas} onOpenChange={setOpenKelas}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openKelas}
                                                    className="w-full justify-between"
                                                >
                                                    {selectedKelasId
                                                        ? listKelas.find((k) => k.id_kelas.toString() === selectedKelasId)?.nama_kelas
                                                        : "Semua Kelas"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari kelas..." />
                                                    <CommandList>
                                                        <CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem
                                                                value="Semua Kelas"
                                                                onSelect={() => {
                                                                    setSelectedKelasId("")
                                                                    setOpenKelas(false)
                                                                    setCurrentPage(1)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedKelasId === "" ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Semua Kelas
                                                            </CommandItem>
                                                            {listKelas.map((k) => (
                                                                <CommandItem
                                                                    key={k.id_kelas}
                                                                    value={k.nama_kelas}
                                                                    onSelect={() => {
                                                                        setSelectedKelasId(k.id_kelas.toString())
                                                                        setOpenKelas(false)
                                                                        setCurrentPage(1)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedKelasId === k.id_kelas.toString() ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {k.nama_kelas}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                )}

                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="search-user">Cari Nama User</Label>
                                    <Input
                                        id="search-user"
                                        placeholder="Ketik nama user..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    />
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
                                                <TableHead>ID User</TableHead> 
                                                <TableHead>Nama User</TableHead>
                                                {!isGuru && <TableHead>Kelas User</TableHead>} 
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={isGuru ? 3 : 4} className="h-24 text-center">
                                                        Memuat data...
                                                    </TableCell>
                                                </TableRow>
                                            ) : dataUser.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={isGuru ? 3 : 4} className="h-24 text-center text-muted-foreground"> 
                                                        {dataUser.length === 0 ? "Tidak ada data." : "User tidak ditemukan."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                dataUser.map((item) => (
                                                    <TableRow key={item.id_user}>
                                                        <TableCell className="font-medium">{item.id_user}</TableCell> 
                                                        <TableCell>{item.username}</TableCell>
                                                        {!isGuru && <TableCell>{item.nama_kelas}</TableCell>}
                                                        <TableCell  className="w-[50px]">
                                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item.id_user)}>
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

                        {/* PAGINATION CONTROLS */}
                        {!isLoading && dataUser.length > 0 && (
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    Halaman {currentPage} dari {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Selanjutnya
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
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