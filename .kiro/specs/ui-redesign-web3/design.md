# Design Document: UI Redesign Web3

## Overview

This design document specifies the technical approach for redesigning the entire Crypto Portfolio Tracker UI to follow a consistent, clean, modern Web3 design system. The redesign will transform all pages and components from the current gray-based theme to a cohesive black/zinc aesthetic with Courier Prime monospace typography, matching the existing Integrated page design.

### Design Goals

- Establish a unified Web3-inspired visual language across all pages
- Create a reusable design system with consistent tokens and patterns
- Maintain existing functionality while upgrading visual presentation
- Ensure responsive behavior across all device sizes
- Improve user experience through consistent interaction patterns

### Scope

The redesign covers:
- 6 pages: Dashboard, Portfolio, Wallet, History, Login, Register (Integrated already complete)
- 7 shared components: PriceCard, PortfolioSummary, PortfolioTable, AddAssetForm, PriceChart, GrandTotalCard, SourceAllocationCards
- Global styles and design tokens
- Header navigation component (embedded in pages)

## Architecture

### Design System Structure

The design system follows a token-based architecture with three layers:

1. **Foundation Layer**: Core design tokens (colors, typography, spacing)
2. **Component Layer**: Reusable UI components with consistent styling
3. **Page Layer**: Composed layouts using foundation and component layers

