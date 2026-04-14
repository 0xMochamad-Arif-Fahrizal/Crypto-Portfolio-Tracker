# Requirements Document

## Introduction

This document specifies the requirements for redesigning the entire Crypto Portfolio Tracker UI to follow a consistent, clean, modern Web3 design system. Currently, only the Integrated page implements the new design aesthetic with black backgrounds, zinc-900 cards, Courier Prime monospace typography, and minimal color accents. This redesign will apply the same design language across all pages (Dashboard, Portfolio, Wallet, History, Login, Register) and shared components to create a cohesive, professional user experience.

## Glossary

- **UI_System**: The user interface design system including colors, typography, spacing, and component styles
- **Web3_Design**: Modern minimalist aesthetic common in blockchain/crypto applications featuring dark backgrounds, monospace fonts, and subtle glows
- **Design_Token**: Reusable design values (colors, spacing, typography) defined in the design system
- **Component**: Reusable UI element (PriceCard, PortfolioTable, etc.)
- **Page**: Top-level route in the application (Dashboard, Portfolio, Wallet, History, Login, Register, Integrated)
- **Responsive_Breakpoint**: Screen size threshold where layout adapts (sm:, md:, lg: in Tailwind)
- **Card_Glow**: Subtle blue shadow effect applied to cards on hover
- **Color_Palette**: The set of colors used throughout the application
- **Typography_System**: Font families, sizes, and weights used for text hierarchy

## Requirements

### Requirement 1: Apply Web3 Color Palette

**User Story:** As a user, I want all pages to use the same dark color scheme, so that the application feels cohesive and professional.

#### Acceptance Criteria

