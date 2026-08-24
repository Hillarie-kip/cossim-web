# CLAUDE.md - COSSIM Next.js Frontend Assistant Instructions

You are Claude, an AI assistant specialized in helping with the COSSIM Next.js frontend project. This document contains comprehensive instructions for working effectively with this codebase.

## Project Overview

**COSSIM** is a comprehensive logistics and package management platform built with Next.js 14.2.15 and React 18.3.1. The application provides multi-role dashboards for administrators, vendors, riders, sales agents, and distribution center managers, enabling efficient management of logistics operations, real-time tracking, analytics, and user management.

### Key Features

- Multi-tenant role-based architecture supporting 5 user types
- Real-time package tracking and management system
- Comprehensive analytics and reporting dashboards
- Progressive Web App (PWA) capabilities with offline support
- Responsive design optimized for mobile and desktop
- JWT-based authentication with secure storage mechanisms
- RESTful API integration with centralized client architecture

## Technology Stack Reference

### Core Framework

- **Next.js 14.2.15** with App Router for server-side rendering and file-based routing
- **React 18.3.1** with modern hooks and concurrent features
- **Node.js >=18.0.0** runtime environment

### UI & Styling Ecosystem

- **Ant Design 5.20.6** (primary UI library)
- **Bootstrap 5.3.7** for responsive grid and utility classes
- **SCSS** with custom variables and mixins
- **PrimeReact 10.9.6** for additional specialized components
- **React Bootstrap** for Bootstrap component integration

### State Management

- **Redux Toolkit 2.8.2** for global application state with RTK Query
- **React Context API** for localized state (authentication, PWA features)

### Data Visualization & Utilities

- **ApexCharts 5.3.2** and **Chart.js 4.5.0** for advanced charting
- **React Hot Toast** for user notifications
- **React DnD** for drag-and-drop functionality
- **QRCode, JSZip, HTML2Canvas, jsPDF** for document and media handling
- **FullCalendar** for scheduling components

## Application Architecture

### Architectural Pattern

The application implements a **component-based architecture** with clear separation of concerns:

1. **Presentation Layer**: React components organized by Next.js App Router
2. **Business Logic Layer**: Custom hooks encapsulating domain logic
3. **Data Access Layer**: Centralized API client with service modules
4. **State Management Layer**: Redux store with React Context integration

### Key Architectural Decisions

- **Next.js App Router**: File-based routing with server components
- **Role-Based Access Control (RBAC)**: Multi-tenant architecture with 5 distinct user roles
- **Progressive Web App (PWA)**: Installable web application with service worker
- **Security-First Design**: JWT authentication with middleware route protection
- **Performance Optimization**: SSR, code splitting, and intelligent caching

## Project Structure Map

