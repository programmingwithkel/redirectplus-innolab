import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Access Denied
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe
          this is an error, contact your system administrator.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-green-700 hover:bg-green-800">
              Sign In Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
