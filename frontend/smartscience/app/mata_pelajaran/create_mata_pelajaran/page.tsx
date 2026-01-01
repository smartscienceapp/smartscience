"use client";

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { ArrowLeft, Loader2, Save } from "lucide-react"

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

export default function CreateMataPelajaranPage() {
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
    const [kelasList, setKelasList] = useState<Kelas[]>([])
    const [openKelas, setOpenKelas] = useState(false)
    const [isKelasLoading, setIsKelasLoading] = useState(false)

    const [formData, setFormData] = useState({
        id_kelas: "",
        nama_mapel: "",
        created_by: ""
    })

    const fetchData = async () => {
        try {
            const kelasRes = await axios.post("http://127.0.0.1:8000/api/v1/kelas/list_kelas")
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

    const handleKelasChange = (value: string) => {
        setFormData((prev) => ({ ...prev, id_kelas: value}))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.id_kelas || !formData.nama_mapel) {
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
                nama_mapel: formData.nama_mapel,
                id_kelas: Number(formData.id_kelas),
                created_by: currentUser,
            }
            await axios.post("http://127.0.0.1:8000/api/v1/mapel/create_mapel", payload)
            setAlertData({
                title: "Berhasil",
                description: "Mata Pelajaran berhasil dibuat.",
                isSuccess: true
            })
            setAlertOpen(true)
            setKelasList([])
            formData.id_kelas = ""
            formData.nama_mapel = ""
            formData.created_by = ""
            fetchData()
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
            router.push("/mata_pelajaran/create_mata_pelajaran")
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Buat Mata Pelajaran Baru</h1>
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
                                <CardTitle>Formulir Mata Pelajaran</CardTitle>
                                <CardDescription>
                                    Silakan pilih kelas, lalu isi nama mata pelajaran baru.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
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
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nama_mapel">Nama Mata Pelajaran <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="nama_mapel"
                                            name="nama_mapel"
                                            value={formData.nama_mapel}
                                            onChange={handleChange}
                                            placeholder="Contoh : Matematika"
                                            disabled={!formData.id_kelas}
                                        />
                                        {!formData.id_kelas && (
                                            <p className="text-xs text-muted-foreground">
                                                Pilih kelas terlebih dahulu untuk mengisi nama mata pelajaran.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !formData.nama_mapel}
                                            className="w-full md:w-auto"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Simpan Mata Pelajaran
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
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
                </main>
            </div>
        </div>
    )
}