```
┌─────────────────────────────────────────┐
│           Page Layer                    │
│  (Dashboard, Portfolio, Wallet, etc.)   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Component Layer                 │
│  (PriceCard, PortfolioTable, etc.)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Foundation Layer                 │
│  (Colors, Typography, Spacing)          │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Styling**: Tailwind CSS with custom design tokens
- **Typography**: Courier Prime monospace font (Google Fonts)
- **Framework**: Next.js 14+ with App Router
- **Component Pattern**: React functional components with TypeScript

## Components and Interfaces

### Foundation: Design Tokens

#### Color Palette

```typescript
// Primary Colors
const colors = {
  background: {
    primary: '#0a0a0a',      // Black background
    card: '#18181b',         // zinc-900
    input: '#0a0a0a',        // Black for inputs
  },
  border: {
    default: '#27272a',      // zinc-800
    focus: '#2563eb',        // blue-500
  },
  text: {
    primary: '#ffffff',      // White
    secondary: '#71717a',    // zinc-500
    tertiary: '#52525b',     // zinc-600
  },
  accent: {
    primary: '#2563eb',      // blue-600
    primaryHover: '#1d4ed8', // blue-700
    positive: '#34d399',     // emerald-400
    negative: '#f87171',     // red-400
  },
  status: {
    error: {
      bg: '#450a0a',         // red-950
      border: '#991b1b',     // red-800
      text: '#f87171',       // red-400
    },
    success: {
      bg: '#022c22',         // green-950
      border: '#166534',     // green-800
      text: '#34d399',       // green-400
    },
  },
};
```

#### Typography System

```typescript
const typography = {
  fontFamily: {
    primary: 'Courier Prime, Courier New, monospace',
    mono: 'Courier Prime, Courier New, monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 700,
  },
  letterSpacing: {
    wider: '0.05em',    // For uppercase labels
  },
};
```

#### Spacing System

```typescript
const spacing = {
  card: {
    padding: '1.5rem',        // p-6
    gap: '1.5rem',            // gap-6
  },
  section: {
    vertical: '1.5rem',       // space-y-6
    horizontal: '1rem',       // gap-4
  },
  container: {
    padding: {
      mobile: '1rem',         // px-4
      tablet: '1.5rem',       // sm:px-6
      desktop: '2rem',        // lg:px-8
    },
  },
};
```

#### Border Radius

```typescript
const borderRadius = {
  sm: '0.375rem',     // rounded-md (6px)
  md: '0.5rem',       // rounded-lg (8px)
  lg: '0.75rem',      // rounded-xl (12px)
  full: '9999px',     // rounded-full
};
```

### Component Specifications

#### 1. PriceCard Component

**Purpose**: Display cryptocurrency price information with market stats

**Interface**:
```typescript
interface PriceCardProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    total_volume: number;
  };
}
```

**Design Specifications**:
- Background: zinc-900 with zinc-800 border
- Border radius: rounded-xl
- Padding: p-6
- Hover effect: card-glow (blue shadow)
- Typography: Courier Prime, uppercase labels with tracking-wider
- Color coding: emerald-400 for positive changes, red-400 for negative

**Layout Structure**:
```
┌─────────────────────────────────┐
│ [Logo] Name                     │
│        Symbol (uppercase)       │
│                                 │
│ $XX,XXX.XX (large, bold)        │
│                                 │
│ [▲ +X.XX% 24h] (badge)          │
│                                 │
│ ─────────────────────────────── │
│ Market Cap:        $XXX.XXB     │
│ Volume (24h):      $XXX.XXM     │
└─────────────────────────────────┘
```

#### 2. PortfolioSummary Component

**Purpose**: Display portfolio metrics summary

**Interface**:
```typescript
interface PortfolioSummaryProps {
  summary: {
    totalInvested: number;
    totalCurrentValue: number;
    totalPnL: number;
    totalPnLPercentage: number;
  };
}
```

**Design Specifications**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Card background: zinc-900 with zinc-800 border
- Border radius: rounded-xl
- Padding: p-6
- Gap: gap-4
- Hover effect: card-glow
- PnL cards: emerald-400 for positive, red-400 for negative

**Layout Structure**:
```
┌──────────┬──────────┬──────────┬──────────┐
│ TOTAL    │ CURRENT  │ TOTAL    │ PNL      │
│ INVESTED │ VALUE    │ PNL      │ %        │
│          │          │          │          │
│ $XX,XXX  │ $XX,XXX  │ +$X,XXX  │ +XX.XX%  │
└──────────┴──────────┴──────────┴──────────┘
```

#### 3. PortfolioTable Component

**Purpose**: Display detailed asset holdings in tabular format

**Interface**:
```typescript
interface PortfolioTableProps {
  assets: PortfolioAsset[];
  currentPrices: Record<string, number>;
  onRemove?: (coinId: string) => void;
}
```

**Design Specifications**:
- Container: zinc-900 background with zinc-800 border
- Border radius: rounded-xl
- Hover effect: card-glow on container, zinc-700/50 on rows
- Headers: uppercase with tracking-wider, zinc-500 text
- Row dividers: zinc-800
- PnL values: emerald-400 for positive, red-400 for negative

**Column Structure**:
```
| Asset | Holdings | Avg Buy Price | Current Price | Total Value | PnL | Action |
```

#### 4. AddAssetForm Component

**Purpose**: Form for adding new assets to portfolio

**Interface**:
```typescript
interface AddAssetFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Design Specifications**:
- Container: zinc-900 background with zinc-800 border
- Border radius: rounded-xl
- Padding: p-6
- Hover effect: card-glow
- Input fields: black background with zinc-800 border
- Focus state: border-blue-500
- Search results: zinc-800 background with hover:bg-zinc-700
- Buttons: blue-600 primary, zinc-800 secondary

#### 5. PriceChart Component

**Purpose**: Display historical price data in chart format

**Interface**:
```typescript
interface PriceChartProps {
  coin: string;
  symbol: string;
  color: string;
}
```

**Design Specifications**:
- Container: zinc-900 background with zinc-800 border
- Border radius: rounded-xl
- Padding: p-6
- Hover effect: card-glow
- Chart styling:
  - Grid lines: zinc-500
  - Axis text: white
  - Axis labels: Courier Prime font
  - Tooltips: Courier Prime font

#### 6. Header Navigation Component

**Purpose**: Consistent navigation across all pages

**Design Specifications**:
- Background: zinc-900 with zinc-800 border-b
- Typography: Courier Prime, uppercase for app title
- Active link: white text with font-bold
- Inactive links: zinc-500 with hover:text-white
- Logout button: zinc-800 background with hover:bg-zinc-700
- Responsive: flex-col on mobile, flex-row on desktop

**Layout Structure**:
```
┌────────────────────────────────────────────────────┐
│ CRYPTO PORTFOLIO  [Nav Links]          [Logout]   │
└────────────────────────────────────────────────────┘
```

