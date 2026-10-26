"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Heart,
  Play,
  X,
  Clock,
  Menu,
  Building,
  Ambulance,
  Compass,
  PhoneCall,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [watchModalOpen, setWatchModalOpen] = useState(false)
  const [findHospitalModalOpen, setFindHospitalModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "find" | "about" | "contact">("home")

  // Interactive quick triage state for modal
  const [selectedUrgency, setSelectedUrgency] = useState<"emergency" | "urgent" | "routine">("emergency")
  const [selectedService, setSelectedService] = useState<string>("surgery")
  const [selectedLocation, setSelectedLocation] = useState<string>("Legazpi City Port")

  return (
    <div className="relative min-h-screen bg-white text-slate-800 overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">

      {/* =========================================================================
          BACKGROUND DECORATIVE ORGANIC SAGE-MINT SHAPE (Right Side)
          Matches the reference design's fluid mint curved background
      ========================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-[55vw] max-w-[880px] h-[780px] lg:h-[900px] -z-10 overflow-hidden"
      >
        <svg
          viewBox="0 0 900 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 right-0 w-full h-full"
        >
          {/* Main sweeping curved wave matching the reference screenshot */}
          <path
            d="M900 0C680 0 540 60 480 200C410 360 520 540 440 700C380 820 220 860 0 900H900V0Z"
            fill="#c8ebd9"
            fillOpacity="0.55"
          />
          {/* Layered lighter mint glow */}
          <path
            d="M900 60C740 60 620 120 560 260C500 400 600 560 540 720C500 800 360 850 180 890H900V60Z"
            fill="#e2f7ed"
            fillOpacity="0.45"
          />
          {/* Soft circular aura behind mockup card */}
          <circle cx="620" cy="450" r="320" fill="#bcf0d7" fillOpacity="0.3" />
        </svg>
      </div>

      {/* =========================================================================
          1. HEADER / NAVBAR
          Logo (pin + white cross) | CareRoute Bicol | Navigation links | Log In & Get Started
      ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/90 transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center shrink-0">
              <Image
                src="/images/logo.png"
                alt="Redirect+ Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#113a30]">
                Redirect+ <span className="text-[#0d7857]">Bicol</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5">
                Right Hospital. Rescued Faster.
              </span>
            </div>

          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="#home"
              onClick={() => setActiveTab("home")}
              className={`relative py-1 transition-colors ${activeTab === "home"
                ? "text-[#113a30] font-bold after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-[#0d7857] after:rounded-full"
                : "text-slate-600 hover:text-emerald-800"
                }`}
            >
              Home
            </Link>
            <button
              onClick={() => {
                setActiveTab("find")
                setFindHospitalModalOpen(true)
              }}
              className="text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Find a Hospital
            </button>
            <Link
              href="#how-it-works"
              onClick={() => setActiveTab("about")}
              className="text-slate-600 hover:text-emerald-800 transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              onClick={() => setActiveTab("contact")}
              className="text-slate-600 hover:text-emerald-800 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-full border-slate-300 hover:border-slate-400 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
              >
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full bg-[#0d7857] hover:bg-[#0a6347] px-6 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 hover:shadow-emerald-900/25 transition-all">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white/98 px-6 py-4 space-y-3 shadow-lg">
            <Link
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-[#0d7857]"
            >
              Home
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setFindHospitalModalOpen(true)
              }}
              className="block w-full text-left py-2 text-base font-medium text-slate-600 hover:text-emerald-800"
            >
              Find a Hospital
            </button>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-600 hover:text-emerald-800"
            >
              About
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-600 hover:text-emerald-800"
            >
              Contact
            </Link>
            <div className="pt-3 flex flex-col gap-2 border-t border-slate-100">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full rounded-full border-slate-300">
                  Log In
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button className="w-full rounded-full bg-[#0d7857] hover:bg-[#0a6347] text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION
          Left: Pill, Headline, Description, CTA Buttons + Mayon Volcano landscape in bottom-left
          Right: 3D-Elevated Mockup Card with Google Maps Route & Recommended Hospital Panel
      ========================================================================= */}
      <section id="home" className="relative pt-10 pb-20 lg:pt-16 lg:pb-32 overflow-hidden">

        {/* Mayon Volcano scenic landscape in bottom-left corner of hero */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-[360px] sm:w-[460px] lg:w-[560px] h-[190px] sm:h-[240px] pointer-events-none z-0 overflow-hidden"
        >
          <div className="relative w-full h-full">
            <Image
              src="/images/mayon_volcano.jpg"
              alt="Mayon Volcano Albay Gulf landscape"
              fill
              sizes="(max-width: 768px) 360px, 560px"
              className="object-cover object-bottom"
              priority
            />
            {/* Seamless fading gradient masks into white page background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-12 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-6 z-10">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-[#ebf9f2] px-4 py-1.5 text-xs font-semibold text-[#0d7857] mb-6 shadow-2xs">
                <span>Bicol&apos;s Smart Hospital Routing System</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-[#113a30] leading-[1.12] tracking-tight">
                Every Referral Connected,
                <br />
                <span>Every Next Step Coordinated.</span>
              </h1>

              {/* Paragraph Description */}
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
                Redirect+ helps you get to the nearest hospital that can actually
                accommodate your medical needs — with real-time availability, verified
                services, and Google Maps directions.
              </p>

              {/* CTA Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setFindHospitalModalOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#0d7857] hover:bg-[#0a6347] text-white px-7 py-3.5 text-base font-semibold shadow-lg shadow-emerald-900/15 hover:shadow-emerald-900/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <MapPin className="h-5 w-5 fill-white text-[#0d7857]" />
                  <span>Find a Hospital</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </button>

                <button
                  onClick={() => setWatchModalOpen(true)}
                  className="inline-flex items-center gap-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-6 py-3.5 text-base font-semibold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[#0d7857]">
                    <Play className="h-3 w-3 fill-[#0d7857] ml-0.5" />
                  </div>
                  <span>Watch How It Works</span>
                </button>
              </div>
            </div>

            {/* Right Column: Realistic Google Maps Mockup Card */}
            <div className="lg:col-span-6 relative z-10">
              {/* Elevated Perspective Card Wrapper */}
              <div className="relative mx-auto w-full max-w-xl lg:max-w-none rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-emerald-950/10 p-3 sm:p-3.5 transition-transform duration-500 hover:rotate-0 lg:rotate-[-0.75deg]">

                {/* Inner Two-Column Map + Panel Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">

                  {/* Map View Area (55% width on md+) */}
                  <div className="md:col-span-6 lg:col-span-7 relative min-h-[310px] md:min-h-[470px] overflow-hidden bg-[#d9ebe2]">
                    {/* Legazpi City Map Background Image - scaled to crop top UI bars cleanly */}
                    <div className="relative w-full h-full scale-[1.18] origin-[45%_55%]">
                      <Image
                        src="/images/legazpi_map.jpg"
                        alt="Legazpi City and Albay Gulf Routing Map"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover object-[45%_60%]"
                        priority
                      />
                    </div>

                    {/* Interactive Overlay: Destination Marker with Red Pin & Medical Cross */}
                    <div className="absolute top-[28%] left-[48%] -translate-x-1/2 -translate-y-full flex flex-col items-center group cursor-pointer z-20">
                      <div className="relative flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-rose-600 text-white shadow-lg flex items-center justify-center border-2 border-white animate-bounce">
                          <span className="text-white font-bold text-sm leading-none">+</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-rose-700 rotate-45 -mt-1 shadow-xs" />
                      </div>
                      <div className="bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-200 mt-1 whitespace-nowrap">
                        BRHMC (Destination)
                      </div>
                    </div>

                    {/* Start Marker at Legazpi City Port */}
                    <div className="absolute bottom-[30%] right-[26%] flex flex-col items-center z-20">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute h-6 w-6 rounded-full bg-blue-500/30 animate-ping" />
                        <div className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
                      </div>
                      <div className="bg-white/95 backdrop-blur-xs text-[9px] font-semibold text-slate-700 px-1.5 py-0.5 rounded shadow-2xs border border-slate-200 mt-1">
                        Legazpi City (You)
                      </div>
                    </div>

                    {/* Google Maps Logo Watermark */}
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded shadow-xs border border-slate-200/80 flex items-center gap-1 z-20">
                      <span className="text-[11px] font-medium tracking-tight">
                        <span className="font-bold text-[#4285F4]">G</span>
                        <span className="font-bold text-[#EA4335]">o</span>
                        <span className="font-bold text-[#FBBC05]">o</span>
                        <span className="font-bold text-[#4285F4]">g</span>
                        <span className="font-bold text-[#34A853]">l</span>
                        <span className="font-bold text-[#EA4335]">e</span>
                        <span className="text-slate-600 ml-1 font-semibold text-[10px]">Maps</span>
                      </span>
                    </div>
                  </div>

                  {/* Recommended Hospital Side Card (45% width on md+) */}
                  <div className="md:col-span-6 lg:col-span-5 bg-white p-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200/80">
                    <div>
                      {/* Top Card Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0d7857] text-white text-[11px] font-bold">
                            +
                          </div>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">
                            Recommended Hospital
                          </span>
                        </div>
                        <button
                          onClick={() => setFindHospitalModalOpen(true)}
                          className="text-slate-400 hover:text-slate-600 transition"
                          title="Options"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Hospital Photo & Details */}
                      <div className="mt-3">
                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden shadow-xs border border-slate-100">
                          <Image
                            src="/images/hospital_brhmc.jpg"
                            alt="Bicol Regional Hospital and Medical Center"
                            fill
                            sizes="(max-width: 768px) 100vw, 250px"
                            className="object-cover"
                          />
                        </div>

                        <div className="mt-2.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            Bicol Regional Hospital and Medical Center
                          </h4>
                          <span className="inline-block mt-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#0d7857]">
                            Tertiary Hospital
                          </span>

                          {/* Distance & Status */}
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>18 min (7.2 km)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                              </span>
                              <span>Open · Accepting patients</span>
                            </div>
                          </div>

                          {/* Get Directions CTA Button */}
                          <Link
                            href="https://maps.google.com/?q=Bicol+Regional+Hospital+and+Medical+Center+Legazpi+City"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0d7857] hover:bg-[#0a6347] py-2 px-3 text-xs font-semibold text-white shadow-xs transition"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            <span>Get Directions</span>
                            <ArrowRight className="h-3 w-3 ml-0.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Other Suitable Hospitals Section */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 mb-2">
                          <Compass className="h-3.5 w-3.5 text-[#0d7857]" />
                          <span>Other Suitable Hospitals</span>
                        </div>

                        <div className="space-y-2">
                          {/* Item 1 */}
                          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <Building className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                                  St. Raphael Hospital
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Secondary Hospital
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  24 min (10.3 km)
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Available
                            </span>
                          </div>

                          {/* Item 2 */}
                          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                                <Building className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                                  RHU Daraga
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  Rural Health Unit
                                </p>
                                <p className="text-[9px] text-slate-400">
                                  32 min (15.8 km)
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              Limited
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. VALUE PROPOSITION BAR (4 FEATURE HIGHLIGHTS STRIP)
          Nearest Suitable Hospital | Verified Availability | Google Maps | For Healthier Bicol
      ========================================================================= */}
      <section className="border-y border-slate-100 bg-[#fbfdfc] py-8 lg:py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebf9f2] text-[#0d7857] shadow-2xs">
                <MapPin className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Nearest Suitable Hospital
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Not just the closest — but the right hospital for your condition.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 p-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebf9f2] text-[#0d7857] shadow-2xs">
                <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Verified Availability
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Real-time updates on services, beds, and resources.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 p-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebf9f2] text-[#0d7857] shadow-2xs">
                <Navigation className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Google Maps Integration
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  See travel time, distance, and get turn-by-turn directions.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-4 p-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ebf9f2] text-[#0d7857] shadow-2xs">
                <div className="relative flex items-center justify-center">
                  <Heart className="h-6 w-6 stroke-[2.2] fill-emerald-100" />
                  <span className="absolute font-bold text-xs text-[#0d7857] leading-none">+</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  For Healthier Bicol
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Better access. Faster care. Stronger communities.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "HOW IT WORKS" SECTION
          Headline + 4 Steps with Connecting Arrows `→` + Bicol Region Map & Cursive Tag
      ========================================================================= */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">

          {/* Section Heading & Subtitle */}
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-[#ebf9f2] border border-emerald-200 px-3.5 py-1 text-[11px] font-bold text-[#0d7857] uppercase tracking-wider mb-3">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#113a30] tracking-tight">
              Simple Steps to
              <br />
              Get the Right Care
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Redirect+ makes it easy to find and reach the best hospital for
              your needs — in just a few steps.
            </p>
          </div>

          {/* Workflow Steps Row with Connecting Arrows & Bicol Region Map */}
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* 4 Steps Flow with connecting arrows between them */}
            <div className="lg:col-span-9">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 lg:gap-2">

                {/* Step 1 */}
                <div className="flex-1 flex flex-col items-start pr-1 group">
                  <div className="relative mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#0d7857] shadow-2xs group-hover:scale-105 transition-transform">
                      <MapPin className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d7857] text-[10px] font-bold text-white shadow-xs">
                      1
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#113a30] leading-snug">
                    Tell Us Your Location and Needs
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Share your current location, medical condition, and urgency.
                  </p>
                </div>

                {/* Arrow 1 */}
                <div className="hidden xl:flex items-center justify-center pt-5 text-slate-300 font-light text-2xl select-none px-2">
                  →
                </div>

                {/* Step 2 */}
                <div className="flex-1 flex flex-col items-start pr-1 group">
                  <div className="relative mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#0d7857] shadow-2xs group-hover:scale-105 transition-transform">
                      <Building className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d7857] text-[10px] font-bold text-white shadow-xs">
                      2
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#113a30] leading-snug">
                    We Check Hospital Capabilities
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    We match your needs with available services and resources.
                  </p>
                </div>

                {/* Arrow 2 */}
                <div className="hidden xl:flex items-center justify-center pt-5 text-slate-300 font-light text-2xl select-none px-2">
                  →
                </div>

                {/* Step 3 */}
                <div className="flex-1 flex flex-col items-start pr-1 group">
                  <div className="relative mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#0d7857] shadow-2xs group-hover:scale-105 transition-transform">
                      <Compass className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d7857] text-[10px] font-bold text-white shadow-xs">
                      3
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#113a30] leading-snug">
                    Get the Best Recommendation
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    See the nearest suitable hospital with verified availability and travel time.
                  </p>
                </div>

                {/* Arrow 3 */}
                <div className="hidden xl:flex items-center justify-center pt-5 text-slate-300 font-light text-2xl select-none px-2">
                  →
                </div>

                {/* Step 4 */}
                <div className="flex-1 flex flex-col items-start group">
                  <div className="relative mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#0d7857] shadow-2xs group-hover:scale-105 transition-transform">
                      <Ambulance className="h-6 w-6 stroke-[2.2]" />
                    </div>
                    <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0d7857] text-[10px] font-bold text-white shadow-xs">
                      4
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#113a30] leading-snug">
                    Follow the Route
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Use Google Maps for directions and reach care faster and safer.
                  </p>
                </div>

              </div>
            </div>

            {/* Right Side: Bicol Region Map Graphic & Handwritten Tag */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center text-center p-2">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <Image
                  src="/images/bicol_map.jpg"
                  alt="Bicol Region Map Silhouette"
                  width={210}
                  height={210}
                  className="object-contain mix-blend-multiply opacity-85 hover:scale-105 transition-transform"
                />

                {/* Region Label */}
                <div className="absolute top-6 right-2 text-right">
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-700 uppercase block">
                    Bicol
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
                    Region
                  </span>
                </div>
              </div>

              {/* Handwritten cursive text: "Sa Bicol, mas malapit ang tulong. ♡" */}
              <div
                className="text-[#15803d] text-2xl sm:text-3xl font-bold leading-tight -rotate-3 mt-2 hover:rotate-0 transition-transform select-none"
                style={{ fontFamily: "var(--font-handwriting), 'Caveat', cursive" }}
              >
                Sa Bicol,
                <br />
                mas malapit
                <br />
                ang tulong. <span className="inline-block text-[#16a34a]">♡</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          5. HEALTHCARE NETWORK DIRECTORY PREVIEW
      ========================================================================= */}
      <section className="border-t border-slate-100 bg-[#fbfdfc] py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-[#113a30]">
              Connected Healthcare Across the 6 Provinces
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Coordinating triage and patient routing across Albay, Camarines Sur,
              Camarines Norte, Sorsogon, Catanduanes, and Masbate.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">
                  BHS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Barangay Health Stations</h4>
                  <span className="text-[11px] text-emerald-700 font-medium">Community Level Access</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Primary triage and immediate local assistance. Initiates urgent referral
                requests to the nearest specialized center.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold text-xs">
                  RHU
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Rural Health Units</h4>
                  <span className="text-[11px] text-blue-700 font-medium">Secondary & Diagnostic Care</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Municipal health units equipped with outpatient labs, basic surgery,
                maternal delivery, and intermediate emergency stabilizing care.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold text-xs">
                  TH
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Tertiary Regional Hospitals</h4>
                  <span className="text-[11px] text-purple-700 font-medium">Specialized & ICU Facilities</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Regional centers such as BRHMC and BMC Naga with advanced trauma,
                cardiac, surgical suites, and intensive care capacity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FOOTER
      ========================================================================= */}
      <footer id="contact" className="border-t border-slate-200/80 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center shrink-0">
                  <Image
                    src="/images/logo.png"
                    alt="Redirect+ Logo"
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-[#113a30]">
                  Redirect+ <span className="text-[#0d7857]">Bicol</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connecting Bicol Region&apos;s healthcare network with smart hospital routing,
                real-time capability matching, and verified bed availability.
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Platform
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <button onClick={() => setFindHospitalModalOpen(true)} className="hover:text-emerald-700 cursor-pointer">
                    Hospital Finder
                  </button>
                </li>
                <li>
                  <button onClick={() => setWatchModalOpen(true)} className="hover:text-emerald-700 cursor-pointer">
                    Routing Engine Demo
                  </button>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-700">
                    Referral Portal Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-emerald-700">
                    Facility Coordinator Access
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Facilities in Bicol */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Key Facilities
              </h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>Bicol Regional Hospital & Medical Center (BRHMC)</li>
                <li>Bicol Medical Center (BMC Naga)</li>
                <li>Albay Doctors Hospital</li>
                <li>Estevez Memorial Hospital</li>
                <li>Rural Health Units (Daraga, Legazpi, Polangui)</li>
              </ul>
            </div>

            {/* Col 4: Emergency Contacts */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
                Emergency Hotlines
              </h5>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>DOH Healthline: <strong>1555</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>Bicol Emergency: <strong>911</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>BRHMC ER: <strong>(052) 483-0017</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Redirect+  — Healthcare Routing & Referral System</p>
            <p className="text-emerald-700 font-medium">Bicol Region, Philippines</p>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          INTERACTIVE MODAL: "Watch How It Works" Simulation
      ========================================================================= */}
      {watchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setWatchModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#0d7857]">
                <Play className="h-4 w-4 fill-[#0d7857] ml-0.5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  How Redirect+ Smart Routing Works
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive simulation of patient dispatch from Legazpi Port to BRHMC
                </p>
              </div>
            </div>

            {/* Simulation Steps */}
            <div className="space-y-4 my-6">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d7857] text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Patient Triage Assessment</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Patient diagnosed with <strong>Acute Appendicitis with Signs of Perforation</strong> at Legazpi Port Health Clinic. Urgency: <strong>Emergency (Red)</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d7857] text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Capability & Bed Availability Filter</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Redirect+ checks nearby hospitals for: Operating Room on standby, General Surgeon on duty, and surgical ward beds. RHUs are ruled out due to lack of surgical suites.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 p-4 bg-emerald-50/60 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d7857] text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Recommended Hospital Selected</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    <strong>Bicol Regional Hospital and Medical Center (BRHMC)</strong> matches 100% of required clinical criteria. Travel ETA: <strong>18 minutes (7.2 km)</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d7857] text-white text-xs font-bold">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant Referral & Live Route Guidance</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Receiving hospital is pre-notified of the incoming patient, and ambulance crew receives optimal turn-by-turn navigation via Google Maps.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setWatchModalOpen(false)}
                className="rounded-full cursor-pointer"
              >
                Close
              </Button>
              <Link href="/login">
                <Button className="rounded-full bg-[#0d7857] hover:bg-[#0a6347] text-white">
                  Enter Healthcare Portal
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MODAL: "Find a Hospital" Live Triage Tester
      ========================================================================= */}
      {findHospitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setFindHospitalModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#0d7857]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Find Nearest Suitable Hospital
                </h3>
                <p className="text-xs text-slate-500">
                  Select your current location and medical needs for an instant recommendation
                </p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              {/* Location Select */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Current Location in Bicol
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 focus:border-[#0d7857] focus:outline-hidden"
                >
                  <option value="Legazpi City Port">Legazpi City Port (Albay)</option>
                  <option value="Daraga Town Center">Daraga Town Center (Albay)</option>
                  <option value="Tabaco City Hall">Tabaco City Hall (Albay)</option>
                  <option value="Ligao City Public Market">Ligao City Public Market (Albay)</option>
                  <option value="Naga City Centro">Naga City Centro (Camarines Sur)</option>
                  <option value="Sorsogon City Capitol">Sorsogon City Capitol (Sorsogon)</option>
                </select>
              </div>

              {/* Service Need */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Required Medical Care
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService("surgery")}
                    className={`rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedService === "surgery"
                      ? "border-[#0d7857] bg-emerald-50 text-[#0d7857]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    Emergency Surgery
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService("trauma")}
                    className={`rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedService === "trauma"
                      ? "border-[#0d7857] bg-emerald-50 text-[#0d7857]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    ICU / Trauma
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedService("primary")}
                    className={`rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedService === "primary"
                      ? "border-[#0d7857] bg-emerald-50 text-[#0d7857]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    General Outpatient
                  </button>
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Patient Urgency Level
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUrgency("emergency")}
                    className={`flex-1 rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedUrgency === "emergency"
                      ? "border-rose-500 bg-rose-50 text-rose-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    🔴 Emergency (&lt;15m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUrgency("urgent")}
                    className={`flex-1 rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedUrgency === "urgent"
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    🟡 Urgent (&lt;1 hr)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUrgency("routine")}
                    className={`flex-1 rounded-xl border p-2 text-xs font-semibold text-center transition cursor-pointer ${selectedUrgency === "routine"
                      ? "border-emerald-500 bg-emerald-50 text-[#0d7857]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    🟢 Routine
                  </button>
                </div>
              </div>

              {/* Instant Dynamic Match Result */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0d7857]">
                    Best Match for {selectedLocation}
                  </span>
                  <span className="rounded-full bg-[#0d7857] px-2 py-0.5 text-[10px] font-bold text-white">
                    98% Match
                  </span>
                </div>

                <div className="mt-2 flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src="/images/hospital_brhmc.jpg"
                      alt="BRHMC"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {selectedService === "primary"
                        ? "RHU Daraga / Albay Outpatient Center"
                        : "Bicol Regional Hospital and Medical Center (BRHMC)"}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {selectedService === "primary" ? "12 min (4.1 km)" : "18 min (7.2 km)"} · Accepting Patients · Live OR Status: Available
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href="https://maps.google.com/?q=Bicol+Regional+Hospital+and+Medical+Center+Legazpi+City"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-[#0d7857] hover:bg-[#0a6347] text-white text-xs font-semibold py-2 text-center transition"
                  >
                    Open in Google Maps
                  </Link>
                  <Link
                    href="/login"
                    className="flex-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 text-center transition"
                  >
                    Create Clinical Referral
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
