# CareRoute Bicol — Design System

## Brand Identity

CareRoute Bicol uses a clean, minimalist, green-and-white medical interface.

## Color Palette

### Global Application Colors
- **Primary Green:** `#15803D` (used for global nav, logo, primary buttons)
- **Primary Green Light:** `#DCFCE7`
- **Primary Green Dark:** `#166534`
- **Background:** `#FFFFFF`
- **Surface / Cards:** `#FFFFFF` with `1px solid #E5E7EB` border
- **Text Primary:** `#111827`
- **Text Secondary:** `#6B7280`
- **Text Muted:** `#9CA3AF`
- **Border:** `#E5E7EB`
- **Border Light:** `#F3F4F6`
- **Error / Destructive:** `#DC2626`
- **Warning:** `#F59E0B`
- **Success:** `#16A34A`
- **Info:** `#2563EB`

### Facility Dashboard Accent Colors
These colors are ONLY applied to the operational dashboard's accent elements (stats highlights, active nav indicator, type badges, chart colors). They do NOT change the global layout, backgrounds, cards, or shared components.

| Facility Type | Primary | Light | Dark |
|---|---|---|---|
| BHS | `#15803D` | `#DCFCE7` | `#166534` |
| RHU | `#2563EB` | `#DBEAFE` | `#1D4ED8` |
| Tertiary | `#9333EA` | `#F3E8FF` | `#7E22CE` |

## Typography
- **Font Family:** Geist Sans (already configured via `next/font/google`)
- **Font Mono:** Geist Mono (for code, IDs, timestamps)
- **Heading Sizes:**
  - Page Title: `text-2xl font-semibold` (1.5rem)
  - Section Title: `text-lg font-medium` (1.125rem)
  - Card Title: `text-base font-medium` (1rem)
  - Label: `text-sm font-medium` (0.875rem)
- **Body:** `text-sm` (0.875rem), `text-foreground`
- **Caption:** `text-xs` (0.75rem), `text-muted-foreground`

## Spacing
- **Page padding:** `p-6` (1.5rem)
- **Card padding:** `p-4` or `p-6`
- **Section gap:** `gap-6`
- **Element gap:** `gap-4`
- **Tight gap:** `gap-2`

## Components

### Buttons
- **Primary:** `bg-primary text-primary-foreground` with green theme
- **Secondary:** `bg-secondary text-secondary-foreground`
- **Destructive:** `bg-destructive text-white`
- **Outline:** `border border-input bg-background hover:bg-accent`
- **Ghost:** `hover:bg-accent hover:text-accent-foreground`
- **Size:** Default `h-9 px-4`, Small `h-8 px-3 text-xs`, Large `h-10 px-6`

### Cards
- White background, `border border-border`, `rounded-lg`
- `shadow-sm` for elevation
- Consistent `p-4` or `p-6` internal padding

### Tables
- Use shadcn `Table` component
- Alternating row backgrounds are optional
- Header: `text-muted-foreground font-medium text-xs uppercase`
- Cell padding: `px-4 py-3`

### Forms
- Use shadcn `Input`, `Select`, `Textarea`, `Label` components
- Group related fields with `gap-4`
- Always show validation errors inline below the field
- Required fields marked with `*`

### Status Badges
- `PENDING`: Yellow background `bg-yellow-100 text-yellow-800`
- `ACKNOWLEDGED`: Blue background `bg-blue-100 text-blue-800`
- `ACCEPTED`: Green background `bg-green-100 text-green-800`
- `IN_PROGRESS`: Indigo background `bg-indigo-100 text-indigo-800`
- `COMPLETED`: Emerald background `bg-emerald-100 text-emerald-800`
- `DECLINED`: Red background `bg-red-100 text-red-800`
- `REDIRECTED`: Purple background `bg-purple-100 text-purple-800`
- `CANCELLED`: Gray background `bg-gray-100 text-gray-800`

### Urgency Badges
- `ROUTINE`: Gray `bg-gray-100 text-gray-700`
- `URGENT`: Orange `bg-orange-100 text-orange-700`
- `EMERGENCY`: Red `bg-red-100 text-red-700`

## Layout

### Sidebar
- Fixed width: `w-64` (16rem) on desktop
- Collapsible on mobile (sheet/drawer)
- White background with subtle right border
- Active item: facility accent color background with matching text
- Inactive item: `text-muted-foreground hover:bg-accent`

### Dashboard Grid
- Stats: 4-column grid on desktop, 2-column on tablet, 1-column on mobile
- Content: Flexible grid with `gap-6`

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px – 1024px`
- Desktop: `> 1024px`

## Interaction States
- **Loading:** Use `Skeleton` component for data placeholders
- **Empty:** Centered illustration with message and CTA
- **Error:** Toast notification + inline error message
- **Success:** Toast notification with green accent
- **Hover:** Subtle background change `bg-accent`
- **Focus:** Ring outline using `ring-ring`

## Accessibility
- All interactive elements must be keyboard-navigable
- Color is never the sole indicator of state
- Minimum contrast ratio: 4.5:1 for text
- Form inputs must have associated labels
