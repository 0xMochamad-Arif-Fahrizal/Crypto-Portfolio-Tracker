# Implementation Plan: UI Redesign Web3

## Overview

This implementation plan transforms the Crypto Portfolio Tracker UI to follow a consistent Web3 design system. The redesign applies the black/zinc aesthetic with Courier Prime typography from the Integrated page across all other pages and components. This is a visual redesign only - no business logic or data handling changes.

## Reference Implementation

The Integrated page (`app/integrated/page.tsx`) and its components (`GrandTotalCard`, `SourceAllocationCards`, `AllocationDonutChart`) already implement the target design and serve as the reference for all styling decisions.

## Tasks

- [x] 1. Phase 1: Foundation Setup
  - [x] 1.1 Update globals.css with Web3 design tokens
    - Verify Courier Prime font import from Google Fonts
    - Update CSS custom properties for black/zinc color scheme
    - Ensure card-glow utility class is properly defined
    - Verify all Tailwind color classes are available
    - _Requirements: 1.1-1.9, 2.1-2.6, 16.1-16.6_

  - [x] 1.2 Update app/layout.tsx font configuration
    - Verify Courier Prime font is loaded via next/font/google
    - Ensure font-mono class maps to Courier Prime
    - Test font rendering across pages
    - _Requirements: 2.1, 2.5_

- [x] 2. Phase 2: Component Updates
  - [x] 2.1 Update PriceCard component styling
    - Replace bg-gray-800 with bg-zinc-900
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl
    - Add card-glow class to container
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace text-green-500 with text-emerald-400
    - Replace text-red-500 with text-red-400
    - Replace text-gray-400 with text-zinc-500
    - _Requirements: 9.1-9.7_

  - [x] 2.2 Update PortfolioSummary component styling
    - Replace bg-gray-800 with bg-zinc-900 for cards
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl
    - Add card-glow class to each card
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace text-green-500 with text-emerald-400 for positive PnL
    - Replace text-red-500 with text-red-400 for negative PnL
    - _Requirements: 10.1-10.7_

  - [x] 2.3 Update PortfolioTable component styling
    - Replace bg-gray-800 with bg-zinc-900 for container
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl
    - Add card-glow class to container
    - Add font-mono to all text elements
    - Convert table headers to uppercase with tracking-wider
    - Replace border-gray-700 with border-zinc-800 for row dividers
    - Replace text-green-500 with text-emerald-400 for positive PnL
    - Replace text-red-500 with text-red-400 for negative PnL
    - Update hover state to use zinc-700/50
    - _Requirements: 11.1-11.8_

  - [x] 2.4 Update AddAssetForm component styling
    - Replace bg-gray-800 with bg-zinc-900 for container
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl
    - Add card-glow class to container
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace input bg-gray-700 with bg-black
    - Replace input border-gray-600 with border-zinc-800
    - Add focus:border-blue-500 to inputs
    - Update search results to use zinc-800 with hover:bg-zinc-700
    - _Requirements: 12.1-12.8_

  - [x] 2.5 Update PriceChart component styling
    - Replace bg-gray-800 with bg-zinc-900 for container
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl
    - Add card-glow class to container
    - Add font-mono to chart axis labels
    - Update grid lines to use zinc-500
    - Update axis text to white
    - Ensure tooltips use Courier Prime font
    - _Requirements: 13.1-13.7_

- [x] 3. Checkpoint - Verify component styling
  - Ensure all components match the reference design from Integrated page, ask the user if questions arise.

