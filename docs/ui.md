# UI Coding Standards

This document defines the coding standards for all UI components in this project.

## Component Library

### shadcn/ui Components - MANDATORY

**CRITICAL RULE: ONLY shadcn/ui components shall be used for UI elements throughout this entire project.**

- **ABSOLUTELY NO custom UI components should be created**
- All buttons, inputs, cards, dialogs, forms, and other UI elements MUST use shadcn/ui components
- If a UI element is needed, always check the [shadcn/ui documentation](https://ui.shadcn.com/) first
- Install shadcn/ui components as needed using: `npx shadcn@latest add [component-name]`

### Why shadcn/ui Only?

- Ensures consistent design language across the entire application
- Pre-built accessible components (ARIA compliant)
- Fully customizable via Tailwind CSS
- Type-safe with TypeScript
- Maintained and well-documented

### Common shadcn/ui Components

Refer to https://ui.shadcn.com/docs/components for the complete list. Common components include:

- **Forms**: Button, Input, Label, Textarea, Select, Checkbox, Radio Group, Switch
- **Layout**: Card, Separator, Tabs, Accordion
- **Feedback**: Alert, Toast, Dialog, Alert Dialog, Popover, Tooltip
- **Data Display**: Table, Badge, Avatar, Progress
- **Navigation**: Navigation Menu, Dropdown Menu, Sheet

## Date Formatting

### date-fns - Standard Library

All date formatting in this project MUST be done using the `date-fns` library.

### Standard Date Format

**Format Pattern**: `do MMM yyyy`

**Examples**:
- 1st Sep 2025
- 2nd Aug 2025
- 3rd Jan 2026
- 4th Jun 2024

### Implementation

```typescript
import { format } from 'date-fns';

// Format a date
const formattedDate = format(new Date('2025-09-01'), 'do MMM yyyy');
// Output: "1st Sep 2025"
```

### Format Breakdown

- `do` - Day of month with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
- `MMM` - Abbreviated month name (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)

### Consistency

- **Always use this exact format** for displaying dates to users
- Do not create custom date formatting functions
- Do not use alternative date libraries (e.g., moment.js, dayjs)
- For date arithmetic or parsing, continue using date-fns utilities

## Summary

1. **UI Components**: ONLY shadcn/ui - NO custom components
2. **Date Formatting**: ONLY date-fns with format `do MMM yyyy`

These standards are non-negotiable and must be followed throughout the entire project to ensure consistency and maintainability.