### Page Specifications

#### Dashboard Page

**Purpose**: Display live cryptocurrency prices

**Components Used**:
- Header Navigation
- PriceCard (grid of cards)
- Loading spinner
- Error message component

**Layout**:
```
┌─────────────────────────────────────────┐
│           Header Navigation             │
├─────────────────────────────────────────┤
│                                         │
│  Live Crypto Prices                     │
│  Last updated: XX:XX:XX    [Refresh]    │
│                                         │
│  ┌─────────┬─────────┬─────────┐       │
│  │ Bitcoin │Ethereum │ Tether  │       │
│  │ Card    │ Card    │ Card    │       │
│  └─────────┴─────────┴─────────┘       │
│                                         │
└─────────────────────────────────────────┘
```

#### Portfolio Page

**Purpose**: Manage and view portfolio assets

**Components Used**:
- Header Navigation
- PortfolioSummary
- PortfolioTable
- AddAssetForm (conditional)
- Loading spinner
- Error message component

**Layout**:
```
┌─────────────────────────────────────────┐
│           Header Navigation             │
├─────────────────────────────────────────┤
│                                         │
│  My Portfolio              [+ Add Asset]│
│  user@email.com                         │
│                                         │
│  [Portfolio Summary Cards]              │
│                                         │
│  [Portfolio Table]                      │
│                                         │
└─────────────────────────────────────────┘
```

#### Wallet Page

**Purpose**: Check blockchain wallet balances

**Components Used**:
- Header Navigation
- Input card for wallet address
- Balance result card
- Loading spinner
- Error message component

**Layout**:
```
┌─────────────────────────────────────────┐
│           Header Navigation             │
├─────────────────────────────────────────┤
│                                         │
│  Check Wallet Balance                   │
│  View on-chain ETH and USDT balances    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ETHEREUM WALLET ADDRESS           │ │
│  │ [0x...                          ] │ │
│  │ [Check Balance]                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Balance                           │ │
│  │ ETH: X.XXXX Ξ  USDT: $X,XXX      │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### History Page

**Purpose**: Display historical price charts

**Components Used**:
- Header Navigation
- PriceChart (multiple instances)
- Loading spinner

**Layout**:
```
┌─────────────────────────────────────────┐
│           Header Navigation             │
├─────────────────────────────────────────┤
│                                         │
│  Price History                          │
│  Historical price charts                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Bitcoin (BTC)                     │ │
│  │ [Chart]                           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Ethereum (ETH)                    │ │
│  │ [Chart]                           │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Login Page

**Purpose**: User authentication

**Components Used**:
- Login form card
- Input fields
- Submit button
- Error message component
- Link to register

**Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│              [Center]                   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ CRYPTO PORTFOLIO                  │ │
│  │ Login                             │ │
│  │                                   │ │
│  │ EMAIL                             │ │
│  │ [                               ] │ │
│  │                                   │ │
│  │ PASSWORD                          │ │
│  │ [                               ] │ │
│  │                                   │ │
│  │ [Login]                           │ │
│  │                                   │ │
│  │ Don't have an account? Register   │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### Register Page

**Purpose**: User account creation

**Components Used**:
- Registration form card
- Input fields
- Submit button
- Error message component
- Link to login

**Layout**: Similar to Login Page with additional fields

## Data Models

### Design Token Model

```typescript
interface DesignTokens {
  colors: {
    background: {
      primary: string;
      card: string;
      input: string;
    };
    border: {
      default: string;
      focus: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      primary: string;
      primaryHover: string;
      positive: string;
      negative: string;
    };
  };
  typography: {
    fontFamily: {
      primary: string;
      mono: string;
    };
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
  };
  spacing: {
    card: { padding: string; gap: string; };
    section: { vertical: string; horizontal: string; };
  };
  borderRadius: Record<string, string>;
}
```

### Component Style Model

```typescript
interface ComponentStyles {
  container: string;      // Base container classes
  hover: string;          // Hover state classes
  focus: string;          // Focus state classes
  disabled: string;       // Disabled state classes
  responsive: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}
```

## Error Handling

### Error Message Component

