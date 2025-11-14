"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  Users,
  Wrench,
  Server,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "./button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "./sheet"
import Image from "next/image"
import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface NavItemProps {
  href: string
  label: string
  icon: React.ReactNode
  isActive?: boolean
  onNavigate?: () => void
}

const NavItem = ({ href, label, icon, isActive, onNavigate }: NavItemProps) => (
  <Link href={href} className="block w-full" onClick={onNavigate}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-4 text-sm px-4 py-3 h-auto transition-all duration-200",
        "text-zinc-400 hover:text-white hover:bg-white/10",
        "active:scale-[0.98]",
        isActive && "bg-white/15 text-white font-medium",
        "cursor-pointer"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Button>
  </Link>
)

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navigation = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutGrid className="h-[18px] w-[18px] stroke-[1.5px]" />,
    },
    {
      href: "/dashboard/customers",
      label: "Kunden",
      icon: <Users className="h-[18px] w-[18px] stroke-[1.5px]" />,
    },
    {
      href: "/dashboard/maintenance",
      label: "Wartungen",
      icon: <Wrench className="h-[18px] w-[18px] stroke-[1.5px]" />,
    },
    {
      href: "/dashboard/systems",
      label: "Systeme",
      icon: <Server className="h-[18px] w-[18px] stroke-[1.5px]" />,
    },
    {
      href: "/dashboard/settings",
      label: "Einstellungen",
      icon: <Settings className="h-[18px] w-[18px] stroke-[1.5px]" />,
    },
  ]

  const SidebarHeader = () => (
    <div className="flex items-center gap-3 px-4 py-6 border-b border-white/10">
      <Link href="/dashboard" className="relative h-10 w-10 flex-shrink-0">
        <Image
          src="/itaurus-logo.png"
          alt="iTaurus Logo"
          fill
          className="object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </Link>
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-white tracking-tight">iTaurus</span>
        <span className="text-xs text-zinc-400">Wartungsmanagement</span>
      </div>
    </div>
  )

  const SidebarNav = () => (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => (
        <NavItem
          key={item.href}
          {...item}
          isActive={item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)}
          onNavigate={() => isMobile && setIsOpen(false)}
        />
      ))}
    </nav>
  )

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-zinc-900">
      <SidebarHeader />
      <SidebarNav />
      <div className="border-t border-white/10 my-2" />
      <div className="px-2 pb-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-4 text-sm px-4 py-3 h-auto transition-all duration-200",
            "text-zinc-400 hover:text-white hover:bg-white/10",
            "active:scale-[0.98]",
            pathname === "/logout" && "bg-white/15 text-white font-medium",
            "cursor-pointer"
          )}
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/login")
                  if (isMobile) setIsOpen(false)
                },
              },
            })
          }}
        >
          <LogOut className="h-[18px] w-[18px] stroke-[1.5px]" />
          <span className="font-medium">Ausloggen</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-zinc-900 border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Header & Sidebar */}
      <div className="lg:hidden flex flex-col w-full">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 bg-zinc-900 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="relative h-8 w-8 flex-shrink-0">
              <Image
                src="/itaurus-logo.png"
                alt="iTaurus Logo"
                fill
                className="object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </Link>
            <span className="text-lg font-semibold text-white">iTaurus</span>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[280px] p-0 border-r-0 bg-zinc-900"
              onInteractOutside={() => setIsOpen(false)}
            >
              <SheetTitle className="sr-only">iTaurus Navigation</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>
        
        {/* Content Padding for Fixed Header */}
        <div className="h-16" />
      </div>
    </>
  )
} 