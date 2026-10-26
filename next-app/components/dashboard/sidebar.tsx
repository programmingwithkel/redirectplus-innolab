"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FilePlus,
  Inbox,
  Send,
  Building2,
  Package,
  User,
  Heart,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Create Referral",
    href: "/dashboard/referrals/create",
    icon: FilePlus,
  },
  {
    label: "Incoming Referrals",
    href: "/dashboard/referrals/incoming",
    icon: Inbox,
  },
  {
    label: "Outgoing Referrals",
    href: "/dashboard/referrals/outgoing",
    icon: Send,
  },
  {
    label: "Facility Directory",
    href: "/dashboard/facilities",
    icon: Building2,
  },
  {
    label: "Resources",
    href: "/dashboard/resources",
    icon: Package,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

interface DashboardSidebarProps {
  facilityName: string
  facilityType: string
  open: boolean
  onClose: () => void
}

export function DashboardSidebar({
  facilityName,
  facilityType,
  open,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
              <Image
                src="/images/logo.png"
                alt="Redirect+ Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#113a30] leading-none">
                Redirect+
              </span>
              <span className="text-[10px] text-muted-foreground font-medium leading-none mt-1">
                Bicol
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Facility badge */}
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-xs font-medium text-foreground">
            {facilityName}
          </p>
          <span
            className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--facility-light)",
              color: "var(--facility-dark)",
            }}
          >
            {facilityType}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href))

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "font-medium text-white"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: "var(--facility-primary)",
                          }
                        : undefined
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Redirect+ Bicol v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
