"use client";

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- Interfaces ---
interface Option {
    text: string;
    image?: string;
    isCorrect: boolean;
}

interface SoalPreview {
    id_soal: number;
    isi_soal: string;
    image_soal: string | null;
    option: Option[] | string; // Bisa JSON string atau array object
}
 

export default function PreviewTobPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id_tob = searchParams.get("id_tob")
    const id_kelas = searchParams.get("id_kelas")
    const id_mapel = searchParams.get("id_mapel")

    const [listSoal, setListSoal] = useState<SoalPreview[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (id_tob) {
            fetchPreview(parseInt(id_tob))
        }
    }, [id_tob])

    const fetchPreview = async (id: number) => {
        setIsLoading(true)
        try {
            // Menggunakan endpoint preview (sesuaikan jika endpoint berbeda)
            const response = await axios.post("http://127.0.0.1:8000/api/v1/soal/get_detail_soal_full", {
                id_tob: id
            })
            
            if (response.data && response.data.soaltob) {
                // Mapping data untuk memastikan option ter-parse dengan benar
                const mappedData = response.data.soaltob.map((item: SoalPreview) => {
                    let parsedOption = item.option
                    if (typeof item.option === 'string') {
                        try {
                            parsedOption = JSON.parse(item.option)
                        } catch (e) {
                            parsedOption = []
                        }
                    }
                    return { ...item, option: parsedOption }
                })
                setListSoal(mappedData)
            } else {
                setListSoal([])
            }
        } catch (error) {
            console.error("Gagal load preview:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
                    <h1 className="text-2xl font-semibold">Preview TOB</h1>
                    <UserMenu />
                </header>

                <main className="flex-1 p-6 bg-background relative pb-24">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {isLoading ? (
                            <div className="text-center py-10">Memuat preview...</div>
                        ) : listSoal.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">Tidak ada soal untuk ditampilkan.</div>
                        ) : (
                            listSoal.map((soal, index) => (
                                <Card key={soal.id_soal || index}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex gap-2">
                                            <Badge variant="outline" className="h-fit">{index + 1}</Badge>
                                            <span className="font-normal">{soal.isi_soal}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Image Section */}
                                        {soal.image_soal && (
                                            <div className="border rounded-md p-2 w-fit bg-muted/20">
                                                <img 
                                                    src={soal.image_soal} 
                                                    alt={`Gambar soal ${index + 1}`} 
                                                    className="max-h-64 object-contain"
                                                />
                                            </div>
                                        )}

                                        {/* Options Section */}
                                        <div className="grid gap-2">
                                            {Array.isArray(soal.option) && soal.option.map((opt, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`p-3 rounded-md border flex items-start gap-3 ${opt.isCorrect ? "bg-green-50 border-green-200" : "bg-card"}`}
                                                >
                                                    <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${opt.isCorrect ? "border-green-600 bg-green-600" : "border-muted-foreground"}`}>
                                                        {opt.isCorrect && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <span className={opt.isCorrect ? "font-medium text-green-800" : ""}>{opt.text}</span>
                                                        {opt.image && (
                                                            <img 
                                                                src={opt.image} 
                                                                alt={`Option ${idx + 1}`} 
                                                                className="h-24 w-auto object-contain border rounded-md bg-white self-start"
                                                            />
                                                        )}
                                                    </div>
                                                    {opt.isCorrect && <Badge className="ml-auto bg-green-600 hover:bg-green-700 shrink-0">Jawaban Benar</Badge>}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="fixed bottom-6 right-6">
                        <Button onClick={() => router.push(`/tob/list_tob?id_kelas=${id_kelas}&id_mapel=${id_mapel}`)} size="lg">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke List TOB
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    )
}