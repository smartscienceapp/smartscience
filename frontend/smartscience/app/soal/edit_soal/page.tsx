"use client";

import { useEffect, useState, ChangeEvent, Suspense} from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Save, Loader2} from "lucide-react"
import { createClient } from "@supabase/supabase-js"

// --- Interfaces ---
interface Option {
    text: string;
    image?: string;
    isCorrect: boolean;
}

// Inisialisasi Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)

export const dynamic = "force-dynamic";

export function EditSoalContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const id_soal = searchParams.get("id_soal")

    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Form State
    const [isiSoal, setIsiSoal] = useState("")
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [options, setOptions] = useState<Option[]>([])

    // 1. Fetch Data Soal
    useEffect(() => {
        if (id_soal) {
            fetchSoal(parseInt(id_soal))
        }
    }, [id_soal])

    const fetchSoal = async (id: number) => {
        setIsLoading(true)
        try {
            // Endpoint untuk mengambil detail soal
            const response = await axios.post(`${API_URL}/api/v1/soal/get_detail_soal`, {
                id_soal: id
            })
            
            if (response && response.data) { 
                const data = response.data
                setIsiSoal(data.isi_soal)
                setImagePreview(data.image_soal)

                // Parsing Option dari JSON String atau Array
                let parsedOptions: any[] = []
                if (typeof data.option === "string") {
                    try {
                        const parsed = JSON.parse(data.option)
                        // Handle jika data ter-stringify dua kali (double stringified)
                        if (typeof parsed === "string") {
                            parsedOptions = JSON.parse(parsed)
                        } else {
                            parsedOptions = parsed
                        }
                    } catch (err) {
                        console.error("Error parsing options JSON", err)
                    }
                } else if (Array.isArray(data.option)) {
                    parsedOptions = data.option
                }

                if (!Array.isArray(parsedOptions)) {
                    parsedOptions = []
                }
                
                // Pastikan setiap opsi memiliki properti yang lengkap
                setOptions(parsedOptions.map((opt: any) => ({
                    text: opt.text || "",
                    image: opt.image || "",
                    isCorrect: !!opt.isCorrect
                })))
            }
        } catch (error) {
            console.error("Gagal load soal:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Handle Image Upload & Preview
    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `soal/${fileName}`

        setIsUploading(true)
        try {
            const { error: uploadError } = await supabase.storage
                .from('smartscience') 
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('smartscience')
                .getPublicUrl(filePath)

            setImagePreview(data.publicUrl)
        } catch (error: any) {
            console.error("Upload error:", error)
            alert(`Gagal upload gambar: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveMainImage = () => {
        setImagePreview(null)
    }

    // 3. Handle Options (Add, Remove, Edit)
    const handleOptionTextChange = (index: number, val: string) => {
        setOptions(prev => prev.map((opt, i) => 
            i === index ? { ...opt, text: val } : opt
        ))
    }

    const handleOptionCorrectChange = (index: number, isChecked: boolean) => {
        setOptions(prev => prev.map((opt, i) => 
            i === index ? { ...opt, isCorrect: isChecked } : opt
        ))
    }

    const handleOptionImageUpload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
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

            setOptions(prev => prev.map((opt, i) => 
                i === index ? { ...opt, image: data.publicUrl } : opt
            ))
        } catch (error: any) {
            console.error("Upload error:", error)
            alert(`Gagal upload gambar opsi: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveOptionImage = (index: number) => {
        setOptions(prev => prev.map((opt, i) => 
            i === index ? { ...opt, image: "" } : opt
        ))
    }

    const addOption = () => {
        setOptions([...options, { text: "", image: "", isCorrect: false }])
    }

    const removeOption = (index: number) => {
        const newOpts = options.filter((_, i) => i !== index)
        setOptions(newOpts)
    }

    // 4. Save Data
    const handleSave = async () => {
        if (!id_soal) return
        setIsSaving(true)
        try {
            const payload = {
                id_soal: parseInt(id_soal),
                isi_soal: isiSoal,
                image_soal: imagePreview,
                option: JSON.stringify(options) // Convert array object ke string JSON
            }

            await axios.post(`${API_URL}/api/v1/soal/update_soal`, payload)
            
            alert("Soal berhasil diperbarui!")
            router.back()
        } catch (error) {
            console.error("Gagal menyimpan:", error)
            alert("Terjadi kesalahan saat menyimpan data.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Edit Soal</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background relative pb-24">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Button>

                        <Card>
                            <CardHeader>
                                <CardTitle>Form Edit Soal</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Isi Soal</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Masukkan pertanyaan..."
                                        value={isiSoal}
                                        onChange={(e) => setIsiSoal(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Gambar Soal (Opsional)</Label>
                                    <div className="flex flex-col gap-4">
                                        {imagePreview && (
                                            <div className="relative w-full max-w-md h-64 border rounded-md overflow-hidden bg-muted group">
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Preview Soal" 
                                                    className="w-full h-full object-contain"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={handleRemoveMainImage}
                                                    title="Hapus Gambar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <Input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            className="max-w-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base">Pilihan Jawaban</Label>
                                        <Button variant="outline" size="sm" onClick={addOption}>
                                            <Plus className="mr-2 h-4 w-4" /> Tambah Opsi
                                        </Button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {options.map((opt, idx) => (
                                            <div key={idx} className="p-3 border rounded-md bg-card space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center h-full pt-2">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={opt.isCorrect} 
                                                            onChange={(e) => handleOptionCorrectChange(idx, e.target.checked)}
                                                            className="h-5 w-5 accent-primary cursor-pointer"
                                                            title="Tandai sebagai jawaban benar"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Teks Jawaban</Label>
                                                        <Input 
                                                            value={opt.text} 
                                                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                                            placeholder={`Opsi ${idx + 1}`}
                                                        />
                                                    </div>
                                                    <div className="pt-6">
                                                        <Button variant="destructive" size="icon" onClick={() => removeOption(idx)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="pl-8">
                                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Gambar Opsi (Opsional)</Label>
                                                    <div className="flex flex-col gap-2">
                                                        <Input 
                                                            type="file" 
                                                            accept="image/*"
                                                            disabled={isUploading}
                                                            onChange={(e) => handleOptionImageUpload(idx, e)}
                                                            className="max-w-xs h-9 text-xs"
                                                        />
                                                        {opt.image && (
                                                            <div className="relative inline-block group w-fit">
                                                                <img src={opt.image} alt={`Option ${idx}`} className="h-24 w-auto object-contain border rounded-md bg-white" />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                                    onClick={() => handleRemoveOptionImage(idx)}
                                                                    title="Hapus Gambar"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {options.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada opsi jawaban.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="fixed bottom-6 right-6 flex gap-4">
                        <Button size="lg" onClick={handleSave} disabled={isSaving || isLoading}>
                            {isSaving ? (
                                <>Menyimpan...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                                </>
                            )}
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default function EditSoalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <EditSoalContent />
        </Suspense>
    )
}