```
src/
├── app/                          # Next.js App Router Directory
│   ├── (auth)/                   # Authentication Routes (signin, forgot-password)
│   ├── (shared)/                 # Shared Routes and Layouts
│   ├── admin/                    # Administrator Dashboard Routes
│   ├── dc/                       # Distribution Center Routes
│   ├── profile/                  # User Profile Management Routes
│   ├── rider/                    # Rider Dashboard Routes
│   ├── sales/                    # Sales Agent Routes
│   ├── track/                    # Package Tracking Routes
│   ├── vendor/                   # Vendor Dashboard Routes
│   ├── layout.js                 # Root Layout with Font and Providers
│   ├── page.js                   # Home Page (redirects to dashboard)
│   ├── providers.jsx             # Application-wide Context Providers
│   ├── globals.css               # Global CSS Styles
│   └── error.js                  # Global Error Boundary
├── components/                   # Reusable UI Components
│   ├── AuthGuard.jsx            # Authentication Route Protection
│   ├── RoleGuard.jsx            # Role-Based Access Control
│   ├── Sidebar/                 # Navigation Sidebar Components
│   ├── ui/                      # Base UI Component Library
│   ├── cards/                   # Card-based UI Components
│   ├── charts/                  # Data Visualization Components
│   ├── modals/                  # Modal Dialog Components
│   ├── vendor/                  # Vendor-specific Components
│   └── [feature]/               # Feature-specific Component Groups
├── contexts/                    # React Context Providers
│   ├── AuthContext.jsx         # Authentication State Management
│   └── PWAContext.jsx          # Progressive Web App Features
├── services/                   # API Service Layer
│   ├── authService.js          # Authentication API Operations
│   ├── vendorService.js        # Vendor Management APIs
│   ├── riderService.js         # Rider Operations APIs
│   ├── agentService.js         # Sales Agent APIs
│   └── [role]Service.js        # Role-specific Service Modules
├── hooks/                      # Custom React Hooks
│   ├── useAPI.js              # Generic API Hook (loading/error states)
│   ├── useAuth.js             # Authentication State Hook
│   ├── useVendorDashboard.js  # Vendor Dashboard Logic Hook
│   ├── useRiderDashboard.js   # Rider Dashboard Logic Hook
│   └── [role]Hooks.js         # Role-specific Business Logic Hooks
├── lib/                       # Utility Libraries
│   ├── apiClient.js           # Centralized API Client with Auth
│   ├── secureStorage.js       # Encrypted Local Storage Utilities
│   ├── toast.js               # Toast Notification Utilities
│   └── authMigration.js       # Authentication Data Migration
├── constants/                 # Application Constants
│   ├── apis.js                # API Endpoint Definitions
│   ├── constants.js           # General Application Constants
│   ├── user-roles.js          # User Role Definitions
│   └── package_status.js      # Package Status Definitions
├── core/                      # Core Business Logic
│   ├── data/                  # Static and Mock Data
│   ├── pagination/            # Pagination Utilities
│   └── redux/                 # Redux Store Configuration
├── Router/                    # Routing Utilities and Configurations
├── style/                     # Styling Assets
│   └── scss/                  # SCSS Stylesheets and Variables
├── utils/                     # General Utility Functions
└── documentation/             # Technical Documentation
```

## Development Environment Setup

### Bootstrap Sequence (Execute in Order)

1. **Dependency Installation**:

   ```bash
   npm install
   ```

   - Duration: 90-120 seconds
   - Note: Alternative package managers (yarn, pnpm, bun) are untested

2. **Development Server**:

   ```bash
   npm run dev
   ```

   - Startup time: ~1.5 seconds
   - Access URL: <http://localhost:3000>
   - Validation: Confirm HTTP 200 response

3. **Production Build** (Network Dependent):

   ```bash
   npm run build
   ```

   - Critical Issue: Fails without internet access (Google Fonts dependency)
   - Duration: 2-5 minutes with network connectivity
   - Error Pattern: "Failed to fetch `Lexend` from Google Fonts"

4. **Code Linting**:

   ```bash
   npm run lint
   ```

   - Known Issue: ESLint TypeScript parser errors (safe to ignore)
   - Note: Does not impact application functionality

### Authentication Flow Testing

**Root Route** (`http://localhost:3000`):

- Authenticated users: Automatic redirect to `/dashboard`
- Unauthenticated users: 404 page display

**Dashboard Route** (`http://localhost:3000/dashboard`):

- Unauthenticated: Loading spinner, middleware redirect to `/signin`

## Development Best Practices

### Component Development Guidelines

**Atomic Design Principle**:

- Organize components by complexity levels (atoms → molecules → organisms)
- Maintain reusable UI components in `/components/ui/`
- Feature-specific components in dedicated folders (e.g., `/components/vendor/`)

**Component Patterns**:

- Use custom hooks for business logic separation
- Implement error boundaries for graceful failure handling
- Leverage higher-order components for cross-cutting concerns

### State Management Strategy

**Redux Toolkit Usage**:

- Global application state management
- Implement feature-based slices
- Utilize RTK Query for server state management

**React Context Application**:

- Localized component state (authentication, PWA features)
- Avoid prop drilling with context providers

**Custom Hooks Pattern**:

- Encapsulate data fetching logic
- Standardize loading and error state handling
- Promote reusable business logic

### API Integration Standards

**Centralized API Client** (`apiClient.js`):

- All HTTP requests routed through single client
- Automatic JWT token injection
- Consistent error handling and retry logic

**Service Layer Organization**:

- Feature-based service modules in `/services/`
- RESTful API call encapsulation
- Toast notification integration for user feedback

### Styling and UI Guidelines

