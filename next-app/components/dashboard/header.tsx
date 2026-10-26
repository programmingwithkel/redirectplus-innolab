"use client"

import { Menu, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/lib/actions/auth-actions"

interface DashboardHeaderProps {
  userName: string
  onMenuClick: () => void
}

export function DashboardHeader({
  userName,
  onMenuClick,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden text-sm text-muted-foreground lg:block">
          Healthcare Referral System
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{userName}</span>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-600"
          >
            <LogOut className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
