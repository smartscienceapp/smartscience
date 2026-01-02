"use client";

import { useEffect, useState, Suspense } from "react"
import axios from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { UserMenu } from "@/components/dashboard/user-menu"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
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
    option: Option[] | string;
    shuffledOptions?: ShuffledOption[];
}

interface DecodedToken {
    sub?: string;
    user?: string;
    role: string;
    id_user?: number;
    id_kelas?: number;
}

interface ShuffledOption extends Option {
    originalIndex: number; // Ini kunci rahasianya (0, 1, 2, ...)
}

function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

export const dynamic = "force-dynamic";

export function KerjakanSoalContent() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const router = useRouter()
    const searchParams = useSearchParams()
    const id_tob = searchParams.get("id_tob")

    const [listSoal, setListSoal] = useState<SoalExam[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentUser, setCurrentUser] = useState<string>("unknown")
    const [currentKelas, setCurrentKelas] = useState<number>()
    const [currentUserId, setCurrentUserId] = useState<number>()
    const [currentUserName, setCurrentUserName] = useState<string>("unknown")
    const [alertOpen, setAlertOpen] = useState(false)
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
    const [alertData, setAlertData] = useState({
        title: "",
        description: "",
        onAction: null as (() => void) | null
    })

    const handleAlertClose = () => {
        setAlertOpen(false)
        if (alertData.onAction) {
            alertData.onAction()
            setAlertData(prev => ({ ...prev, onAction: null }))
        }
    }

    // Prevent accidental exit
    useEffect(() => {
        // Push state to prevent immediate back
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
            setAlertData({
                title: "Peringatan",
                description: "Anda tidak dapat kembali ke halaman sebelumnya selama ujian berlangsung.",
                onAction: null
            })
            setAlertOpen(true)
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const token = Cookies.get("token")
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token)
                const userIdentifier = decoded.sub || decoded.role || "unknown"
                setCurrentUser(decoded.role || "unknown")
                setCurrentKelas(decoded.id_kelas)
                setCurrentUserId(decoded.id_user)
                setCurrentUserName(decoded.user || "unknown")
            } catch (error) {
                console.error("Token invalid", error)
            }
        }

        if (id_tob) {
            fetchQuestions(parseInt(id_tob))
        }
    }, [id_tob])

    useEffect(() => {
        if (currentUserId && id_tob) {
            const checkStatus = async () => {
                try {
                    const response = await axios.post(`${API_URL}/api/v1/tob/status_pengerjaan`, {
                        id_user: currentUserId,
                        id_tob: parseInt(id_tob)
                    })

                    if (response.data.message === "Sudah Mengerjakan") {
                        setAlertData({
                            title: "Akses Ditolak",
                            description: "Anda sudah mengerjakan ujian ini.",
                            onAction: () => {
                                const paramMapel = searchParams.get("id_mapel")
                                router.push(paramMapel ? `/tob/list_tob_siswa?id_mapel=${paramMapel}` : "/dashboard")
                            }
                        })
                        setAlertOpen(true)
                    }
                } catch (error) {
                    console.error("Error checking status:", error)
                }
            }
            checkStatus()
        }
    }, [currentUserId, id_tob])

    const fetchQuestions = async (id: number) => {
        setIsLoading(true)
        try {
            const response = await axios.post(`${API_URL}/api/v1/soal/get_detail_soal_full`, {
                id_tob: id
            })

            if (response.data && response.data.soaltob) {
                const mappedData = response.data.soaltob.map((item: SoalExam) => {
                    let parsedOption = [];
                    // Parsing JSON seperti biasa
                    if (typeof item.option === 'string') {
                        try { parsedOption = JSON.parse(item.option) } catch (e) { parsedOption = [] }
                    } else {
                        parsedOption = item.option || []
                    }

                    // --- LANGKAH PENTING: Attach Index Asli & Shuffle ---
                    const optionsWithIndex = parsedOption.map((opt: any, idx: number) => ({
                        ...opt,
                        originalIndex: idx // Simpan "0" untuk A, "1" untuk B, dst.
                    }));

                    const shuffled = shuffleArray(optionsWithIndex);

                    // Simpan 'option' (data mentah) DAN 'shuffledOptions' (untuk display)
                    return {
                        ...item,
                        option: parsedOption, // Tetap simpan original untuk referensi jika perlu
                        shuffledOptions: shuffled
                    }
                })
                setListSoal(mappedData)
            } else {
                setListSoal([])
            }
        } catch (error) {
            console.error("Gagal load soal:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAnswer = (value: string) => {
        const currentSoal = listSoal[currentQuestionIndex]
        if (!currentSoal) return

        setAnswers(prev => ({
            ...prev,
            [currentSoal.id_soal]: value
        }))
    }

    const handleSubmit = () => {
        if (!currentUser) {
            setAlertData({
                title: "Gagal",
                description: "Sesi pengguna tidak valid. Silakan login ulang.",
                onAction: null
            })
            setAlertOpen(true)
            return
        }

        const tobId = parseInt(id_tob || "0")
        if (!tobId) {
            setAlertData({
                title: "Gagal",
                description: "ID TOB tidak valid.",
                onAction: null
            })
            setAlertOpen(true)
            return
        }

        setSubmitConfirmOpen(true)
    }

    const confirmSubmit = async () => {
        setSubmitConfirmOpen(false)
        setIsSubmitting(true)
        try {
            const tobId = parseInt(id_tob || "0")
            // Payload structure depends on backend. Assuming a generic structure here.
            const paramMapel = searchParams.get("id_mapel")
            const payload = {
                id_user: currentUserId,
                id_tob: tobId,
                jawaban_siswa: JSON.stringify(listSoal.map((soal) => {
                    const jawabanHuruf = answers[soal.id_soal];
                    let is_correct = false;
                    if (jawabanHuruf && Array.isArray(soal.option)) {
                        const index = jawabanHuruf.charCodeAt(0) - 65;
                        if (soal.option[index]?.isCorrect) is_correct = true;
                    }

                    return {
                        id_soal: soal.id_soal,
                        jawaban: jawabanHuruf || "",
                        is_correct
                    };
                })),
                created_by: currentUserName
            }
            await axios.post(`${API_URL}/api/v1/tob/submit_pengerjaan`, payload)

            setAlertData({
                title: "Berhasil",
                description: "Jawaban berhasil dikirim!",
                onAction: () => router.push(`/tob/list_tob_siswa?id_mapel=${paramMapel}`)
            })
            setAlertOpen(true)
        } catch (error: any) {
            console.error("Submit error:", error)
            const errorMessage = error.response?.data?.detail || "Terjadi kesalahan saat mengirim jawaban."
            setAlertData({
                title: "Gagal",
                description: errorMessage,
                onAction: null
            })
            setAlertOpen(true)
        } finally {
            setIsSubmitting(false)
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

    const currentSoal = listSoal[currentQuestionIndex]

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col h-screen overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b px-6 shrink-0">
                    <h1 className="text-2xl font-semibold">Ujian Sedang Berlangsung</h1>
                    <UserMenu />
                </header>

                <main className="flex flex-1 overflow-hidden">
                    {/* Area Soal */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">Memuat soal...</div>
                        ) : currentSoal ? (
                            <Card className="h-full flex flex-col max-w-3xl mx-auto">
                                <CardHeader className="border-b bg-muted/20">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Soal No. {currentQuestionIndex + 1}</span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {Object.keys(answers).length} / {listSoal.length} Terjawab
                                        </span>
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

                                    <div className="pt-4">
                                        {/* Value yang dikontrol state adalah Huruf (A, B, C) */}
                                        <RadioGroup
                                            // Value yang disimpan di state tetap Huruf Asli ("A", "B")
                                            value={answers[currentSoal.id_soal] || ""}
                                            onValueChange={handleAnswer}
                                        >
                                            {currentSoal.shuffledOptions?.map((opt, visualIdx) => {
                                                const visualLetter = String.fromCharCode(65 + visualIdx);
                                                const originalLetter = String.fromCharCode(65 + opt.originalIndex);

                                                return (
                                                    <div
                                                        key={visualIdx}
                                                        onClick={() => handleAnswer(originalLetter)}
                                                        className={cn(
                                                            // UBAH DISINI: flex-row, items-start (agar sejajar atas jika teks panjang), p-4
                                                            "flex flex-row items-start space-x-3 border p-4 rounded-lg transition-colors cursor-pointer hover:bg-accent",
                                                            answers[currentSoal.id_soal] === originalLetter ? "border-primary bg-accent" : "border-border"
                                                        )}
                                                    >
                                                        {/* Radio Button (beri mt-1 agar sejajar dengan baris pertama teks) */}
                                                        <RadioGroupItem value={originalLetter} id={`opt-${visualIdx}`} className="mt-1 shrink-0" />

                                                        <div className="flex-1">
                                                            <Label
                                                                htmlFor={`opt-${visualIdx}`}
                                                                className="cursor-pointer text-base font-normal flex flex-row items-start gap-2"
                                                            >
                                                                {/* Huruf A. / B. sejajar dengan teks */}
                                                                <span className="font-semibold min-w-[1.5rem]">{visualLetter}.</span>

                                                                {/* Konten Teks/Latex */}
                                                                <div className="flex-1">
                                                                    <Latex>{opt.text}</Latex>
                                                                </div>
                                                            </Label>

                                                            {/* Gambar (jika ada) tetap dibawah teks agar rapi */}
                                                            {opt.image && (
                                                                <img
                                                                    src={opt.image}
                                                                    alt={`Option ${visualLetter}`}
                                                                    className="mt-2 h-32 w-auto object-contain border rounded-md bg-white"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </RadioGroup>
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

                                    {currentQuestionIndex === listSoal.length - 1 ? (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="w-32 bg-green-600 hover:bg-green-700"
                                        >
                                            Submit
                                        </Button>
                                    ) : (
                                        <Button onClick={nextQuestion} className="w-32">
                                            Selanjutnya
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ) : (
                            <div className="text-center py-10">Tidak ada soal ditemukan.</div>
                        )}
                    </div>

                    {/* Sidebar Navigasi Soal */}
                    <aside className="w-80 border-l bg-card flex flex-col hidden md:flex">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-lg">Navigasi Soal</h3>
                            <p className="text-sm text-muted-foreground">Klik nomor untuk pindah soal</p>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {listSoal.map((_, idx) => {
                                    const isAnswered = !!answers[listSoal[idx].id_soal];
                                    const isCurrent = currentQuestionIndex === idx;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => jumpToQuestion(idx)}
                                            className={cn(
                                                "aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all border",
                                                isCurrent
                                                    ? "ring-2 ring-primary border-primary bg-primary/10 text-primary"
                                                    : isAnswered
                                                        ? "bg-green-500 text-white border-green-600 hover:bg-green-600"
                                                        : "bg-background hover:bg-accent text-muted-foreground"
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
                                    <div className="w-3 h-3 border rounded bg-background"></div>
                                    <span>Belum dijawab</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border rounded bg-green-500"></div>
                                    <span>Sudah dijawab</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border rounded ring-2 ring-primary bg-primary/10"></div>
                                    <span>Sedang dibuka</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                            >
                                Selesai & Submit
                            </Button>
                        </div>
                    </aside>
                </main>
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
            <Dialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Pengumpulan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mengumpulkan jawaban? Pastikan semua soal telah terjawab.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitConfirmOpen(false)}>Batal</Button>
                        <Button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700">Ya, Kumpulkan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function KerjakanSoalPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <KerjakanSoalContent />
        </Suspense>
    )
}