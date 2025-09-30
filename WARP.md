# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Kontent.ai custom application that finds duplicate URL slugs across pages in a Kontent.ai environment. Built with TypeScript, Vite, and designed for deployment on Netlify.

## Development Commands

### Local Development
```bash
npm run dev                    # Start Vite dev server
npm run dev:functions         # Start Netlify dev server with functions support
npm run dev:functions:live    # Start Netlify dev server with live tunnel
```

### Build & Deploy
```bash
npm run build     # Build TypeScript and bundle with Vite
npm run preview   # Preview production build locally
```

### Code Quality
```bash
npx biome check   # Run Biome linter/formatter
npx biome format  # Format code with Biome
```

## Architecture

### Core Structure
- **Frontend**: Single-page application built with vanilla TypeScript and Vite
- **Custom App SDK**: Uses `@kontent-ai/custom-app-sdk` to integrate with Kontent.ai environment
- **Management SDK**: Uses `@kontent-ai/management-sdk` for API interactions
- **Deployment**: Configured for Netlify with SPA redirect rules

### Key Files
- `src/main.ts` - Main application logic with duplicate slug detection
- `index.html` - Simple HTML entry point for the SPA
- `netlify.toml` - Netlify deployment configuration
- `tsconfig.json` - TypeScript configuration with path aliases

### Data Flow
1. Application attempts to get Kontent.ai context via Custom App SDK
2. Falls back to environment variables for project ID and API key
3. Fetches all page items with URL slugs from Kontent.ai Delivery API
4. Groups items by slug and identifies duplicates
5. Displays results in the UI

## Environment Configuration

### Required Environment Variables
- `VITE_KONTENT_PROJECT_ID` - Kontent.ai project/environment ID
- `VITE_KONTENT_API_KEY` - Optional API key for secured environments

### Kontent.ai Integration
- The app automatically detects the environment ID when running within Kontent.ai
- Uses Delivery API with pagination to handle large datasets
- Filters for page content types with url_slug elements

## TypeScript Configuration

- Target: ESNext with modern module resolution
- Path aliases: `@/*` maps to `src/*`
- Includes both source files and potential Netlify functions
- Strict mode enabled for better type safety

## Build System

- **Bundler**: Vite for fast development and optimized production builds
- **Output**: Static files to `dist/` directory
- **SPA Support**: Netlify redirects handle client-side routing
- **TypeScript**: Compiled before bundling for type checking

## Development Notes

- The application handles API pagination automatically for large content sets
- Error handling includes both network errors and missing configuration
- UI updates dynamically based on API responses
- Uses modern fetch API for HTTP requests