All error messages will follow a consistent pattern:

```typescript
interface ErrorMessageProps {
  message: string;
  type: 'error' | 'success';
}
```

**Error Styling**:
- Background: red-950
- Border: red-800
- Text: red-400
- Border radius: rounded-lg
- Padding: p-4
- Font: Courier Prime, text-sm

**Success Styling**:
- Background: green-950
- Border: green-800
- Text: green-400
- Border radius: rounded-lg
- Padding: p-4
- Font: Courier Prime, text-sm

### Loading States

All loading states will use a consistent spinner:

```typescript
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  <p className="text-zinc-600 text-sm font-mono ml-4">Loading...</p>
</div>
```

## Testing Strategy

### Visual Regression Testing

Since this is a UI redesign focused on visual presentation, testing will emphasize:

1. **Manual Visual Testing**
   - Compare each page against the Integrated page reference design
   - Verify color consistency across all pages
   - Check typography rendering (Courier Prime font loading)
   - Test responsive breakpoints (mobile, tablet, desktop)
   - Validate hover and focus states

2. **Component Testing**
   - Verify each component renders with correct styling
   - Test component props affect visual output correctly
   - Ensure error and loading states display properly

3. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify font rendering consistency
   - Check CSS custom property support

4. **Accessibility Testing**
   - Verify color contrast ratios meet WCAG AA standards
   - Test keyboard navigation
   - Validate focus indicators are visible
   - Check screen reader compatibility

### Testing Checklist