- [ ] 4. Phase 3: Page Updates
  - [x] 4.1 Update Login page styling
    - Replace bg-gray-900 with bg-black for page background
    - Replace bg-gray-800 with bg-zinc-900 for form card
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl for card
    - Add card-glow class to form card
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace input bg-gray-700 with bg-black
    - Replace input border-gray-600 with border-zinc-800
    - Add focus:border-blue-500 to inputs
    - Update button to use blue-600 with hover:bg-blue-700
    - Update error messages to use red-950 bg with red-800 border and red-400 text
    - _Requirements: 7.1-7.9, 18.1-18.9, 19.1-19.8_

  - [x] 4.2 Update Register page styling
    - Replace bg-gray-900 with bg-black for page background
    - Replace bg-gray-800 with bg-zinc-900 for form card
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl for card
    - Add card-glow class to form card
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace input bg-gray-700 with bg-black
    - Replace input border-gray-600 with border-zinc-800
    - Add focus:border-blue-500 to inputs
    - Update button to use blue-600 with hover:bg-blue-700
    - Update error messages to use red-950 bg with red-800 border and red-400 text
    - _Requirements: 8.1-8.9, 18.1-18.9, 19.1-19.8_

  - [x] 4.3 Update Dashboard page styling
    - Replace bg-gray-900 with bg-black for page background
    - Update header to use zinc-900 bg with zinc-800 border-b
    - Add font-mono to all text elements
    - Convert page title and labels to uppercase with tracking-wider
    - Update navigation links: zinc-500 inactive, white active, hover:text-white
    - Update logout button to zinc-800 bg with hover:bg-zinc-700
    - Ensure PriceCard grid maintains responsive layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
    - Update loading spinner to use blue-500 with zinc-600 text
    - Update error messages to use red-950 bg with red-800 border and red-400 text
    - Verify responsive padding (px-4 sm:px-6 lg:px-8 py-6 sm:py-8)
    - _Requirements: 3.1-3.8, 14.1-14.8, 15.1-15.6, 20.1-20.6_

  - [x] 4.4 Update Wallet page styling
    - Replace bg-gray-900 with bg-black for page background
    - Update header to use zinc-900 bg with zinc-800 border-b
    - Replace bg-gray-800 with bg-zinc-900 for input card and result card
    - Replace border-gray-700 with border-zinc-800
    - Change rounded-lg to rounded-xl for cards
    - Add card-glow class to cards
    - Add font-mono to all text elements
    - Convert labels to uppercase with tracking-wider
    - Replace input bg-gray-700 with bg-black
    - Replace input border-gray-600 with border-zinc-800
    - Add focus:border-blue-500 to wallet address input
    - Update button to use blue-600 with hover:bg-blue-700
    - Update loading spinner to use blue-500 with zinc-600 text
    - Update error messages to use red-950 bg with red-800 border and red-400 text
    - _Requirements: 5.1-5.8, 14.1-14.8, 18.1-18.9_

  - [x] 4.5 Update History page styling
    - Replace bg-gray-900 with bg-black for page background
    - Update header to use zinc-900 bg with zinc-800 border-b
    - Add font-mono to all text elements
    - Convert page title and chart titles to uppercase with tracking-wider
    - Ensure PriceChart components use updated styling from task 2.5
    - Maintain vertical spacing with space-y-6
    - Update loading spinner to use blue-500 with zinc-600 text
    - _Requirements: 6.1-6.7, 14.1-14.8, 16.3_

  - [x] 4.6 Update Portfolio page styling
    - Replace bg-gray-900 with bg-black for page background
    - Update header to use zinc-900 bg with zinc-800 border-b
    - Add font-mono to all text elements
    - Convert page title and section labels to uppercase with tracking-wider
    - Ensure PortfolioSummary uses updated styling from task 2.2
    - Ensure PortfolioTable uses updated styling from task 2.3
    - Ensure AddAssetForm uses updated styling from task 2.4 (when visible)
    - Update "Add Asset" button to use blue-600 with hover:bg-blue-700
    - Update loading spinner to use blue-500 with zinc-600 text
    - Update error messages to use red-950 bg with red-800 border and red-400 text
    - Verify responsive layout and spacing
    - _Requirements: 4.1-4.8, 14.1-14.8, 17.1-17.8_

- [x] 5. Checkpoint - Verify all pages match reference design
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Phase 4: Final Testing and Refinement
  - [ ]* 6.1 Visual comparison testing
    - Compare each updated page against Integrated page reference
    - Verify color consistency (black backgrounds, zinc-900 cards, zinc-800 borders)
    - Check typography rendering (Courier Prime font loading)
    - Validate uppercase labels with tracking-wider
    - Verify emerald-400 for positive values, red-400 for negative values
    - Confirm rounded-xl corners on all cards
    - Test card-glow hover effects
    - _Requirements: All requirements 1-20_

  - [ ]* 6.2 Responsive design testing
    - Test mobile layout (320px - 640px)
    - Test tablet layout (640px - 1024px)
    - Test desktop layout (1024px+)
    - Verify header navigation stacks properly on mobile
    - Verify grid layouts adapt at breakpoints
    - Verify typography scales responsively
    - Verify padding adjusts at breakpoints
    - _Requirements: 15.1-15.6_

  - [ ]* 6.3 Interactive state testing
    - Test button hover states (blue-700, zinc-700)
    - Test input focus states (blue-500 border)
    - Test link hover states (white text)
    - Test table row hover states (zinc-700/50)
    - Test card hover glow effects
    - Verify loading spinner animations
    - _Requirements: 17.1-17.8, 18.1-18.9_

  - [ ]* 6.4 Cross-browser compatibility testing
    - Test in Chrome (font rendering, CSS custom properties)
    - Test in Firefox (font rendering, CSS custom properties)
    - Test in Safari (font rendering, CSS custom properties)
    - Test in Edge (font rendering, CSS custom properties)
    - Verify Courier Prime font loads correctly in all browsers
    - _Requirements: 2.1_

  - [ ]* 6.5 Accessibility verification
    - Verify color contrast ratios meet WCAG AA standards
    - Test keyboard navigation through all interactive elements
    - Verify focus indicators are visible on all focusable elements
    - Test with screen reader (basic navigation)
    - Ensure all form inputs have proper labels
    - _Requirements: 18.1-18.9_

## Notes

- Tasks marked with `*` are optional visual testing tasks that can be skipped for faster delivery
- All implementation tasks reference specific requirements for traceability
- This is a visual redesign only - no changes to business logic, data fetching, or state management
- The Integrated page serves as the reference implementation for all styling decisions
- All color, typography, and spacing changes follow the design token system defined in design.md
- Checkpoints ensure incremental validation before proceeding to the next phase
