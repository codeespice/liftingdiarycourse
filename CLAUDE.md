# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16.1.1 application (App Router) with TypeScript, React 19, and Tailwind CSS 4. The project is a lifting diary course application currently in its initial scaffolded state.

## Development Commands

### Running the Application
- **Development server**: `npm run dev` (starts on http://localhost:3000)
- **Production build**: `npm run build`
- **Production server**: `npm start`
- **Linting**: `npm run lint`

## Architecture & Key Patterns

### Next.js App Router Structure
- Uses the Next.js App Router (`app/` directory)
- Pages and layouts are React Server Components by default
- Client-side interactivity requires `"use client"` directive

### File Organization
- `app/` - Application routes and layouts
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind imports
- `public/` - Static assets (SVG files)
- TypeScript configuration uses `@/*` path alias for imports (maps to root directory)

### Styling
- **Tailwind CSS 4** via PostCSS plugin (`@tailwindcss/postcss`)
- Custom theme configuration in `globals.css` using `@theme inline` directive
- CSS variables for theming: `--background`, `--foreground`
- Dark mode support via `prefers-color-scheme` media query
- Geist Sans and Geist Mono fonts loaded via `next/font/google`

### TypeScript Configuration
- Strict mode enabled
- Module resolution: `bundler`
- JSX mode: `react-jsx` (new JSX transform)
- Path alias `@/*` available for clean imports

### ESLint Configuration
- Uses Next.js ESLint config (`eslint-config-next`)
- Extends both core web vitals and TypeScript presets
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Important Notes

### Tailwind CSS 4
This project uses Tailwind CSS 4, which has significant changes from v3:
- Configuration is now in CSS via `@theme` directive (not `tailwind.config.js`)
- Uses new PostCSS plugin (`@tailwindcss/postcss`)
- Import Tailwind with `@import "tailwindcss"` in CSS files

### Next.js 16 Features
- React 19 with improved JSX transform
- Server Components by default in App Router
- Image optimization via `next/image` component
- Metadata API for SEO configuration

### Path Aliases
Use `@/` prefix for imports from the root directory:
```typescript
import Component from "@/app/components/Component"
```
