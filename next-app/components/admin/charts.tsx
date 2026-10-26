"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ─── Color Constants ─────────────────────────────────────────────────────────

const STATUS_CHART_COLORS: Record<string, string> = {
  PENDING: "#EAB308",
  ACKNOWLEDGED: "#3B82F6",
  ACCEPTED: "#22C55E",
  IN_PROGRESS: "#6366F1",
  COMPLETED: "#10B981",
  DECLINED: "#EF4444",
  REDIRECTED: "#A855F7",
  CANCELLED: "#6B7280",
}

const URGENCY_CHART_COLORS: Record<string, string> = {
  ROUTINE: "#6B7280",
  URGENT: "#F97316",
  EMERGENCY: "#EF4444",
}

const FACILITY_TYPE_COLORS: Record<string, string> = {
  BHS: "#15803D",
  RHU: "#2563EB",
  SECONDARY: "#0D9488",
  TERTIARY: "#9333EA",
}

// ─── Referral Status Distribution (Donut Chart) ──────────────────────────────

interface ReferralStatusChartProps {
  data: { status: string; count: number }[]
}

const statusChartConfig: ChartConfig = {
  count: { label: "Referrals" },
  PENDING: { label: "Pending", color: STATUS_CHART_COLORS.PENDING },
  ACKNOWLEDGED: { label: "Acknowledged", color: STATUS_CHART_COLORS.ACKNOWLEDGED },
  ACCEPTED: { label: "Accepted", color: STATUS_CHART_COLORS.ACCEPTED },
  IN_PROGRESS: { label: "In Progress", color: STATUS_CHART_COLORS.IN_PROGRESS },
  COMPLETED: { label: "Completed", color: STATUS_CHART_COLORS.COMPLETED },
  DECLINED: { label: "Declined", color: STATUS_CHART_COLORS.DECLINED },
  REDIRECTED: { label: "Redirected", color: STATUS_CHART_COLORS.REDIRECTED },
  CANCELLED: { label: "Cancelled", color: STATUS_CHART_COLORS.CANCELLED },
}

export function ReferralStatusChart({ data }: ReferralStatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fill: STATUS_CHART_COLORS[d.status] ?? "#6B7280",
  }))

  return (
    <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="status" />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={50}
          strokeWidth={2}
          stroke="#fff"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          className="-translate-y-2 flex-wrap gap-2 text-xs"
        />
      </PieChart>
    </ChartContainer>
  )
}

// ─── Urgency Distribution (Donut Chart) ──────────────────────────────────────

interface UrgencyChartProps {
  data: { urgency: string; count: number }[]
}

const urgencyChartConfig: ChartConfig = {
  count: { label: "Referrals" },
  ROUTINE: { label: "Routine", color: URGENCY_CHART_COLORS.ROUTINE },
  URGENT: { label: "Urgent", color: URGENCY_CHART_COLORS.URGENT },
  EMERGENCY: { label: "Emergency", color: URGENCY_CHART_COLORS.EMERGENCY },
}

export function UrgencyDistributionChart({ data }: UrgencyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    fill: URGENCY_CHART_COLORS[d.urgency] ?? "#6B7280",
  }))

  return (
    <ChartContainer config={urgencyChartConfig} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="urgency" />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="urgency"
          innerRadius={50}
          strokeWidth={2}
          stroke="#fff"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="urgency" />}
          className="-translate-y-2 flex-wrap gap-2 text-xs"
        />
      </PieChart>
    </ChartContainer>
  )
}

// ─── Facility Type Distribution (Bar Chart) ──────────────────────────────────

interface FacilityTypeChartProps {
  data: {
    facilityType: string
    label: string
    incoming: number
    outgoing: number
  }[]
}

const facilityTypeChartConfig: ChartConfig = {
  incoming: { label: "Incoming", color: "#0D9488" },
  outgoing: { label: "Outgoing", color: "#6366F1" },
}

export function FacilityTypeChart({ data }: FacilityTypeChartProps) {
  return (
    <ChartContainer config={facilityTypeChartConfig} className="max-h-[280px] w-full">
      <BarChart data={data} barGap={4} barCategoryGap="20%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="incoming"
          fill="var(--color-incoming)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="outgoing"
          fill="var(--color-outgoing)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

// ─── Monthly Trends (Area Chart) ─────────────────────────────────────────────

interface MonthlyTrendsChartProps {
  data: { month: string; count: number }[]
}

const monthlyTrendsConfig: ChartConfig = {
  count: { label: "Referrals", color: "#0D7857" },
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  return (
    <ChartContainer config={monthlyTrendsConfig} className="max-h-[280px] w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0D7857" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0D7857" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#0D7857"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCount)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
