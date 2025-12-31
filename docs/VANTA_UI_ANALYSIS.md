# Vanta UI/UX Analysis for Lightsail MVP

> Comprehensive analysis of Vanta's interface patterns, components, and user flows to guide Lightsail's MVP development.

---

## Table of Contents
1. [Design System Overview](#1-design-system-overview)
2. [Navigation & Information Architecture](#2-navigation--information-architecture)
3. [Core UI Components](#3-core-ui-components)
4. [Page Layouts & Patterns](#4-page-layouts--patterns)
5. [Key User Flows](#5-key-user-flows)
6. [Component Mapping to shadcn/ui](#6-component-mapping-to-shadcnui)
7. [Tailwind Implementation Guide](#7-tailwind-implementation-guide)
8. [Differentiation Opportunities](#8-differentiation-opportunities-for-lightsail)
9. [MVP Priority Components](#9-mvp-priority-components)

---

## 1. Design System Overview

### Color Palette

| Usage | Color | Tailwind Equivalent |
|-------|-------|---------------------|
| **Primary/Brand** | Deep Purple (#5E2CA5) | `violet-700` or custom |
| **Primary Hover** | Darker Purple (#4A1D8C) | `violet-800` |
| **Secondary** | Light Purple/Lavender (#F3E8FF) | `violet-100` |
| **Success** | Green (#22C55E) | `green-500` |
| **Warning** | Yellow/Amber (#F59E0B) | `amber-500` |
| **Error/Danger** | Red (#EF4444) | `red-500` |
| **Background** | White (#FFFFFF) | `white` |
| **Surface** | Light Gray (#F9FAFB) | `gray-50` |
| **Border** | Light Gray (#E5E7EB) | `gray-200` |
| **Text Primary** | Near Black (#111827) | `gray-900` |
| **Text Secondary** | Medium Gray (#6B7280) | `gray-500` |
| **Text Muted** | Light Gray (#9CA3AF) | `gray-400` |

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **Page Title** | 24px (text-2xl) | Semibold (600) | 1.2 |
| **Section Header** | 18px (text-lg) | Semibold (600) | 1.3 |
| **Card Title** | 16px (text-base) | Medium (500) | 1.4 |
| **Body Text** | 14px (text-sm) | Regular (400) | 1.5 |
| **Small/Caption** | 12px (text-xs) | Regular (400) | 1.4 |
| **Metric Numbers** | 32-48px (text-3xl to text-5xl) | Semibold (600) | 1.1 |

### Spacing System

| Usage | Value | Tailwind |
|-------|-------|----------|
| **Inline spacing** | 4px | `gap-1`, `space-x-1` |
| **Tight spacing** | 8px | `gap-2`, `p-2` |
| **Default spacing** | 12px | `gap-3`, `p-3` |
| **Comfortable** | 16px | `gap-4`, `p-4` |
| **Loose** | 24px | `gap-6`, `p-6` |
| **Section spacing** | 32px | `gap-8`, `py-8` |

### Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| **Buttons** | 6px | `rounded-md` |
| **Cards** | 8px | `rounded-lg` |
| **Modals** | 12px | `rounded-xl` |
| **Pills/Tags** | 9999px | `rounded-full` |
| **Inputs** | 6px | `rounded-md` |

---

## 2. Navigation & Information Architecture

### Sidebar Navigation Structure

```
┌─────────────────────────────────────────┐
│ [Logo]                          [⌘+K]  │
├─────────────────────────────────────────┤
│ 🏠 Home                                 │
│ ✓ Tests                                 │
│ 📊 Reports                              │
├─────────────────────────────────────────┤
│ COMPLIANCE ▼                            │
│   ├─ Frameworks                         │
│   ├─ Controls            [NEW]          │
│   ├─ Policies                           │
│   └─ Documents                          │
├─────────────────────────────────────────┤
│ TRUST ▼                                 │
│   ├─ Trust Report                       │
│   └─ Questionnaires      [NEW]          │
├─────────────────────────────────────────┤
│ RISK ▼                                  │
│   ├─ Risk management                    │
│   ├─ Access              [Try free]     │
│   ├─ Vendors                            │
│   └─ Vulnerabilities                    │
├─────────────────────────────────────────┤
│ ORGANIZATION ▼                          │
│   ├─ People                             │
│   ├─ Computers                          │
│   └─ Inventory                          │
├─────────────────────────────────────────┤
│ ⚙️ Integrations                         │
│ ⚙️ Settings                             │
│ 📦 Product updates                      │
└─────────────────────────────────────────┘
```

### Key Navigation Patterns

1. **Collapsible Sidebar**: Toggle with `←|` icon at bottom
2. **Command Palette**: `⌘+K` for quick search/navigation
3. **Breadcrumbs**: Used in detail views (e.g., "TRUST REPORT > CONTROLS")
4. **Section Grouping**: Related items grouped under expandable headers
5. **Badge Indicators**: "NEW", "Try free" badges for feature discovery
6. **Progress Indicator**: "Finish Starter Guide" with completion count

### Header Patterns

```
┌────────────────────────────────────────────────────────────┐
│ Page Title                              [Action Button]    │
│ Subtitle/description text                                  │
│                                                            │
│ [Tab 1] [Tab 2] [Tab 3]                                   │
│ ─────────────────────────────────────────                  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Core UI Components

### 3.1 Monitoring Cards (Dashboard)

**Pattern**: Summary cards showing health status of different areas

```
┌─────────────────────────────────┐
│ 📋 Policies                   > │
│                                 │
│ Needs attention ⓘ              │
│ 0                               │
│ ████████████████████            │
│ 15 OK                   15 total│
└─────────────────────────────────┘
```

**Key Elements**:
- Icon + Title + Arrow indicator (clickable)
- "Needs attention" count with info tooltip
- Large metric number
- Progress bar (green = OK, purple/red = needs attention)
- Footer with OK count and total

### 3.2 Compliance Progress Card

```
┌─────────────────────────────────┐
│ SOC 2                         > │
│ 99%                             │
│ ████████████████████░           │
│ 103 controls complete   104 total│
└─────────────────────────────────┘
```

### 3.3 Framework Selection Cards

```
┌─────────────────────────────────┐
│ ┌─────┐                         │
│ │ ISO │  ISO 27001:2013         │
│ └─────┘                         │
│         Global benchmark to     │
│         demonstrate an elective │
│         Information Security... │
│                                 │
│ ⚫ 44%      [Schedule a call]   │
└─────────────────────────────────┘
```

**States**:
- Active/Selected: Purple border, "View requirements" link
- Available: Gray border, percentage + CTA button
- Highlighted: Subtle purple background

### 3.4 Data Tables

**Standard Table Pattern**:
```
┌──────────────────────────────────────────────────────────────┐
│ [Search]  [Filter ▼] [Filter ▼] [Filter ▼]  [Column Config] │
├──────────────────────────────────────────────────────────────┤
│ □  Name          Category    Owner      Status    Due date   │
├──────────────────────────────────────────────────────────────┤
│ □  Document 1    Policy      👤 John    ● Active  Oct 8      │
│ □  Document 2    HR          👤 Jane    ⚠ Due     Sep 2      │
└──────────────────────────────────────────────────────────────┘
│ 1 to 10 of 39 results            Show per page [20 ▼] < > │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Checkbox selection (bulk actions)
- Sortable columns
- Filter dropdowns with clear option
- Status badges with color coding
- Pagination with page size selector

### 3.5 Status Badges

| Status | Color | Tailwind Classes |
|--------|-------|------------------|
| OK/Active | Green bg, dark text | `bg-green-100 text-green-800` |
| Needs attention | Yellow bg | `bg-amber-100 text-amber-800` |
| Overdue | Red bg | `bg-red-100 text-red-800` |
| Due soon | Orange dot + text | `text-orange-600` |
| Not shown in report | Gray text | `text-gray-400` |
| Connected | Green dot | `bg-green-500 rounded-full` |

### 3.6 Modal/Dialog Pattern

```
┌─────────────────────────────────────────┐
│ [×]                                     │
│                                         │
│ Add task                                │
│                                         │
│ Risk scenario                           │
│ [Select a risk scenario          ▼]    │
│                                         │
│ Description                             │
│ [                                  ]    │
│                                         │
│ Note (Optional)                         │
│ [                                  ]    │
│                                         │
│ Due date                                │
│ [📅 Oct 16, 2023                   ]    │
│                                         │
│ Assign to                               │
│ [👤 Select                         ▼]   │
│                                         │
│              [Cancel] [Create task]     │
└─────────────────────────────────────────┘
```

### 3.7 Side Panel Pattern

Used for: Task panels, filters, detail views

```
┌──────────────────┬──────────────────────┐
│                  │ Open Tasks        [×]│
│   Main Content   ├──────────────────────┤
│                  │ Priority ▼           │
│                  │                      │
│                  │ ■ Items overdue      │
│                  │   1 document         │
│                  │   4 tests            │
│                  │                      │
│                  │ ■ Items due soon     │
│                  │   1 document         │
│                  │   2 tests            │
└──────────────────┴──────────────────────┘
```

### 3.8 Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│     You don't have any tasks            │
│                                         │
│     Tasks are things you want to do     │
│     to mitigate, transfer, or avoid     │
│     a risk scenario.                    │
│                                         │
└─────────────────────────────────────────┘
```

### 3.9 Alert/Warning Banner

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ 4 people found in your HR system could not be matched   │
│    to accounts in Vanta                                     │
│                                                             │
│    Either manually connect them to existing accounts...     │
│                                           [View HR data]    │
└─────────────────────────────────────────────────────────────┘
```

### 3.10 Integration Cards

```
┌─────────────────────────────────┐
│ [AWS Logo]                      │
│ Amazon Web Services             │
│ BUILT BY VANTA                  │
│                                 │
│ Access  Computers  Inventory    │
│ Vulnerabilities                 │
│                                 │
│ [View details]    [Connect]     │
└─────────────────────────────────┘
```

---

## 4. Page Layouts & Patterns

### 4.1 Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│ SIDEBAR │ Home                          [View tasks]       │
│         │                                                  │
│         │ Compliance progress      Last updated < 1 min    │
│         │ ┌────────────────────────────────────────────┐  │
│         │ │ SOC 2                                    > │  │
│         │ │ 99%  ████████████████████░                 │  │
│         │ │ 103 controls complete           104 total  │  │
│         │ └────────────────────────────────────────────┘  │
│         │                                                  │
│         │ Monitoring                                       │
│         │ ┌──────────────────┐ ┌──────────────────┐       │
│         │ │ Policies       > │ │ Tests          > │       │
│         │ │ 0 attention      │ │ 7 attention      │       │
│         │ └──────────────────┘ └──────────────────┘       │
│         │ ┌──────────────────┐ ┌──────────────────┐       │
│         │ │ Vendors        > │ │ Documents      > │       │
│         │ │ 0 attention      │ │ 2 attention      │       │
│         │ └──────────────────┘ └──────────────────┘       │
│         │                                                  │
│         │ Trust Center                                     │
│         │ ┌────────┐ ┌────────┐ ┌────────┐               │
│         │ │ Visits │ │ Views  │ │Downloads│               │
│         │ │ 8      │ │ 21     │ │ 0       │               │
│         │ └────────┘ └────────┘ └────────┘               │
└─────────┴──────────────────────────────────────────────────┘
```

### 4.2 List/Table Page Layout

```
┌────────────────────────────────────────────────────────────┐
│ SIDEBAR │ Documents: All              [Export] [Add doc]   │
│         │                                                  │
│ CATEGORY│ [Search]  Status▼  Category▼  Framework▼        │
│ All     │ Owner▼  Time Sensitivity▼    [Clear]            │
│ HR      │                                                  │
│ Policy  │ ┌──────────────────────────────────────────────┐│
│ Engin.. │ │ □ Name          Framework  Category   Status ││
│ Risks   │ ├──────────────────────────────────────────────┤│
│ Custom  │ │ □ Proof of...   SOC 2     HR         ⚠ Needs ││
│         │ │ □ Contractor..  SOC 2     HR         ⚠ Needs ││
│ DEACT.  │ │ □ Public ch...  SOC 2     Eng        ● Active││
│ All de..│ └──────────────────────────────────────────────┘│
│         │                                                  │
│         │ 1 to 10 of 39 results    [20 ▼]  [<] [>]        │
└─────────┴──────────────────────────────────────────────────┘
```

### 4.3 Detail Page Layout (Framework/Control)

```
┌────────────────────────────────────────────────────────────┐
│ SIDEBAR │ SOC 2                      [More▼] [Create ctrl] │
│         │ [Search]         Control status▼    Owner▼       │
│         │                                                  │
│ REQUIRE.│ Completion                      Audit timeline   │
│ CC 1.0  │ ┌────────────────────┐   ┌─────────────────────┐│
│ CC 2.0  │ │ 99%                │   │ ● Observation done  ││
│ CC 3.0  │ │ Test ✓  Doc ✓     │   │ 🎉 Congratulations! ││
│ CC 4.0  │ │ 103 ctrls  104 tot│   └─────────────────────┘│
│ CC 5.0  │ └────────────────────┘                          │
│ ...     │                                                  │
│         │ CC 1.0 Control Environment         [Add control] │
│         │ ┌──────────────────────────────────────────────┐│
│         │ │ CC 1.1 →                                     ││
│         │ │ CONTROL           EVIDENCE    OWNER          ││
│         │ └──────────────────────────────────────────────┘│
└─────────┴──────────────────────────────────────────────────┘
```

### 4.4 Wizard/Multi-Step Layout (Integration Setup)

```
┌────────────────────────────────────────────────────────────┐
│ [×] Connect AWS ●                           [Help Center]  │
│                                                            │
│ STEPS          │ Select products                           │
│ ● Select prod. │ Select the products used within your org  │
│ ○ AWS accounts │                                           │
│ ○ Policy creat.│ What products should I integrate...?      │
│ ○ Role creation│ ┌────────────────────────────────────────┐│
│ ○ Mgmt account │ │ Vanta supports scanning for:          ││
│ ○ Policy creat.│ │ • Amazon Web Services                  ││
│ ○ Role creation│ │ • AWS CodeCommit                       ││
│ ○ Role ARN     │ │ • AWS IAM Identity Center              ││
│ ○ Region selec.│ └────────────────────────────────────────┘│
│ ○ Config scope │                                           │
│                │ □ Amazon Web Services ⓘ                   │
│                │   Enable if you use AWS as cloud provider │
│                │                                           │
│                │ □ AWS CodeCommit ⓘ                        │
│                │                                           │
│                │                    [Back] [Next →]        │
└────────────────┴───────────────────────────────────────────┘
```

### 4.5 Policy Editor Layout

```
┌────────────────────────────────────────────────────────────┐
│ [×] Code of Conduct           [SOC 2]           [More ▼]   │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Draft                        [Submit for approval] [...] ││
│ │                                                         ││
│ │ [Policy editor]                                         ││
│ │ ┌─────────────────────────────────────────────────────┐││
│ │ │ [B] [I] [U] [S] [H1] [H2] [•] [1.] [—] [<>]        │││
│ │ ├─────────────────────────────────────────────────────┤││
│ │ │ English                                             │││
│ │ │ Last edited by Jane Smith • Oct 9 2023    [Edit]   │││
│ │ │                                                     │││
│ │ │ + Add another language                              │││
│ │ └─────────────────────────────────────────────────────┘││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ▼ Details                                                  │
│   Description: Develops and maintains a standard...        │
│   Time sensitivity: Renew annually                         │
│   Notes: Add additional context...                         │
│                                                            │
│ ▼ Related frameworks and controls                          │
│   FRAMEWORK    SECTION CODE    CONTROL           OWNER     │
│   SOC 2        CC 1.1          Code of Conduct   Unassigned│
└────────────────────────────────────────────────────────────┘
```

### 4.6 Onboarding/Wizard Layout (Full Page)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│ ● ● ● ● ●                          ┌──────────────────────┐│
│                                    │    [Illustration]    ││
│ Welcome to Vanta!                  │                      ││
│                                    │    Vanta Demo        ││
│ Your team uses Vanta to build      │                      ││
│ trust, streamline compliance...    │    [Video Player]    ││
│                                    │                      ││
│ Watch our short video demo...      └──────────────────────┘│
│                                                            │
│ [Continue]                                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Key User Flows

### 5.1 Onboarding Flow

```
1. Welcome Screen (Video demo)
   ↓
2. Role Selection ("What best describes your role?")
   - Engineering / Security / Compliance / Executive / Other
   ↓
3. Audit Experience ("Have you done an audit before?")
   - No, I'm new / Yes, I'm familiar
   ↓
4. Company Information
   - Legal name, Display name, Logo upload
   ↓
5. Framework Selection
   - SOC 2, ISO 27001, HIPAA, GDPR, etc.
   ↓
6. Integration Connections (Key systems)
   ↓
7. Dashboard with Starter Guide
```

### 5.2 Starter Guide Flow

```
┌─────────────────────────────────────────┐
│ Starter Guide Progress         4 of 4   │
├─────────────────────────────────────────┤
│ ✓ Intro to Vanta           1 of 1 ✓    │
│ ✓ Connect your key systems  4 of 4 ✓    │
│ ◐ Launch policies          1 of 4       │
│   □ Verify company name/logo            │
│   □ Draft Code of Conduct   [Go to]     │
│   □ Draft Information Security Policy   │
│   □ Draft Asset Management Policy       │
│   □ Draft remaining policies            │
│ ○ Select auditor                        │
└─────────────────────────────────────────┘
```

### 5.3 Policy Creation Flow

```
1. Select Policy Template
   ↓
2. Choose Creation Method:
   - Use policy editor (start with template)
   - Upload file (.pdf, .docx)
   - Sync from Confluence/Google Drive/SharePoint
   ↓
3. Select Language(s)
   ↓
4. Edit in Rich Text Editor
   ↓
5. Add Details (description, time sensitivity)
   ↓
6. Link to Frameworks/Controls
   ↓
7. Submit for Approval
   ↓
8. Approver Reviews & Approves
```

### 5.4 Integration Connection Flow

```
1. Browse Available Integrations (categorized)
   ↓
2. Select Integration (e.g., AWS)
   ↓
3. Multi-step Wizard:
   a. Select products to integrate
   b. Configure accounts
   c. Create IAM policy
   d. Create IAM role
   e. Provide ARN
   f. Select regions
   g. Configure scope
   ↓
4. Test Connection
   ↓
5. Initial Sync
   ↓
6. View Integration Status on Dashboard
```

### 5.5 Control Review Flow

```
1. Dashboard shows "Needs Attention" count
   ↓
2. Click to view Controls list
   ↓
3. Filter by Status (Not shown in report)
   ↓
4. Click Control to view detail
   ↓
5. Review requirements:
   - Evidence needed
   - Test results
   - Framework mappings
   ↓
6. Add Evidence or Create Task
   ↓
7. Mark as Reviewed
```

---

## 6. Component Mapping to shadcn/ui

| Vanta Component | shadcn/ui Equivalent | Notes |
|-----------------|---------------------|-------|
| **Sidebar Navigation** | Custom + `NavigationMenu` | Build custom collapsible sidebar |
| **Command Palette (⌘K)** | `Command` | Direct mapping |
| **Buttons** | `Button` | Add purple variant |
| **Cards** | `Card` | Already have base |
| **Data Tables** | `Table` + `DataTable` | Add sorting, filtering |
| **Modals** | `Dialog` | Direct mapping |
| **Side Panels** | `Sheet` | Right-side panels |
| **Dropdowns** | `DropdownMenu` | Filter menus |
| **Select** | `Select` | Form selects |
| **Tabs** | `Tabs` | Page section tabs |
| **Progress Bar** | `Progress` | Compliance progress |
| **Badge** | `Badge` | Status indicators |
| **Tooltip** | `Tooltip` | Info icons |
| **Alert** | `Alert` | Warning banners |
| **Form Inputs** | `Input`, `Textarea` | Standard forms |
| **Date Picker** | `Calendar` + `Popover` | Due dates |
| **Checkbox** | `Checkbox` | Table selection |
| **Avatar** | `Avatar` | User avatars |
| **Breadcrumb** | `Breadcrumb` | Navigation path |
| **Skeleton** | `Skeleton` | Loading states |
| **Toast** | `Toast` / `Sonner` | Notifications |

### Components to Build Custom

1. **Monitoring Card** - Dashboard summary cards with progress
2. **Framework Card** - Selection cards with percentage
3. **Integration Card** - Logo + capabilities + connect button
4. **Compliance Progress** - Large percentage + bar
5. **Collapsible Sidebar** - Custom navigation component
6. **Starter Guide** - Checklist with progress tracking
7. **Status Badge** - Color-coded status indicators
8. **Filter Bar** - Multiple dropdown filters with clear

---

## 7. Tailwind Implementation Guide

### Custom Theme Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Primary purple palette (Vanta-inspired)
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed', // Main brand
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Status colors
        success: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#166534',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#92400e',
        },
        danger: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#991b1b',
        },
      },
      // Sidebar width
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '64px',
      },
    },
  },
}
```

### Common Component Classes

```css
/* Monitoring Card */
.monitoring-card {
  @apply bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors cursor-pointer;
}

/* Status Badge */
.badge-success { @apply bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-warning { @apply bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-danger { @apply bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-neutral { @apply bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium; }

/* Progress Bar */
.progress-bar {
  @apply h-2 bg-gray-200 rounded-full overflow-hidden;
}
.progress-bar-fill {
  @apply h-full bg-green-500 transition-all duration-300;
}

/* Sidebar Navigation Item */
.nav-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors;
}
.nav-item-active {
  @apply bg-primary-100 text-primary-700 font-medium;
}

/* Table Row */
.table-row {
  @apply border-b border-gray-100 hover:bg-gray-50 transition-colors;
}

/* Filter Dropdown */
.filter-btn {
  @apply inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50;
}
.filter-btn-active {
  @apply border-primary-300 bg-primary-50 text-primary-700;
}
```

---

## 8. Differentiation Opportunities for Lightsail

### 8.1 Simplification Opportunities

| Vanta Complexity | Lightsail Simplification |
|------------------|-------------------------|
| Many framework options | Focus on SOC 2 + ISO 27001 first |
| Complex wizard flows | Streamlined 3-step setup |
| Dense sidebar navigation | Cleaner, flatter nav structure |
| Separate Tests/Controls | Unified "Compliance Status" view |
| Multiple Risk sections | Single "Risk Overview" |

### 8.2 SMB-Focused Improvements

1. **Guided Setup**: More hand-holding for first-time compliance
2. **Plain Language**: Less jargon, more explanations
3. **Quick Wins**: Highlight easy tasks to build momentum
4. **Templates**: More pre-built policies for common industries
5. **Pricing Transparency**: Show value, not complexity

### 8.3 Regional Differentiation (Nigeria/UK Focus)

1. **NDPR/NDPA Templates**: Pre-built for Nigerian compliance
2. **Local Integrations**: Support for regional cloud providers
3. **Currency Display**: ₦ / £ pricing throughout
4. **Time Zones**: Proper date/time localization
5. **Support Hours**: Regional business hours

### 8.4 UI/UX Improvements to Consider

1. **Dashboard Personalization**: Role-based default views
2. **Progress Gamification**: Achievements, streaks for compliance tasks
3. **AI Assistant**: Chat-based help for compliance questions
4. **Mobile-First**: Better responsive design than Vanta
5. **Offline Support**: Policy viewing offline
6. **Bulk Actions**: More batch operations for efficiency
7. **Keyboard Navigation**: Full keyboard accessibility
8. **Dark Mode**: First-class dark theme (Vanta lacks this)

---

## 9. MVP Priority Components

### Phase 1: Core Shell (Week 1-2)

1. **App Shell**
   - Collapsible sidebar navigation
   - Header with user menu
   - Command palette (⌘K)
   - Page layout container

2. **Authentication**
   - Login/Signup pages
   - Organization selector
   - Role-based routing

3. **Dashboard**
   - Compliance progress card
   - Monitoring cards (4-grid)
   - Quick actions

### Phase 2: Compliance Core (Week 3-4)

4. **Frameworks Page**
   - Framework selection cards
   - Progress indicators
   - Enable/disable frameworks

5. **Controls List**
   - Data table with filters
   - Status badges
   - Bulk selection

6. **Control Detail**
   - Requirements view
   - Evidence linking
   - Owner assignment

### Phase 3: Evidence & Policies (Week 5-6)

7. **Documents/Evidence List**
   - File upload
   - Category filtering
   - Due date tracking

8. **Policy Editor**
   - Rich text editor
   - Version history
   - Approval workflow

9. **Policy Templates**
   - Template selection
   - AI-assisted generation
   - Multi-language support

### Phase 4: Integrations (Week 7-8)

10. **Integrations Catalog**
    - Available integrations grid
    - Connected integrations list
    - Category filtering

11. **Integration Setup Wizard**
    - Multi-step form
    - Credential input
    - Connection testing

### Phase 5: Polish & Launch (Week 9-10)

12. **Onboarding Flow**
    - Welcome wizard
    - Starter guide
    - First-time tutorials

13. **Settings**
    - Organization settings
    - User management
    - Notification preferences

14. **Reports**
    - Compliance reports
    - Export functionality
    - Audit-ready views

---

## Appendix: Key Measurements

### Sidebar Dimensions
- Full width: 240px
- Collapsed width: 64px
- Icon size: 20px
- Item padding: 12px horizontal, 8px vertical

### Card Dimensions
- Dashboard card min-width: 280px
- Framework card width: 300px
- Card padding: 16px (p-4)
- Card gap: 16px (gap-4)

### Table Dimensions
- Row height: 52px
- Header height: 44px
- Checkbox column: 48px
- Action column: 80px

### Modal Dimensions
- Small: 400px max-width
- Medium: 560px max-width
- Large: 720px max-width
- Side panel: 400px width

---

*This analysis is based on Vanta's web interface as captured in Mobbin screenshots. Patterns should be adapted to fit Lightsail's brand, target market, and technical stack.*
