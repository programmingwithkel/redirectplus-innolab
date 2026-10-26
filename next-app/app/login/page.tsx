
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, signupAction, getFacilitiesForAuthAction } from "@/lib/actions/auth-actions"

interface FacilityOption {
  id: string
  name: string
  facility_type: string
  city?: string | null
}

const FALLBACK_FACILITIES: FacilityOption[] = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    name: "Bicol Regional Hospital and Medical Center (BRHMC)",
    facility_type: "TERTIARY",
    city: "Daraga / Legazpi",
  },
  {
    id: "b1111111-1111-1111-1111-111111111111",
    name: "Rural Health Unit Legazpi City",
    facility_type: "RHU",
    city: "Legazpi City",
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    name: "Rural Health Unit Tabaco City",
    facility_type: "RHU",
    city: "Tabaco City",
  },
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: "Barangay Health Station Daraga",
    facility_type: "BHS",
    city: "Daraga",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    name: "Barangay Health Station Camalig",
    facility_type: "BHS",
    city: "Camalig",
  },
]

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [facilityId, setFacilityId] = useState("")

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Feedback & Loading
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Facilities
  const [facilities, setFacilities] = useState<FacilityOption[]>(FALLBACK_FACILITIES)

  useEffect(() => {
    async function loadFacilities() {
      try {
        const data = await getFacilitiesForAuthAction()
        if (data && data.length > 0) {
          setFacilities(data)
          if (!facilityId) {
            setFacilityId(data[0].id)
          }
        } else {
          setFacilityId(FALLBACK_FACILITIES[0].id)
        }
      } catch {
        setFacilityId(FALLBACK_FACILITIES[0].id)
      }
    }
    loadFacilities()
  }, [])

  function handleDemoFill(demoEmail: string) {
    setEmail(demoEmail)
    setPassword("CareRoute2026!")
    setError(null)
    setSuccess(null)
  }

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch {
      // In Next.js redirect throws a NEXT_REDIRECT which is expected on success
      setLoading(false)
    }
  }

  async function handleSignupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("fullName", fullName)
      formData.append("email", email)
      formData.append("password", password)
      if (facilityId) {
        formData.append("facilityId", facilityId)
      }

      const result = await signupAction(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        setSuccess(result.success)
        setLoading(false)
        // Reset password fields and switch to login tab after brief pause
        setTimeout(() => {
          setMode("login")
          setSuccess("Account ready! Please sign in with your credentials.")
        }, 1500)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0fbf5] via-white to-[#e6f7ef] px-4 py-12 selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">

      {/* Decorative background aura blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-[#a7f3d0]/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#bbf7d0]/30 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"
      />

      <div className="w-full max-w-md z-10">

        {/* Brand Header */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <div className="relative flex h-12 w-12 items-center justify-center shrink-0">
              <Image
                src="/images/logo.png"
                alt="Redirect+ Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold tracking-tight text-[#113a30] leading-none">
                Redirect+ <span className="text-[#0d7857]">Bicol</span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-1">
                Right Hospital. Rescued Faster.
              </p>
            </div>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-emerald-950/5">

          {/* Segmented Mode Switcher (Sign In vs Sign Up) */}
          <div className="mb-6 flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${mode === "login"
                ? "bg-white text-[#113a30] shadow-sm"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${mode === "signup"
                ? "bg-white text-[#0d7857] shadow-sm"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <p className="leading-relaxed">{success}</p>
            </div>
          )}

          {/* =========================================================================
              SIGN IN FORM
          ========================================================================= */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@careroute.ph"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#0d7857] focus:ring-emerald-700/20 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Password with Hide / Show toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      alert("To reset password, contact your facility administrator or system coordinator.")
                    }}
                    className="text-[11px] font-medium text-[#0d7857] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus:border-[#0d7857] focus:ring-emerald-700/20 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#0d7857] hover:bg-[#0a6347] text-white font-semibold shadow-md shadow-emerald-900/15 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Quick Fill Demo Accounts */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    Quick Demo Accounts
                  </span>
                  <span className="text-[10px] text-slate-400">Click to fill</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoFill("admin@careroute.ph")}
                    className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      👑
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-800 truncate">Super Admin</p>
                      <p className="text-[9px] text-slate-400 truncate">admin@careroute.ph</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("bhs@careroute.ph")}
                    className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      🏥
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-800 truncate">BHS Staff</p>
                      <p className="text-[9px] text-slate-400 truncate">bhs@careroute.ph</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("rhu@careroute.ph")}
                    className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 text-[10px] font-bold">
                      🩺
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-800 truncate">RHU Staff</p>
                      <p className="text-[9px] text-slate-400 truncate">rhu@careroute.ph</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("tertiary@careroute.ph")}
                    className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition cursor-pointer"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-800 text-[10px] font-bold">
                      🏨
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-800 truncate">Hospital Staff</p>
                      <p className="text-[9px] text-slate-400 truncate">tertiary@careroute.ph</p>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* =========================================================================
              SIGN UP FORM
          ========================================================================= */}
          {mode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">

              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="signup-name" className="text-xs font-bold text-slate-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Maria Santos, MD"
                    required
                    disabled={loading}
                    className="pl-10 h-10 rounded-xl border-slate-200 focus:border-[#0d7857] text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="signup-email" className="text-xs font-bold text-slate-700">
                  Official Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria.santos@careroute.ph"
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="pl-10 h-10 rounded-xl border-slate-200 focus:border-[#0d7857] text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Assigned Facility */}
              <div className="space-y-1">
                <Label htmlFor="signup-facility" className="text-xs font-bold text-slate-700">
                  Assigned Healthcare Facility
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    id="signup-facility"
                    name="facilityId"
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    disabled={loading}
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:border-[#0d7857] focus:outline-hidden"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.facility_type}] {f.name} {f.city ? `(${f.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password with Hide / Show toggle */}
              <div className="space-y-1">
                <Label htmlFor="signup-password" className="text-xs font-bold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    className="pl-10 pr-10 h-10 rounded-xl border-slate-200 focus:border-[#0d7857] text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-hidden cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password with Hide / Show toggle */}
              <div className="space-y-1">
                <Label htmlFor="signup-confirm-password" className="text-xs font-bold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    disabled={loading}
                    className="pl-10 pr-10 h-10 rounded-xl border-slate-200 focus:border-[#0d7857] text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-hidden cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Notice note */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                <Shield className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  New accounts are assigned <strong>Operational Staff</strong> role linked to your chosen facility.
                </span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#0d7857] hover:bg-[#0a6347] text-white font-semibold shadow-md shadow-emerald-900/15 cursor-pointer mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Toggle between modes */}
          <div className="mt-5 text-center text-xs text-slate-500">
            {mode === "login" ? (
              <p>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="font-bold text-[#0d7857] hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setError(null)
                    setSuccess(null)
                  }}
                  className="font-bold text-[#0d7857] hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to Home Link */}
        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#0d7857] hover:underline font-medium transition">
            <span>← Return to Redirect+ Bicol Home</span>
          </Link>
        </p>
      </div>
    </div>
  )
}
