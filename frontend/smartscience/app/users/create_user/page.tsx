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
import {ArrowLeft, ChevronsUpDown, Save, Check, Loader2, Copy, RefreshCw, Eye, EyeOff} from "lucide-react"


interface Role {
  id_role: number
  nama_role: string
}

interface Kelas {
  id_kelas: number
  nama_kelas: string
}

interface DecodedToken {
  role: string
}

export default function CreateUserPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const [roles, setRoles] = useState<Role[]>([])
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [openRole, setOpenRole] = useState(false)
  const [openKelas, setOpenKelas] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertData, setAlertData] = useState({
      title: "",
      description: "",
      isSuccess: false
  })

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    id_role: "",
    id_kelas: "",
    created_by: "",
  })

  // Logic untuk mengecek role yang dipilih guna menampilkan/hide input kelas
  // Kita cek berdasarkan ID string yang tersimpan di formData
  const isAdminSelected = formData.id_role === "1"
  const isGuruSelected = formData.id_role === "2"
  const isSiswaSelected = formData.id_role === "3"

  useEffect(() => {
    const fetchData = async () => {
      try {
        // KEMBALIKAN API CALL DISINI
        const [roleRes, kelasRes] = await Promise.all([
          axios.get(`${API_URL}/api/v1/users/get_role_detail`),
          axios.post(`${API_URL}/api/v1/kelas/list_kelas`),
        ])

        if (roleRes.data?.roles) setRoles(roleRes.data.roles)
        if (kelasRes.data?.kelas) setKelasList(kelasRes.data.kelas)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setAlertData({
            title: "Gagal",
            description: "Failed to load options from server.",
            isSuccess: false
        })
        setAlertOpen(true)
      }
    }

    const token = Cookies.get("token")
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token)
        setUserRole(decoded.role)
      } catch (error) {
        console.error("Error decoding token:", error)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // LOGIC BARU: Automate kelas berdasarkan ID Role (1, 2, 3)
  const handleRoleChange = (value: string) => {
    let autoKelasId = ""

    // Jika Admin (id_role 1) -> id_kelas otomatis 1
    if (value === "1") {
      autoKelasId = "1"
    } 
    // Jika Guru (id_role 2) -> id_kelas otomatis 2
    else if (value === "2") {
      autoKelasId = "2"
    } 
    // Jika Siswa (id_role 3) atau lainnya -> id_kelas kosong (manual)
    else {
      autoKelasId = "" 
    }

    setFormData((prev) => ({
      ...prev,
      id_role: value,
      id_kelas: autoKelasId,
    }))
  }

  const handleKelasChange = (value: string) => {
    setFormData((prev) => ({ ...prev, id_kelas: value }))
  }

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
    let newPassword = ""
    for (let i = 0; i < 16; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setFormData((prev) => ({ ...prev, password: newPassword }))
    setShowPassword(true)
  }

  const copyToClipboard = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password)
      setAlertData({
        title: "Disalin",
        description: "Password berhasil disalin ke clipboard.",
        isSuccess: true
      })
      setAlertOpen(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.id_role || !formData.id_kelas) {
      setAlertData({
          title: "Gagal",
          description: "Please select both a Role and a Class",
          isSuccess: false
      })
      setAlertOpen(true)
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        id_role: Number(formData.id_role),
        id_kelas: Number(formData.id_kelas),
        created_by: userRole || "system",
      }

      await axios.post(`${API_URL}/api/v1/users/create_user`, payload)
      setAlertData({
          title: "Berhasil",
          description: "User created successfully!",
          isSuccess: true
      })
      setAlertOpen(true)
      setFormData({
        username: "",
        password: "",
        id_role: "",
        id_kelas: "",
        created_by: "",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      setAlertData({
          title: "Gagal",
          description: "Failed to create user.",
          isSuccess: false
      })
      setAlertOpen(true)
    } finally {
      setIsLoading(false)
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
          <h1 className="text-xl font-semibold md:text-2xl">Create User</h1>
          <div className="ml-auto"><UserMenu /></div>
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
                <CardTitle>Create a New User</CardTitle>
                <CardDescription>Fill in the details below.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Generate Secure Password">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={copyToClipboard} 
                        disabled={!formData.password}
                        title="Copy Password"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[0.8rem] text-muted-foreground">
                      Gunakan tombol refresh untuk membuat password aman secara otomatis.
                    </p>
                  </div>

                  {/* Role Select - Data diambil dari API */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Popover open={openRole} onOpenChange={setOpenRole}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openRole}
                                className="w-full justify-between"
                            >
                                {formData.id_role
                                    ? roles.find((role) => role.id_role.toString() === formData.id_role)?.nama_role
                                    : "Select a role"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search role..." />
                                <CommandList>
                                    <CommandEmpty>Role not found.</CommandEmpty>
                                    <CommandGroup>
                                        {roles.map((role) => (
                                            <CommandItem
                                                key={role.id_role}
                                                value={role.nama_role}
                                                onSelect={() => {
                                                    handleRoleChange(role.id_role.toString())
                                                    setOpenRole(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.id_role === role.id_role.toString() ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {role.nama_role}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  </div>

                  {/* Input Kelas: Hanya muncul jika BUKAN Admin (1) dan BUKAN Guru (2) */}
                  {!isAdminSelected && !isGuruSelected && (
                    <div className="space-y-2">
                      <Label htmlFor="kelas">Class (Kelas)</Label>
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
                                    : "Select a class"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search class..." />
                                <CommandList>
                                    <CommandEmpty>Class not found.</CommandEmpty>
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
                      {/* Pesan bantuan khusus Siswa */}
                      {isSiswaSelected && <p className="text-xs text-muted-foreground">Siswa wajib memilih kelas.</p>}
                    </div>
                  )}

                  {/* Feedback Visual: Memberi tahu user bahwa kelas sudah di-set otomatis */}
                  {(isAdminSelected || isGuruSelected) && (
                     <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                        Class automatically set to ID {formData.id_kelas} ({isAdminSelected ? "Admin" : "Guru"})
                     </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                      {isLoading ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                          </>
                      ) : (
                          <>
                              <Save className="mr-2 h-4 w-4" />
                              Create User
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