"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils"; // Pastikan punya utilitas ini, atau hapus dan pakai string biasa

// --- Tipe Data ---
interface MenuItem {
  title: string;
  href?: string;
  icon?: React.ElementType;
  roles?: string[]; // Role apa saja yang boleh lihat
  items?: MenuItem[]; // Submenu
}

interface DecodedToken {
  role: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  // 1. Cek Role saat mount (Logic sama seperti di DashboardPage)
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error("Error decoding token in sidebar", error);
      }
    }
  }, []);

  // 2. Definisi Menu (Sesuai request kamu dengan perbaikan sintaks)
  const menuItems: MenuItem[] = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "siswa"]
    },
    {
      title: "Overview",
      href: "/dashboard/dashboard_guru",
      icon: LayoutDashboard,
      roles: ["guru"]
    },
    {
      title: "Users",
      icon: Users,
      roles: ["admin"],
      items: [
        {
          title: "Create User",
          href: "/users/create_user",
          roles: ["admin"],
        },
        {
          title: "List User",
          href: "/users/list_user",
          roles: ["admin"],
        }
      ],
    },
    {
      title: "Kelas",
      icon: Users,
      items: [
        {
          title: "Buat Kelas",
          href: "/kelas/create_kelas",
          roles: ["guru", "admin"],
        },
        {
          title: "List Kelas",
          href: "/kelas/list_kelas",
          roles: ["guru", "admin"],
        },
      ],
    },
    {
      title: "Mata Pelajaran",
      icon: BookOpen,
      items: [
        {
          title: "Buat Mata Pelajaran",
          href: "/mata_pelajaran/create_mata_pelajaran",
          roles: ["guru"],
        },
        {
          title: "List Mata Pelajaran",
          href: "/mata_pelajaran/list_mata_pelajaran",
          roles: ["guru"],
        },
        {
          title: "Tautkan Mata Pelajaran",
          href: "/mata_pelajaran/tautkan_mata_pelajaran",
          roles: ["guru"],
        }
      ],
    },
    {
      title: "Bab",
      icon: BookOpen,
      items: [
        {
          title: "Buat Bab",
          href: "/bab/create_bab",
          roles: ["guru"],
        },
        {
          title: "List Bab",
          href: "/bab/list_bab",
          roles: ["guru"],
        },
        {
          title: "Tautkan Bab",
          href: "/bab/tautkan_bab",
          roles: ["guru"],
        }
      ],
    },
    {
      title: "Soal",
      icon: BookOpen,
      items: [
        {
          title: "Buat Soal",
          href: "/soal/create_soal",
          roles: ["guru"],
        },
        {
          title: "List Soal",
          href: "/soal/list_soal_bab",
          roles: ["guru"],
        },
      ],
    },
    {
      title: "TOB",
      icon: BookOpen,
      items: [
        {
          title: "Buat TOB",
          href: "/tob/create_tob",
          roles: ["guru"],
        },
        {
          title: "List TOB",
          href: "/tob/list_tob",
          roles: ["guru"],
        },
        {
          title: "List TOB Siswa",
          href: "/tob/list_tob_siswa",
          roles: ["siswa"],
        },
        {
          title: "List Hasil TOB Siswa",
          href: "/tob/list_hasil_tob_siswa",
          roles: ["siswa"],
        },
      ]
    },
  ];

  // Buka submenu secara otomatis jika ada item aktif di dalamnya
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.items && item.items.some((subItem) => subItem.href === pathname)) {
        setOpenSubmenus((prev) => ({ ...prev, [item.title]: true }));
      }
    });
  }, [pathname]);

  // 3. Helper: Toggle Submenu
  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // 4. Helper: Cek Izin Akses
  const hasAccess = (itemRoles?: string[]) => {
    // Jika tidak ada batasan role, boleh akses
    if (!itemRoles || itemRoles.length === 0) return true;
    // Jika userRole belum load, sembunyikan dulu (opsional) atau tampilkan skeleton
    if (!userRole) return false;
    return itemRoles.includes(userRole);
  };

  // 5. Fungsi Render Menu Recursively (Simpel 2 Level)
  const renderMenu = (items: MenuItem[]) => {
    return items.map((item, index) => {
      // a. Cek Permission Parent
      if (!hasAccess(item.roles)) return null;

      // b. Jika punya Submenu (items)
      if (item.items && item.items.length > 0) {
        // Cek apakah user punya akses ke setidaknya SATU submenu di dalamnya
        const hasChildAccess = item.items.some((child) => hasAccess(child.roles));
        if (!hasChildAccess) return null; // Sembunyikan parent jika semua anak tidak boleh diakses

        const isOpen = openSubmenus[item.title];
        const Icon = item.icon;

        return (
          <div key={index} className="mb-2">
            <button
              onClick={() => toggleSubmenu(item.title)}
              className="flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {/* Render Submenu */}
            {isOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l pl-2">
                {item.items.map((subItem, subIndex) => {
                  if (!hasAccess(subItem.roles)) return null;
                  return (
                    <Link
                      key={subIndex}
                      href={subItem.href || "#"}
                      className={cn(
                        "block rounded-md px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === subItem.href ? "bg-accent/50 text-primary font-semibold" : "text-muted-foreground"
                      )}
                    >
                      {subItem.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      // c. Jika Menu Biasa (Single Link)
      const Icon = item.icon;
      return (
        <Link
          key={index}
          href={item.href || "#"}
          className={cn(
            "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground mb-1",
            pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </Link>
      );
    });
  };

  return (
    <aside className="w-64 border-r bg-card text-card-foreground hidden md:block">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold">Smart Science App</span>
      </div>
      <div className="p-4">
        <nav className="space-y-1">
          {renderMenu(menuItems)}
        </nav>
      </div>
    </aside>
  );
}