For each page/component:
- [ ] Background color is black (#0a0a0a)
- [ ] Cards use zinc-900 background with zinc-800 borders
- [ ] Courier Prime font is applied
- [ ] Labels are uppercase with tracking-wider
- [ ] Positive values use emerald-400
- [ ] Negative values use red-400
- [ ] Border radius is rounded-xl for cards
- [ ] card-glow effect applies on hover
- [ ] Responsive breakpoints work correctly
- [ ] Loading states use blue-500 spinner
- [ ] Error messages use red-950/red-800/red-400 colors
- [ ] Input focus states show blue-500 border

## Implementation Approach

### Phase 1: Foundation Setup

1. **Update Global Styles** (app/globals.css)
   - Add Courier Prime font import from Google Fonts
   - Update CSS custom properties for design tokens
   - Add card-glow utility class
   - Ensure Tailwind configuration supports all required colors

2. **Create Design Token Constants** (optional, for reference)
   - Document color values
   - Document typography scale
   - Document spacing system

### Phase 2: Component Updates

Update components in this order (least to most complex):

1. **PriceCard** - Simple card component
2. **GrandTotalCard** - Already complete, verify consistency
3. **SourceAllocationCards** - Already complete, verify consistency
4. **PortfolioSummary** - Grid of summary cards
5. **AddAssetForm** - Form with inputs and search
6. **PortfolioTable** - Complex table with multiple columns
7. **PriceChart** - Chart styling updates

### Phase 3: Page Updates

Update pages in this order:

1. **Login Page** - Simplest page, good starting point
2. **Register Page** - Similar to Login
3. **Dashboard Page** - Uses PriceCard component
4. **Wallet Page** - Uses input and result cards
5. **History Page** - Uses PriceChart component
6. **Portfolio Page** - Most complex, uses multiple components

### Phase 4: Testing and Refinement

1. Visual comparison against Integrated page
2. Responsive testing at all breakpoints
3. Cross-browser verification
4. Accessibility audit
5. Performance check (font loading, animations)

### Implementation Guidelines

**For Each Component/Page**:

1. Replace all `bg-gray-900` with `bg-black`
2. Replace all `bg-gray-800` with `bg-zinc-900`
3. Replace all `border-gray-700` with `border-zinc-800`
4. Replace all `text-gray-400` with `text-zinc-500`
5. Replace all `rounded-lg` with `rounded-xl` (for cards)
6. Add `card-glow` class to all card containers
7. Add `font-mono` class to all text elements
8. Convert labels to uppercase with `uppercase tracking-wider`
9. Replace `text-green-500` with `text-emerald-400`
10. Replace `text-red-500` with `text-red-400`
11. Update button styles to use zinc-800 for secondary actions
12. Update input styles to use black background with zinc-800 borders

**Responsive Patterns**:
- Use `flex-col sm:flex-row` for header navigation
- Use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for card grids
- Use `text-xl sm:text-2xl` for responsive typography
- Use `px-4 sm:px-6 lg:px-8` for responsive padding

**State Management**:
- No changes to existing state management
- No changes to data fetching logic
- No changes to business logic
- Only visual presentation changes

## File Structure Changes

### Files to Modify

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Update styling
│   └── register/
│       └── page.tsx          # Update styling
├── dashboard/
│   └── page.tsx              # Update styling
├── portfolio/
│   └── page.tsx              # Update styling
├── wallet/
│   └── page.tsx              # Update styling
├── history/
│   └── page.tsx              # Update styling
├── globals.css               # Update design tokens
└── layout.tsx                # Verify font loading

components/
├── PriceCard.tsx             # Update styling
├── PortfolioSummary.tsx      # Update styling
├── PortfolioTable.tsx        # Update styling
├── AddAssetForm.tsx          # Update styling
└── charts/
    └── PriceChart.tsx        # Update styling
```

### Files Already Complete

```
app/
└── integrated/
    └── page.tsx              # Reference implementation

components/
├── GrandTotalCard.tsx        # Already uses Web3 design
├── SourceAllocationCards.tsx # Already uses Web3 design
└── charts/
    └── AllocationDonutChart.tsx # Already uses Web3 design
```

### No New Files Required

This redesign only modifies existing files. No new components or pages are needed.

## Design System Reference

### Quick Reference: Class Replacements

| Old Class | New Class | Usage |
|-----------|-----------|-------|
| `bg-gray-900` | `bg-black` | Page backgrounds |
| `bg-gray-800` | `bg-zinc-900` | Card backgrounds |
| `bg-gray-700` | `bg-zinc-800` | Input backgrounds, borders |
| `border-gray-700` | `border-zinc-800` | Card borders |
| `border-gray-600` | `border-zinc-700` | Input borders |
| `text-gray-400` | `text-zinc-500` | Secondary text |
| `text-gray-300` | `text-white` | Primary text |
| `text-green-500` | `text-emerald-400` | Positive values |
| `text-red-500` | `text-red-400` | Negative values |
| `rounded-lg` | `rounded-xl` | Card corners |
| `bg-blue-600` | `bg-blue-600` | Primary buttons (no change) |
| - | `card-glow` | Add to all cards |
| - | `font-mono` | Add to all text |
| - | `uppercase tracking-wider` | Add to all labels |

### Typography Scale

| Element | Classes |
|---------|---------|
| Page Title | `text-2xl sm:text-3xl font-bold font-mono` |
| Section Title | `text-xl font-semibold font-mono` |
| Card Title | `text-lg font-semibold font-mono` |
| Label | `text-sm uppercase tracking-wider font-mono` |
| Body Text | `text-base font-mono` |
| Small Text | `text-sm font-mono` |
| Tiny Text | `text-xs font-mono` |
| Large Value | `text-3xl font-bold font-mono` |

### Spacing Scale

| Context | Classes |
|---------|---------|
| Card Padding | `p-6` |
| Card Gap | `gap-6` |
| Section Spacing | `space-y-6` |
| Small Gap | `gap-4` |
| Container Padding | `px-4 sm:px-6 lg:px-8 py-6 sm:py-8` |

## Conclusion

This design provides a comprehensive blueprint for transforming the Crypto Portfolio Tracker UI into a cohesive, modern Web3 application. By following the token-based design system and systematic implementation approach, all pages and components will achieve visual consistency while maintaining existing functionality.

The design emphasizes:
- **Consistency**: Unified color palette, typography, and spacing
- **Clarity**: High contrast, readable typography, clear visual hierarchy
- **Professionalism**: Clean, modern aesthetic appropriate for financial applications
- **Maintainability**: Token-based system makes future updates easier
- **Accessibility**: Proper contrast ratios and focus indicators

Implementation should proceed phase by phase, with thorough testing at each stage to ensure visual fidelity and functional integrity.
