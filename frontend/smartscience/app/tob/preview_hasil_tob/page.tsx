"use client";

import { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import "katex/dist/katex.min.css"
import Latex from "react-latex-next"

// --- Interfaces ---
interface Option {
    text: string;
    image?: string;
    isCorrect?: boolean;
}

interface SoalExam {
    id_soal: number;
    isi_soal: string;
    image_soal: string | null;
    option: Option[];
}

interface StudentAnswer {
    id_soal: number;
    jawaban: string;
    is_correct: boolean;
}

export const dynamic = "force-dynamic";

export function PreviewHasilTobContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()

    const id_tob = searchParams.get("id_tob")
    const id_user = searchParams.get("id_user")
    const id_mapel = searchParams.get("id_mapel")

    const [listSoal, setListSoal] = useState<SoalExam[]>([])
    const [studentAnswers, setStudentAnswers] = useState<Record<number, StudentAnswer>>({})
    const [score, setScore] = useState<number>(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (id_tob && id_user) {
            fetchData()
        }
    }, [id_tob, id_user])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [soalRes, answerRes] = await Promise.all([
                axios.post(`${API_URL}/api/v1/soal/get_detail_soal_full`, {
                    id_tob: parseInt(id_tob!)
                }),
                axios.post(`${API_URL}/api/v1/tob/get_pengerjaan_siswa`, {
                    id_user: parseInt(id_user!),
                    id_tob: parseInt(id_tob!)
                })
            ])

            // Process Soal
            let processedSoal: SoalExam[] = []
            if (soalRes.data && soalRes.data.soaltob) {
                processedSoal = soalRes.data.soaltob.map((item: any) => {
                    let parsedOption: Option[] = []
                    if (typeof item.option === 'string') {
                        try {
                            parsedOption = JSON.parse(item.option)
                        } catch (e) {
                            parsedOption = []
                        }
                    } else if (Array.isArray(item.option)) {
                        parsedOption = item.option
                    }
                    return { ...item, option: parsedOption }
                })
            }
            setListSoal(processedSoal)

            // Process Answers
            let answersMap: Record<number, StudentAnswer> = {}
            if (answerRes.data) {
                setScore(answerRes.data.nilai || 0)

                let rawAnswers = answerRes.data.jawaban_siswa
                if (typeof rawAnswers === 'string') {
                    try {
                        rawAnswers = JSON.parse(rawAnswers)
                    } catch (e) {
                        console.error("Failed to parse jawaban_siswa", e)
                        rawAnswers = []
                    }
                }

                if (Array.isArray(rawAnswers)) {
                    rawAnswers.forEach((ans: StudentAnswer) => {
                        answersMap[ans.id_soal] = ans
                    })
                }
            }
            setStudentAnswers(answersMap)

        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const nextQuestion = () => {
        if (currentQuestionIndex < listSoal.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const jumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index)
    }

    const handleBack = () => {
        if (id_mapel) {
            router.push(`/tob/list_hasil_tob_siswa?id_mapel=${id_mapel}`)
        } else {
            router.back()
        }
    }

    const currentSoal = listSoal[currentQuestionIndex]
    const currentAnswer = currentSoal ? studentAnswers[currentSoal.id_soal] : null

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col h-screen overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 shrink-0">
                    <h1 className="text-2xl font-semibold">Preview Hasil Ujian</h1>
                    <UserMenu />
                </header>

                <main className="flex flex-1 overflow-hidden">
                    {/* Area Soal */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">Memuat hasil...</div>
                        ) : currentSoal ? (
                            <Card className="h-full flex flex-col max-w-3xl mx-auto">
                                <CardHeader className="border-b bg-muted/20">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Soal No. {currentQuestionIndex + 1}</span>
                                        <div className="flex items-center gap-2">
                                            {currentAnswer?.is_correct ? (
                                                <span className="flex items-center text-green-600 text-sm font-medium bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Benar
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-red-600 text-sm font-medium bg-red-100 px-3 py-1 rounded-full border border-red-200">
                                                    <XCircle className="w-4 h-4 mr-1" /> Salah
                                                </span>
                                            )}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6 p-6 overflow-y-auto">
                                    <div className="text-lg font-medium leading-relaxed"><Latex>{currentSoal.isi_soal}</Latex></div>

                                    {currentSoal.image_soal && (
                                        <div className="border rounded-md p-2 w-fit bg-muted/10">
                                            <img
                                                src={currentSoal.image_soal}
                                                alt={`Gambar soal ${currentQuestionIndex + 1}`}
                                                className="max-h-80 object-contain"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 space-y-3">
                                        {currentSoal.option.map((opt, idx) => {
                                            // PERBAIKAN LOGIKA DISINI:
                                            // Kita generate huruf berdasarkan index (0->A, 1->B) karena preview menampilkan urutan asli DB
                                            const optionLetter = String.fromCharCode(65 + idx);

                                            // Bandingkan 'Jawaban Siswa (Huruf)' dengan 'Huruf Opsi Saat Ini'
                                            const isSelected = currentAnswer?.jawaban === optionLetter;
                                            const isCorrect = opt.isCorrect;

                                            let containerClass = "border-border"
                                            let indicator = null

                                            if (isSelected && isCorrect) {
                                                // ... (style benar)
                                                containerClass = "border-green-500 bg-green-50 ring-1 ring-green-500"
                                                indicator = <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                            } else if (isSelected && !isCorrect) {
                                                // ... (style salah)
                                                containerClass = "border-red-500 bg-red-50 ring-1 ring-red-500"
                                                indicator = <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                                            } else if (!isSelected && isCorrect) {
                                                // ... (style kunci jawaban)
                                                containerClass = "border-green-500 bg-green-50/50 border-dashed"
                                                indicator = <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 opacity-50" />
                                            }

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex items-start space-x-3 border p-4 rounded-lg transition-colors",
                                                        containerClass
                                                    )}
                                                >
                                                    <div className="mt-1">
                                                        {indicator || <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />}
                                                    </div>
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        {/* Tampilkan Label Huruf (A, B, C) agar konsisten */}
                                                        <Label className="text-base font-normal cursor-default flex gap-2">
                                                            <span className="font-semibold">{optionLetter}.</span>
                                                            <span><Latex>{opt.text}</Latex></span>

                                                            {!isSelected && isCorrect && (
                                                                <span className="ml-2 text-xs text-green-600 font-medium">(Jawaban Benar)</span>
                                                            )}
                                                            {isSelected && !isCorrect && (
                                                                <span className="ml-2 text-xs text-red-600 font-medium">(Jawaban Anda)</span>
                                                            )}
                                                        </Label>
                                                        {opt.image && (
                                                            <img
                                                                src={opt.image}
                                                                alt={`Option ${idx + 1}`}
                                                                className="h-24 w-auto object-contain border rounded-md bg-white self-start"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                                    <Button
                                        variant="outline"
                                        onClick={prevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className="w-32"
                                    >
                                        Sebelumnya
                                    </Button>

                                    <Button
                                        onClick={nextQuestion}
                                        disabled={currentQuestionIndex === listSoal.length - 1}
                                        className="w-32"
                                    >
                                        Selanjutnya
                                    </Button>
                                </CardFooter>
                            </Card>
                        ) : (
                            <div className="text-center py-10">Tidak ada data soal.</div>
                        )}
                    </div>

                    {/* Sidebar Navigasi & Nilai */}
                    <aside className="w-80 border-l bg-card flex flex-col hidden md:flex">
                        <div className="p-6 border-b bg-muted/10 text-center">
                            <h3 className="font-medium text-muted-foreground mb-1">Nilai Akhir</h3>
                            <div className="text-4xl font-bold text-primary">
                                {score}
                            </div>
                        </div>

                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-lg">Navigasi Soal</h3>
                            <p className="text-sm text-muted-foreground">Review jawaban anda</p>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {listSoal.map((soal, idx) => {
                                    const ans = studentAnswers[soal.id_soal]
                                    const isCorrect = ans?.is_correct
                                    const isCurrent = currentQuestionIndex === idx

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => jumpToQuestion(idx)}
                                            className={cn(
                                                "aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all border",
                                                isCurrent
                                                    ? "ring-2 ring-primary border-primary"
                                                    : "",
                                                isCorrect
                                                    ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                                                    : "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                            )}
                                        >
                                            {idx + 1}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-muted/10 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border rounded bg-green-500"></div>
                                    <span>Benar</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border rounded bg-red-500"></div>
                                    <span>Salah</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleBack}
                                className="w-full"
                                variant="secondary"
                            >
                                Kembali ke List
                            </Button>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    )
}

export default function PreviewHasilTobPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PreviewHasilTobContent />
        </Suspense>
    )
}