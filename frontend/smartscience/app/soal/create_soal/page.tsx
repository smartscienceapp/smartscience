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
import { createClient } from "@supabase/supabase-js"
import { Textarea } from "@/components/ui/textarea"

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
    id_bab: number;
    nama_bab: string;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

export default function CreateSoalPage() {
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
    const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([])
    const [openMapel, setOpenMapel] = useState(false)
    const [isMapelLoading, setIsMapelLoading] = useState(false)
    const [babList, setBabList] = useState<Bab[]>([])
    const [openBab, setOpenBab] = useState(false)
    const [isBabLoading, setIsBabLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [options, setOptions] = useState([
        { text: "", image: "", isCorrect: false },
        { text: "", image: "", isCorrect: false },
    ])

    const [formData, setFormData] = useState({
        id_kelas: "",
        id_mapel: "",
        id_bab: "",
        isi_soal: "",
        image_soal: "",
        option: "",
        created_by: "",
    })

    const fetchData = async () => {
        setIsKelasLoading(true)
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

    const handleKelasChange = async (value: string) => {
        setFormData((prev) => ({ ...prev, id_kelas: value }))
        setMataPelajaranList([])
        setBabList([])
        setIsMapelLoading(true)

        try {
            const payload = { id_kelas: parseInt(value) }
            const response = await axios.post("http://127.0.0.1:8000/api/v1/mapel/list_mapel", payload)
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
        setFormData((prev) => ({ ...prev, id_mapel: value }))
        setBabList([])
        setIsBabLoading(true)

        try {
            const payload = { id_mapel: parseInt(value), id_kelas: parseInt(formData.id_kelas) }
            const response = await axios.post("http://127.0.0.1:8000/api/v1/bab/list_bab", payload)
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
        setFormData((prev) => ({ ...prev, id_bab: value }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `soal/${fileName}`

        setIsUploading(true)
        try {
            // Pastikan nama bucket sesuai dengan yang ada di Supabase Storage Anda (misal: 'images' atau 'soal')
            const { error: uploadError } = await supabase.storage
                .from('smartscience')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('smartscience')
                .getPublicUrl(filePath)

            console.log("Gambar berhasil diupload ke:", data.publicUrl)
            setFormData((prev) => ({ ...prev, image_soal: data.publicUrl }))
        } catch (error: any) {
            console.error("Upload error:", error)
            alert(`Gagal upload gambar: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleOptionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `option_${Date.now()}_${index}.${fileExt}`
        const filePath = `soal/options/${fileName}`

        setIsUploading(true)
        try {
            const { error: uploadError } = await supabase.storage
                .from('smartscience')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('smartscience')
                .getPublicUrl(filePath)

            const newOptions = [...options]
            newOptions[index].image = data.publicUrl
            setOptions(newOptions)
        } catch (error: any) {
            console.error("Upload error:", error)
            alert(`Gagal upload gambar opsi: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options]
        newOptions[index].text = value
        setOptions(newOptions)
    }

    const handleCorrectChange = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
        }))
        setOptions(newOptions)
    }

    const handleAddOption = () => {
        setOptions([...options, { text: "", image: "", isCorrect: false }])
    }

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return
        setOptions(options.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.id_kelas || !formData.id_mapel || !formData.id_bab) {
            setAlertData({
                title: "Gagal",
                description: "Mohon lengkapi semua formulir.",
                isSuccess: false
            })
            setAlertOpen(true)
            return
        }

        const hasCorrectAnswer = options.some((opt) => opt.isCorrect)

        if (!hasCorrectAnswer) {
            setAlertData({
                title: "Validasi Gagal",
                description: "Anda belum memilih kunci jawaban yang benar. Silakan pilih salah satu opsi.",
                isSuccess: false
            })
            setAlertOpen(true)
            return
        }

        const isOptionsFilled = options.every((opt) => opt.text.trim() !== "" || opt.image !== "")
        if (!isOptionsFilled) {
            setAlertData({
                title: "Validasi Gagal",
                description: "Pastikan semua teks opsi jawaban telah diisi.",
                isSuccess: false
            })
            setAlertOpen(true)
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                id_bab: Number(formData.id_bab),
                isi_soal: formData.isi_soal,
                image_soal: formData.image_soal,
                option: JSON.stringify(options),
                created_by: currentUser,
            }
            await axios.post("http://127.0.0.1:8000/api/v1/soal/create_soal", payload)
            setAlertData({
                title: "Berhasil",
                description: "Soal berhasil dibuat.",
                isSuccess: true
            })
            setAlertOpen(true) 
            setFormData((prev) => ({
                ...prev,
                isi_soal: "",
                image_soal: "",
                option: "",
                image_option: "",
            }))
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
            router.push("/soal/create_soal")
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Buat Bab Baru</h1>
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
                                <CardTitle>Formulir Soal</CardTitle>
                                <CardDescription>Isi detail soal di bawah ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="isi_soal">Isi Soal</Label>
                                        <Textarea
                                            name="isi_soal"
                                            value={formData.isi_soal}
                                            onChange={(e) => setFormData({ ...formData, isi_soal: e.target.value })}
                                            placeholder="Isi Soal"
                                            className="min-h-[150px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="image_soal">Upload Gambar (Opsional)</Label>
                                        <Input type="file" onChange={handleImageUpload} disabled={isUploading} accept="image/*" />
                                        {isUploading && <p className="text-sm text-muted-foreground">Sedang mengupload...</p>}
                                        {formData.image_soal && (
                                            <div className="mt-2">
                                                <p className="text-xs text-green-600 mb-1">Gambar berhasil diupload!</p>
                                                <img src={formData.image_soal} alt="Preview" className="h-24 w-auto object-contain border rounded-md" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Opsi Jawaban</Label>
                                        <div className="space-y-3">
                                            {options.map((opt, index) => (
                                                <div key={index} className="border p-3 rounded-md space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-semibold w-6 text-center">{String.fromCharCode(65 + index)}</span>
                                                        <Input
                                                            value={opt.text}
                                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                                            placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                                                        />
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <input
                                                                type="radio"
                                                                name="correct_option"
                                                                checked={opt.isCorrect}
                                                                onChange={() => handleCorrectChange(index)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm text-muted-foreground">Benar</span>
                                                        </div>
                                                        {options.length > 2 && (
                                                            <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveOption(index)}>
                                                                Hapus
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="ml-9">
                                                        <Label className="text-xs mb-1.5 block text-muted-foreground">Gambar Opsi (Opsional)</Label>
                                                        <Input
                                                            type="file"
                                                            onChange={(e) => handleOptionImageUpload(index, e)}
                                                            disabled={isUploading}
                                                            accept="image/*"
                                                            className="text-xs h-9"
                                                        />
                                                        {opt.image && (
                                                            <div className="mt-2">
                                                                <img src={opt.image} alt={`Option ${index}`} className="h-20 w-auto object-contain border rounded-md" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                                                + Tambah Opsi
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isLoading || !formData.isi_soal}
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
                                                    Simpan Soal
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
            </div >
        </div >
    )
}