**SCSS Architecture**:

- CSS modules for component-scoped styling
- Bootstrap utility classes for rapid development
- Ant Design component consistency

**Responsive Design**:

- Mobile-first development approach
- Bootstrap grid system utilization
- Progressive enhancement for larger screens

### Security Implementation

**Authentication Security**:

- JWT token-based session management
- Secure storage with encryption (`secureStorage.js`)
- Automatic token refresh mechanisms

**Application Security**:

- Client and server-side input validation
- Route protection with AuthGuard and RoleGuard
- Security headers configuration in `next.config.mjs`

### Performance Optimization

**Next.js Optimizations**:

- Automatic route-based code splitting
- Image optimization with Next.js Image component
- Server-side rendering for improved initial load

**Caching Strategies**:

- API response caching implementation
- Static asset caching with appropriate headers
- Service worker caching for PWA offline support

**Bundle Optimization**:

- Tree shaking for unused code elimination
- Dynamic imports for large component lazy loading
- Bundle size monitoring and optimization

## User Role Architecture

### Administrator Role

- **Scope**: Full system access and management
- **Features**: User management, system analytics, configuration
- **Routes**: `/admin/*` namespace
- **Permissions**: All system operations

### Vendor Role

- **Scope**: Package creation and vendor operations
- **Features**: Customer management, payment tracking, analytics
- **Routes**: `/vendor/*` namespace
- **Permissions**: Vendor-specific operations

### Rider Role

- **Scope**: Delivery operations and tracking
- **Features**: Route management, earnings tracking, performance
- **Routes**: `/rider/*` namespace
- **Permissions**: Delivery and rider operations

### Sales Agent Role

- **Scope**: Customer acquisition and sales operations
- **Features**: Lead management, commission tracking, territory
- **Routes**: `/sales/*` namespace
- **Permissions**: Sales and customer operations

### Distribution Center Manager Role

- **Scope**: Warehouse and logistics coordination
- **Features**: Inventory management, logistics tracking, performance
- **Routes**: `/dc/*` namespace
- **Permissions**: Distribution center operations

## Testing and Quality Assurance

### Testing Strategy

- **Unit Testing**: Component and utility function testing with Jest
- **Integration Testing**: API service and component integration
- **End-to-End Testing**: Critical user journey testing with Playwright
- **Manual Testing**: Authentication flow and role-based feature validation

### Code Quality

- ESLint configuration (ignore known TypeScript parser issues)
- Component prop validation with PropTypes
- Error boundary implementation for production stability

## Deployment and Production

### Deployment Platforms

- **Recommended**: Vercel, Netlify for optimized Next.js deployment
- **CDN Integration**: Static asset delivery optimization
- **Environment Configuration**: Production environment variables

### Production Considerations

- **Security**: HTTPS enforcement, security headers
- **Monitoring**: Performance metrics, error tracking
- **Caching**: CDN and browser caching strategies
- **Analytics**: User behavior and conversion tracking

## Configuration Files Reference

- `middleware.js`: Route protection and authentication middleware
- `jsconfig.js`: Path aliases configuration (`@/*` → `./src/*`)
- `next.config.mjs`: Next.js configuration with security headers
- `eslint.config.mjs`: ESLint configuration (TypeScript parser issues)
- `package.json`: Dependencies, scripts, and project metadata

## Common Development Commands

```bash
# Development Workflow
npm run dev              # Start development server
npm run build           # Create production build
npm run start           # Start production server
npm run lint            # Execute code linting

# Validation Commands
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Server response validation
```

## Working Methodology

When assisting with this project:

1. **Reference Priority**: Always consult this document first for project context
2. **Architecture Awareness**: Maintain awareness of role-based architecture and component organization
3. **Security Consciousness**: Apply security best practices in all code suggestions
4. **Performance Focus**: Consider performance implications in recommendations
5. **Testing Emphasis**: Promote comprehensive testing strategies
6. **Documentation**: Encourage inline code documentation and README updates

**Fallback Protocol**: Use search commands or bash operations only when encountering information not covered in this comprehensive guide.

---

*This instruction set ensures consistent, high-quality assistance for the COSSIM Next.js frontend project. Reference this document for all development activities.*