1. THE UI_System SHALL use black (#0a0a0a) as the primary background color for all pages
2. THE UI_System SHALL use zinc-900 (#18181b) as the card background color
3. THE UI_System SHALL use zinc-800 (#27272a) as the border color for cards and inputs
4. THE UI_System SHALL use white (#ffffff) as the primary text color
5. THE UI_System SHALL use zinc-500 (#71717a) as the secondary text color
6. THE UI_System SHALL use blue-600 (#2563eb) for primary action buttons
7. THE UI_System SHALL use emerald-400 (#34d399) for positive values (profits, gains)
8. THE UI_System SHALL use red-400 (#f87171) for negative values (losses, declines)
9. WHEN a user navigates between pages, THE UI_System SHALL maintain consistent color usage

### Requirement 2: Implement Typography System

**User Story:** As a user, I want consistent typography across all pages, so that text is readable and the interface feels polished.

#### Acceptance Criteria

1. THE Typography_System SHALL use Courier Prime monospace font as the primary font family
2. THE Typography_System SHALL use uppercase text with tracking-wider for all labels
3. THE Typography_System SHALL use font-bold for headings and important values
4. THE Typography_System SHALL use text-sm or text-xs for secondary information
5. WHEN displaying numerical values, THE Typography_System SHALL use font-mono class
6. WHEN displaying page titles, THE Typography_System SHALL use text-2xl sm:text-3xl with font-bold

### Requirement 3: Redesign Dashboard Page

**User Story:** As a user, I want the Dashboard page to match the Integrated page design, so that the interface feels consistent.

#### Acceptance Criteria

1. THE Dashboard SHALL use black background instead of gray-900
2. THE Dashboard SHALL use zinc-900 cards with zinc-800 borders instead of gray-800 cards
3. THE Dashboard SHALL use Courier Prime font for all text
4. THE Dashboard SHALL apply card-glow effect to price cards
5. THE Dashboard SHALL use rounded-xl for card corners instead of rounded-lg
6. THE Dashboard SHALL use uppercase labels with tracking-wider
7. THE Dashboard SHALL maintain responsive grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
8. WHEN the page loads, THE Dashboard SHALL display consistent spacing (p-6 for cards, gap-6 for grid)

### Requirement 4: Redesign Portfolio Page

**User Story:** As a user, I want the Portfolio page to match the Integrated page design, so that portfolio management feels modern and clean.

#### Acceptance Criteria

1. THE Portfolio SHALL use black background instead of gray-900
2. THE Portfolio SHALL use zinc-900 cards with zinc-800 borders
3. THE Portfolio SHALL use Courier Prime font for all text
4. THE Portfolio SHALL apply card-glow effect to summary cards and table container
5. THE Portfolio SHALL use rounded-xl for card corners
6. THE Portfolio SHALL use uppercase labels with tracking-wider for table headers
7. THE Portfolio SHALL use emerald-400 for positive PnL values and red-400 for negative PnL values
8. WHEN displaying the portfolio table, THE Portfolio SHALL use zinc-900 background with zinc-800 borders

### Requirement 5: Redesign Wallet Page

**User Story:** As a user, I want the Wallet page to match the Integrated page design, so that checking wallet balances feels consistent with the rest of the app.

#### Acceptance Criteria

1. THE Wallet SHALL use black background instead of gray-900
2. THE Wallet SHALL use zinc-900 cards with zinc-800 borders
3. THE Wallet SHALL use Courier Prime font for all text
4. THE Wallet SHALL apply card-glow effect to input card and balance result card
5. THE Wallet SHALL use rounded-xl for card corners
6. THE Wallet SHALL use black background for input fields with zinc-800 borders
7. THE Wallet SHALL use focus:border-blue-500 for input focus states
8. WHEN displaying wallet address, THE Wallet SHALL use font-mono for the address text

### Requirement 6: Redesign History Page

**User Story:** As a user, I want the History page to match the Integrated page design, so that viewing price charts feels consistent.

#### Acceptance Criteria

1. THE History SHALL use black background instead of gray-900
2. THE History SHALL use zinc-900 cards with zinc-800 borders for chart containers
3. THE History SHALL use Courier Prime font for all text
4. THE History SHALL apply card-glow effect to chart cards
5. THE History SHALL use rounded-xl for card corners
6. THE History SHALL use uppercase labels with tracking-wider for chart titles
7. WHEN displaying multiple charts, THE History SHALL maintain consistent spacing (space-y-6)

### Requirement 7: Redesign Login Page

**User Story:** As a user, I want the Login page to match the Web3 design aesthetic, so that authentication feels modern and secure.

#### Acceptance Criteria

1. THE Login SHALL use black background instead of gray-900
2. THE Login SHALL use zinc-900 card with zinc-800 border for the login form
3. THE Login SHALL use Courier Prime font for all text
4. THE Login SHALL apply card-glow effect to the form card
5. THE Login SHALL use rounded-xl for card corners
6. THE Login SHALL use black background for input fields with zinc-800 borders
7. THE Login SHALL use focus:border-blue-500 for input focus states
8. THE Login SHALL use blue-600 background for the submit button
9. WHEN displaying error messages, THE Login SHALL use red-950 background with red-800 border

### Requirement 8: Redesign Register Page

**User Story:** As a user, I want the Register page to match the Web3 design aesthetic, so that account creation feels modern and secure.

#### Acceptance Criteria

1. THE Register SHALL use black background instead of gray-900
2. THE Register SHALL use zinc-900 card with zinc-800 border for the registration form
3. THE Register SHALL use Courier Prime font for all text
4. THE Register SHALL apply card-glow effect to the form card
5. THE Register SHALL use rounded-xl for card corners
6. THE Register SHALL use black background for input fields with zinc-800 borders
7. THE Register SHALL use focus:border-blue-500 for input focus states
8. THE Register SHALL use blue-600 background for the submit button
9. WHEN displaying error messages, THE Register SHALL use red-950 background with red-800 border

### Requirement 9: Update PriceCard Component

**User Story:** As a developer, I want the PriceCard component to follow the Web3 design system, so that price displays are consistent.

#### Acceptance Criteria

1. THE PriceCard SHALL use zinc-900 background with zinc-800 border
2. THE PriceCard SHALL apply card-glow effect
3. THE PriceCard SHALL use rounded-xl corners
4. THE PriceCard SHALL use Courier Prime font for all text
5. THE PriceCard SHALL use uppercase labels with tracking-wider
6. THE PriceCard SHALL use emerald-400 for positive price changes and red-400 for negative changes
7. WHEN displaying market stats, THE PriceCard SHALL use zinc-500 for labels and white for values

### Requirement 10: Update PortfolioSummary Component

**User Story:** As a developer, I want the PortfolioSummary component to follow the Web3 design system, so that portfolio metrics are displayed consistently.

#### Acceptance Criteria

1. THE PortfolioSummary SHALL use zinc-900 background with zinc-800 border for each summary card
2. THE PortfolioSummary SHALL apply card-glow effect to each card
3. THE PortfolioSummary SHALL use rounded-xl corners
4. THE PortfolioSummary SHALL use Courier Prime font for all text
5. THE PortfolioSummary SHALL use uppercase labels with tracking-wider
6. THE PortfolioSummary SHALL use emerald-400 for positive PnL and red-400 for negative PnL
7. WHEN displaying the summary grid, THE PortfolioSummary SHALL use gap-4 spacing

### Requirement 11: Update PortfolioTable Component

**User Story:** As a developer, I want the PortfolioTable component to follow the Web3 design system, so that asset listings are consistent.

#### Acceptance Criteria

1. THE PortfolioTable SHALL use zinc-900 background with zinc-800 border
2. THE PortfolioTable SHALL apply card-glow effect
3. THE PortfolioTable SHALL use rounded-xl corners
4. THE PortfolioTable SHALL use Courier Prime font for all text
5. THE PortfolioTable SHALL use uppercase labels with tracking-wider for column headers
6. THE PortfolioTable SHALL use zinc-800 for row dividers
7. THE PortfolioTable SHALL use emerald-400 for positive PnL and red-400 for negative PnL
8. WHEN hovering over rows, THE PortfolioTable SHALL use zinc-700/50 background

### Requirement 12: Update AddAssetForm Component

**User Story:** As a developer, I want the AddAssetForm component to follow the Web3 design system, so that adding assets feels consistent.

#### Acceptance Criteria

1. THE AddAssetForm SHALL use zinc-900 background with zinc-800 border
2. THE AddAssetForm SHALL apply card-glow effect
3. THE AddAssetForm SHALL use rounded-xl corners
4. THE AddAssetForm SHALL use Courier Prime font for all text
5. THE AddAssetForm SHALL use black background for input fields with zinc-800 borders
6. THE AddAssetForm SHALL use focus:border-blue-500 for input focus states
7. THE AddAssetForm SHALL use uppercase labels with tracking-wider
8. WHEN displaying search results, THE AddAssetForm SHALL use zinc-800 background with hover:bg-zinc-700

### Requirement 13: Update PriceChart Component

**User Story:** As a developer, I want the PriceChart component to follow the Web3 design system, so that charts integrate seamlessly.

#### Acceptance Criteria

1. THE PriceChart SHALL use zinc-900 background with zinc-800 border for the chart container
2. THE PriceChart SHALL apply card-glow effect
3. THE PriceChart SHALL use rounded-xl corners
4. THE PriceChart SHALL use Courier Prime font for axis labels and tooltips
5. THE PriceChart SHALL use zinc-500 for grid lines
6. THE PriceChart SHALL use white for axis text
7. WHEN displaying chart data, THE PriceChart SHALL maintain the existing color scheme for the line

### Requirement 14: Update Header Navigation

**User Story:** As a user, I want consistent header navigation across all pages, so that I can easily navigate the application.

#### Acceptance Criteria

1. THE Header SHALL use zinc-900 background with zinc-800 border-b
2. THE Header SHALL use Courier Prime font for all text
3. THE Header SHALL use uppercase text for the app title
4. THE Header SHALL use zinc-500 for inactive nav links and white for active links
5. THE Header SHALL use hover:text-white transition for nav links
6. THE Header SHALL use zinc-800 background for the logout button with hover:bg-zinc-700
7. THE Header SHALL use rounded-lg for button corners
8. WHEN on mobile, THE Header SHALL stack elements vertically with gap-4

### Requirement 15: Maintain Responsive Design

**User Story:** As a user, I want the application to work well on all screen sizes, so that I can use it on any device.

#### Acceptance Criteria

1. THE UI_System SHALL use mobile-first responsive design with sm:, md:, and lg: breakpoints
2. THE UI_System SHALL use flex-col on mobile and flex-row on desktop for header elements
3. THE UI_System SHALL use grid-cols-1 on mobile and increase columns at md: and lg: breakpoints
4. THE UI_System SHALL use text-xl sm:text-2xl for responsive typography
5. THE UI_System SHALL use px-4 sm:px-6 lg:px-8 for responsive padding
6. WHEN the viewport width changes, THE UI_System SHALL adapt layout smoothly without breaking

### Requirement 16: Implement Consistent Spacing

**User Story:** As a user, I want consistent spacing throughout the application, so that the interface feels organized and professional.

#### Acceptance Criteria

1. THE UI_System SHALL use p-6 for card padding
2. THE UI_System SHALL use gap-4 for small spacing between elements
3. THE UI_System SHALL use gap-6 for medium spacing between cards
4. THE UI_System SHALL use space-y-6 for vertical spacing between sections
5. THE UI_System SHALL use mb-8 for spacing below page headers
6. THE UI_System SHALL use py-6 sm:py-8 for main content padding

### Requirement 17: Apply Consistent Button Styles

**User Story:** As a user, I want buttons to look and behave consistently, so that I know what actions are available.

#### Acceptance Criteria

1. THE UI_System SHALL use blue-600 background with hover:bg-blue-700 for primary action buttons
2. THE UI_System SHALL use zinc-800 background with hover:bg-zinc-700 for secondary buttons
3. THE UI_System SHALL use red-600 background with hover:bg-red-700 for destructive actions
4. THE UI_System SHALL use rounded-lg for button corners
5. THE UI_System SHALL use px-4 py-2 for button padding
6. THE UI_System SHALL use font-mono for button text
7. THE UI_System SHALL use disabled:bg-gray-700 disabled:cursor-not-allowed for disabled states
8. WHEN a button is clicked, THE UI_System SHALL provide visual feedback through transition-colors

### Requirement 18: Implement Consistent Input Styles

**User Story:** As a user, I want form inputs to look and behave consistently, so that data entry is intuitive.

#### Acceptance Criteria

1. THE UI_System SHALL use black background for all input fields
2. THE UI_System SHALL use zinc-800 border for input fields
3. THE UI_System SHALL use focus:border-blue-500 for input focus states
4. THE UI_System SHALL use rounded-lg for input corners
5. THE UI_System SHALL use px-4 py-3 for input padding
6. THE UI_System SHALL use white text color for input values
7. THE UI_System SHALL use zinc-600 for placeholder text
8. THE UI_System SHALL use font-mono for input text
9. WHEN an input receives focus, THE UI_System SHALL show blue border with transition-colors

### Requirement 19: Standardize Error and Success Messages

**User Story:** As a user, I want consistent error and success messages, so that I understand system feedback clearly.

#### Acceptance Criteria

1. THE UI_System SHALL use red-950 background with red-800 border for error messages
2. THE UI_System SHALL use red-400 text color for error message content
3. THE UI_System SHALL use green-950 background with green-800 border for success messages
4. THE UI_System SHALL use green-400 text color for success message content
5. THE UI_System SHALL use rounded-lg for message containers
6. THE UI_System SHALL use p-4 for message padding
7. THE UI_System SHALL use font-mono for message text
8. THE UI_System SHALL use text-sm for message text size

### Requirement 20: Maintain Loading States

**User Story:** As a user, I want consistent loading indicators, so that I know when the system is processing.

#### Acceptance Criteria

1. THE UI_System SHALL use blue-500 color for loading spinners
2. THE UI_System SHALL use animate-spin for spinner animation
3. THE UI_System SHALL use h-12 w-12 for full-page loading spinners
4. THE UI_System SHALL use zinc-600 text color for loading text
5. THE UI_System SHALL use font-mono for loading text
6. WHEN data is loading, THE UI_System SHALL center the spinner with flex items-center justify-center
