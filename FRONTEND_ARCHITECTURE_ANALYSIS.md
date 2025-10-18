# ReFocused Frontend

**Live Project:** [ReFocused.app](https://refocused.app)

---

## What This Is

ReFocused is an all in one app with lots of practical features you would use on a daily basis things such as Pomodoro, journaling, habit tracking, breathing exercises, and much more. ReFocused is easy to use and mobile friendly. It keeps you logged in, doesn't bother you with any spam, and just gives you the tools to supercharge your general productivity.


---

## Why This Exists

ReFocused exists for many reasons, the main being consolidation. The app has about 8 main features that I have personally installed individual apps for. It is something I actually use it's super simple to use, and every feature is a simple thing iterated on. I wanted to make something that can have real value and anyone can use. I learned a lot about building a full stack application, going from frontend to backend to deployment, rewrites from Vite to Next.js. Only one word could really describe it, and that's iteration. This exists as a real standalone application that I and many others use daily, but it also is a big leap in my journey and a great learning experience where I got to jump into new things and suck at first, then iterate my way to this final product.


---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Feature Rundown](#feature-rundown)
3. [Authentication](#authentication)
4. [State Management](#state-management)
5. [Performance](#performance)
6. [AWS Deployment](#aws-deployment)


---

## Tech Stack

### Core Framework
**Next.js 15.2.4** with App Router • **React 19.1.0** • **TypeScript 5.7.2** (strict mode)

### Key Dependencies
**TanStack React Query 5.80.7** - Data fetching and caching layer
**Axios 1.9.0** - HTTP client with interceptors
**Framer Motion 12.16.0** - Smooth animations and transitions
**Quill 2.0.3** - Rich text editor for journal entries
**Lucide React 0.503.0** - Modern icon library
**React Icons 5.5.0** - Additional icon sets
**Date-fns 4.1.0** - Date manipulation utilities
**bcryptjs 3.0.2** - Client-side password hashing
**UUID 11.1.0** - Unique identifier generation
**Google Accounts API 0.0.16** - OAuth integration

### Styling & UI
**Tailwind CSS 4.0.17** - Utility-first CSS framework
**PostCSS 8.5.3** - CSS processing
**React Loading Skeleton 3.5.0** - Loading state components

### Testing & Quality
**Jest 30.0.5** - Testing framework
**React Testing Library 16.3.0** - Component testing
**ESLint 9.21.0** - Code linting
**TypeScript ESLint 8.29.1** - TypeScript-specific linting

### Build Tools
**Next Bundle Analyzer 15.3.3** - Bundle size analysis
**Babel 7.28.3** - JavaScript transpilation
**Yarn 4.5.2** - Package manager

### File Structure Layout

```
/src
├── /app                          # Next.js App Router - Application pages
│   ├── layout.tsx               # Root layout with metadata & providers
│   ├── page.tsx                 # Landing page
│   ├── /home                    # Dashboard page
│   ├── /journal                 # Journal entries & rich text editor
│   ├── /study                   # Flashcard study system
│   ├── /track                   # Habit tracking with calendar
│   ├── /relax                   # Breathing exercises & meditation
│   ├── /ai                      # AI-powered productivity features
│   ├── /profile                 # User profile management
│   └── /legal                   # Privacy, terms, cookies, data protection
│
├── /components                  # 67+ Reusable UI components
│   ├── QueryProvider.tsx        # TanStack Query configuration
│   ├── ClientLayoutWrapper.tsx  # Client-side layout wrapper
│   ├── AuthModal.tsx            # Login/register modal
│   ├── ErrorBoundary.tsx        # Error handling wrapper
│   ├── /auth                    # Authentication components
│   ├── /breathing               # Breathing exercise components
│   └── [other components]
│
├── /contexts                    # 5 React Context providers
│   ├── AuthContext.tsx          # Authentication state & methods
│   ├── TimeContext.tsx          # Time synchronization with backend
│   ├── AudioContext.tsx         # Global audio mute state
│   ├── ToastContext.tsx         # Toast notification system
│   └── AiConversationContext.tsx # AI conversation state
│
├── /hooks                       # 11+ Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useTime.ts               # Time synchronization hook
│   ├── useDailyCache.ts         # Daily cache management
│   ├── useGoogleAuth.ts         # Google OAuth integration
│   ├── useMonthlyProductivity.ts # Monthly stats tracking
│   ├── useNetworkMonitor.ts     # Network status detection
│   └── [other hooks]
│
├── /services                    # 17 Business logic services
│   ├── authService.ts           # Authentication operations
│   ├── timeService.ts           # Time/date synchronization
│   ├── cacheService.ts          # Cache management
│   ├── goalsService.ts          # Goals CRUD operations
│   ├── studyService.ts          # Flashcard system logic
│   ├── habitsService.ts         # Habit tracking logic
│   ├── journalService.ts        # Journal entry management
│   ├── moodService.ts           # Mood tracking
│   ├── statisticsService.ts     # Statistics calculations
│   └── [other services]
│
├── /utils                       # Utility functions
│   ├── tokenRefresh.ts          # Automatic token refresh manager
│   ├── tokenValidator.ts        # JWT validation & parsing
│   ├── cookieAuth.ts            # Cookie authentication manager
│   ├── csrf.ts                  # CSRF protection utilities
│   ├── rateLimiting.ts          # Rate limiting handler
│   ├── scopedStorage.ts         # User-scoped localStorage
│   ├── logger.ts                # Logging utility
│   ├── dateHelpers.ts           # Date manipulation
│   └── [other utilities]
│
├── /types                       # TypeScript type definitions
│   ├── goal.ts
│   ├── activityLogging.ts
│   ├── monthlyProductivity.ts
│   └── [other types]

---

## Feature Rundown

### Pomodoro Timer
Session tracking with break automation • localStorage persistence across page refreshes • Focus session statistics • 100ms UI refresh rate for smooth countdown display

### Habit Tracking
Daily habit completion with calendar visualization • Streak tracking with progress bars • Monthly habit analytics • Gratitude journal integration

### Journal System
Rich text editor powered by Quill.js • Optional password protection with bcryptjs encryption • Multiple journal collections • Search and filter capabilities

### Flashcard Study System
Create and manage flashcard sets • Study session tracking • Progress statistics • Quick notes (auto-delete at daily reset) • Task management and tracking 

### Breathing Exercises & Meditation
10+ guided breathing techniques (Box Breathing, 4-7-8, Star Breathing, etc.) • Animated SVG visualizations • Real-time phase indicators • Ambient soundscapes with volume control • Session duration tracking

### AI-Powered Productivity
Personalized insights and recommendations • Daily usage limit (100 messages/day) • Conversation history management • Context-aware suggestions

### Goal Management
Create goals with custom progress tracking • Interactive drag-based percentage input • Goal completion history with time-to-completion analytics • Calendar view integration • Filtering and pagination

### Monthly Productivity Analytics
Comprehensive productivity scoring • Monthly trend visualization • Activity logging and insights • Habit completion rates • Study session summaries

### Real-Time Features
Network status detection with offline support • Day change detection for automatic cache invalidation • Toast notifications for user feedback • Smooth UI updates with 100ms refresh intervals

### User Profile
Avatar selection and customization • Account settings management • Google OAuth integration • Email/password authentication

---

## Authentication

### Frontend Authentication Architecture

**Primary Method: HTTP-Only Cookies**
Secure cookie-based authentication handled by the backend with automatic cookie management. Cookies are HTTP-only, preventing JavaScript access for enhanced security.

**Fallback Method: localStorage JWT**
When cookies aren't available or supported, the system falls back to storing JWT tokens in localStorage under the `REF_TOKEN` key with user-scoped storage.

### Token Management

**Automatic Silent Token Refresh**
Background monitoring checks token expiry every 15 seconds. When a token is within 3 minutes of expiration, the system automatically attempts a silent refresh using the `/v1/auth/refresh` endpoint without interrupting the user experience.

**Token Validator**
Client-side JWT validation parses token structure, checks expiration timestamps, and extracts user information without requiring backend verification for every request.

**Auto-Logout Protection**
If token refresh fails or the token is within 30 seconds of expiry, the system automatically logs out the user to prevent authentication errors.


## State Management

### Context-Based Architecture

ReFocused uses React Context API for global state management instead of Redux, providing a lightweight and performant solution with 5 specialized context providers:

### 1. AuthContext
Manages user authentication state, login/logout operations, and user profile data. Automatically initializes on app mount and persists authentication across page refreshes.

### 2. TimeContext
Synchronizes time and date with the backend server every 30 minutes to ensure consistency across timezones. Provides timezone management with browser detection and user override capabilities. Includes mock date support for testing and development.

**Specialized Hooks:**
`useTime()` - Access synchronized time
`useCurrentDate()` - Get current date with caching
`useDateFormatting()` - Format dates consistently
`useTimezone()` - Manage user timezone preferences

### 3. AudioContext
Controls global audio mute state for ambient sounds and meditation features. State persists to localStorage with user-scoped storage.

### 4. ToastContext
Manages toast notification display for user feedback throughout the application.

### 5. AiConversationContext
Handles AI conversation state including message history and conversation management.

### Custom Hooks Layer

11+ custom hooks provide composable logic for common features:

**useAuth()** - Authentication context access
**useDailyCache()** - Daily cache management with automatic invalidation
**useContentCache()** - Content refresh operations
**useDailyContent()** - Daily motivational content loading
**useGoogleAuth()** - Google OAuth integration
**useMonthlyProductivity()** - Monthly statistics tracking
**useNetworkMonitor()** - Network status detection
**useSettings()** - User settings management
**useStreakData()** - Habit streak calculations

### Data Fetching with TanStack React Query

**Configuration:**
Retry attempts: 1
Refetch on window focus: Disabled
Stale time: 5 minutes

React Query handles server state management with automatic caching, background refetching, and cache invalidation. Used extensively in study, journal, and tracking features.

### User-Scoped Storage

All localStorage data is scoped per user account using the `scopedStorage` utility, preventing data leakage between different user sessions on shared devices.

### No Redux - Pure Context Approach

By using Context API with custom hooks and React Query, the application avoids Redux boilerplate while maintaining predictable state management patterns.

---

## Performance

### Code Splitting & Lazy Loading

**Dynamic Imports**
Components are loaded on-demand using Next.js dynamic imports, reducing initial bundle size and improving First Contentful Paint (FCP). Routes automatically code-split at the page level.

**Lazy Component Loading**
Large components like AuthModal, Journal Editor, and Study components load only when needed with custom skeleton loading states for smooth UX.

### Multi-Layer Caching Strategy

**Daily Cache System**
Date-aware cache that automatically invalidates at midnight UTC. Used for daily motivational quotes, words, and productivity themes. Includes cache size monitoring and cleanup.

**React Query Cache**
5-minute stale time for API responses with automatic background refetching. Retry logic with 1 attempt prevents unnecessary server load.

**localStorage Persistence**
User preferences, theme settings, and non-sensitive data persist across sessions with user-scoped isolation.
---

## AWS Deployment

### Architecture Overview
