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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"

interface Kelas {
    id_kelas: number;
    nama_kelas: string;
}

interface MataPelajaran {
    id_mapel: number;
    nama_mapel: string;
}

interface DecodedToken {
    sub?: string;
    username?: string;
    role: string;
}

export default function CreateTobPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [kelasList, setKelasList] = useState<Kelas[]>([])
    const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([])
    const [currentUser, setCurrentUser] = useState<string>("unknown")

    const [formData, setFormData] = useState({
        id_kelas: "",
        id_mapel: "",
        nama_tob: "",
        created_by: ""
    })

    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                const userIdentifier = decoded.sub || decoded.username || decoded.role || "unknown"
                setCurrentUser(userIdentifier)
            } catch (error) {
                console.error(error)
            }
        }

        const fetchData = async () => {
            try {
                const kelasRes = await axios.post(`${API_URL}/api/v1/kelas/list_kelas`)
                if (kelasRes.data?.kelas) {
                    setKelasList(kelasRes.data.kelas)
                } else if (Array.isArray(kelasRes.data)) {
                    setKelasList(kelasRes.data)
                }
            } catch (error) {
                console.error(error)
            }
        }
        fetchData()
    }, [])

    const handleKelasChange = async (value: string) => {
        setFormData((prev) => ({ ...prev, id_kelas: value }))
        try {
            const payload = { id_kelas: parseInt(value) }
            const response = await axios.post(`${API_URL}/api/v1/mapel/list_mapel`, payload)
            if (response.data?.mapel) {
                setMataPelajaranList(response.data.mapel)
            } else if (Array.isArray(response.data)) {
                setMataPelajaranList(response.data)
            }
        } catch (error) {
            console.error("Error fetching mata pelajaran:", error)
        }
    }
    const handleMataPelajaranChange = (value: string) => {
        setFormData((prev) => ({ ...prev, id_mapel: value }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.id_kelas) {
            alert("Harap pilih Kelas terlebih dahulu")
            return
        }
        if (!formData.id_mapel) {
            alert("Harap pilih Mata Pelajaran terlebih dahulu")
            return
        }
        if (!formData.nama_tob) {
            alert("Harap isi Nama TOB")
            return
        }

        const selectedKelas = kelasList.find(k => k.id_kelas.toString() === formData.id_kelas)

        setIsLoading(true)
        try {
            const payload = {
                id_mapel: Number(formData.id_mapel),
                nama_tob: formData.nama_tob,
                id_kelas: Number(formData.id_kelas),
                created_by: currentUser,
            }
            // Menggunakan endpoint create_bab (asumsi nama endpoint)
            await axios.post(`${API_URL}/api/v1/tob/create_tob`, payload)
            setIsLoading(false)
            alert("Berhasil membuat tob")
            router.refresh()
        } catch (error) {
            console.error(error)
            setIsLoading(false)
            alert("Gagal membuat tob")
        }
    }
    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                    <h1 className="text-xl font-semibold md:text-2xl">Tautkan Mata Pelajaran</h1>
                    <div className="ml-auto">
                        <UserMenu />
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    <div className="max-w-auto mx-auto">
                        <Card className="border-t-4 border-t-primary shadow-md">
                            <CardHeader>
                                <CardTitle>Form TOB</CardTitle>
                                <CardDescription>Isi detail tob di bawah ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="kelas">Kelas</Label>
                                            <Select onValueChange={handleKelasChange} value={formData.id_kelas}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih Kelas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {kelasList.map((k) => (
                                                        <SelectItem key={k.id_kelas} value={k.id_kelas.toString()}>
                                                            {k.nama_kelas}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
                                            <Select onValueChange={handleMataPelajaranChange} value={formData.id_mapel}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {mataPelajaranList.map((mp) => (
                                                        <SelectItem key={mp.id_mapel} value={mp.id_mapel.toString()}>
                                                            {mp.nama_mapel}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nama_tob">Nama TOB</Label>
                                        <Input
                                            name="nama_tob"
                                            value={formData.nama_tob}
                                            onChange={handleChange}
                                            placeholder="Nama TOB"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Loading..." : "Submit"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div >
        </div >
    )
}
