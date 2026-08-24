# COSSIM Next.js Frontend Architecture

## Overview

COSSIM is a comprehensive logistics and package management platform built with Next.js 14.2.15 and React 18.3.1. The application provides multi-role dashboards for administrators, vendors, riders, sales agents, and distribution center managers, enabling efficient management of logistics operations, real-time tracking, analytics, and user management.

## Technology Stack

### Core Framework

- **Next.js 14.2.15** - React framework with App Router for server-side rendering and routing
- **React 18.3.1** - UI library with modern features and hooks
- **Node.js >=18.0.0** - Runtime environment

### UI and Styling

- **Ant Design 5.20.6** - Primary UI component library
- **Bootstrap 5.3.7** - CSS framework for responsive design
- **SCSS** - Custom styling system
- **PrimeReact 10.9.6** - Additional UI components
- **React Bootstrap** - Bootstrap components for React

### State Management

- **Redux Toolkit 2.8.2** - State management with modern Redux patterns
- **React Context API** - Local state management for authentication and PWA features

### Data Visualization

- **ApexCharts 5.3.2** - Advanced charting library
- **Chart.js 4.5.0** - Simple charting solutions
- **React ApexCharts** - React wrapper for ApexCharts
- **React Chart.js 2** - React wrapper for Chart.js

### Additional Libraries

- **React Hot Toast** - Notification system
- **React DnD** - Drag and drop functionality
- **React Date Range** - Date picker components
- **QRCode** - QR code generation
- **JSZip** - File compression
- **HTML2Canvas** - Screenshot generation
- **jsPDF** - PDF generation
- **FullCalendar** - Calendar components

### Development Tools

- **ESLint** - Code linting (with known TypeScript parser issues)
- **Next.js Built-in Tools** - Development server, build optimization

## Application Architecture

### Architecture Pattern

The application follows a **component-based architecture** with clear separation of concerns:

- **Presentation Layer**: React components with Next.js pages
- **Business Logic Layer**: Custom hooks and services
- **Data Access Layer**: API client and service modules
- **State Management Layer**: Redux store and React Context

### Key Architectural Decisions

1. **Next.js App Router**: Uses the modern App Router for file-based routing and server components
2. **Role-Based Access Control**: Multi-tenant architecture supporting different user roles
3. **Progressive Web App (PWA)**: Installable web application with offline capabilities
4. **Responsive Design**: Mobile-first approach with Bootstrap and custom SCSS
5. **Security-First**: JWT-based authentication with secure storage and middleware protection

## Project Structure

```plain
src/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Authentication routes (signin, forgot-password)
│   ├── (shared)/                 # Shared routes and layouts
│   ├── admin/                    # Admin dashboard routes
│   ├── dc/                       # Distribution center routes
│   ├── profile/                  # User profile routes
│   ├── rider/                    # Rider dashboard routes
│   ├── sales/                    # Sales agent routes
│   ├── track/                    # Package tracking routes
│   ├── vendor/                   # Vendor dashboard routes
│   ├── layout.js                 # Root layout with providers
│   ├── page.js                   # Home page
│   ├── providers.jsx             # App-wide providers
│   ├── globals.css               # Global styles
│   └── error.js                  # Error boundary
├── components/                   # Reusable UI components
│   ├── AuthGuard.jsx            # Route protection component
│   ├── RoleGuard.jsx            # Role-based access control
│   ├── Sidebar/                 # Navigation components
│   ├── ui/                      # Base UI components
│   ├── cards/                   # Card components
│   ├── charts/                  # Chart components
│   ├── modals/                  # Modal components
│   └── vendor/                  # Vendor-specific components
├── contexts/                    # React contexts
│   ├── AuthContext.jsx         # Authentication state
│   └── PWAContext.jsx          # PWA functionality
├── services/                   # API service layer
│   ├── authService.js          # Authentication services
│   ├── vendorService.js        # Vendor management
│   ├── agentService.js         # Sales agent operations
│   └── [role]Service.js        # Role-specific services
├── hooks/                      # Custom React hooks
│   ├── useAPI.js              # Generic API hook
│   ├── useAuth.js             # Authentication hook
│   ├── useVendorDashboard.js  # Vendor dashboard logic
│   └── [role]Hooks.js         # Role-specific hooks
├── lib/                       # Utility libraries
│   ├── apiClient.js           # Centralized API client
│   ├── secureStorage.js       # Secure local storage
│   ├── toast.js               # Toast notifications
│   └── authMigration.js       # Auth data migration
├── constants/                 # Application constants
│   ├── apis.js                # API endpoints
│   ├── constants.js           # General constants
│   ├── user-roles.js          # User role definitions
│   └── package_status.js      # Package status definitions
├── core/                      # Core business logic
│   ├── data/                  # Static data and mocks
│   ├── pagination/            # Pagination utilities
│   └── redux/                 # Redux store configuration
├── Router/                    # Routing utilities
├── style/                     # Styling assets
│   └── scss/                  # SCSS stylesheets
└── utils/                     # Utility functions
```

## Authentication & Authorization

### Authentication Flow

1. **JWT-based Authentication**: Uses JSON Web Tokens for session management
2. **Secure Storage**: Combines localStorage, sessionStorage, and secure encryption
3. **Token Validation**: Automatic token refresh and expiration handling
4. **Middleware Protection**: Route-level authentication checks

### Authorization Model

- **Role-Based Access Control (RBAC)**: Different dashboards for each user role
- **Route Guards**: `AuthGuard` and `RoleGuard` components protect routes
- **Middleware**: Server-side route protection and redirection

### Supported Roles

- **Administrator**: Full system access and management
- **Vendor**: Package creation and management
- **Rider**: Delivery tracking and management
- **Sales Agent**: Customer acquisition and management
- **Distribution Center Manager**: Warehouse and logistics management

## API Integration

### API Client Architecture

- **Centralized API Client**: `apiClient.js` handles all HTTP requests
- **Automatic Authentication**: JWT tokens automatically included in requests
- **Error Handling**: Consistent error handling and user feedback
- **Vendor Category Context**: Dynamic API routing based on vendor categories

### Service Layer

Each role has dedicated service modules:

- `authService.js` - Authentication operations
- `vendorService.js` - Vendor-specific API calls
- `riderService.js` - Rider operations
- `agentService.js` - Sales agent operations

### API Patterns

- **RESTful APIs**: Standard REST endpoints
- **Error Handling**: Toast notifications for user feedback
- **Loading States**: Consistent loading indicators
- **Caching**: Client-side caching for performance

## State Management

### Redux Store

- **Global State**: Application-wide state management
- **Slices**: Modular state organization by feature
- **Middleware**: Async operations with Redux Thunk
- **DevTools**: Redux DevTools integration

### React Context

- **AuthContext**: User authentication state
- **PWAContext**: Progressive Web App features

### Custom Hooks

- **Data Fetching**: `useAPI` for generic API calls
- **Role-specific Logic**: Dedicated hooks for each user role
- **UI State**: Component-level state management

## Routing & Navigation

### Next.js App Router

- **File-based Routing**: Routes defined by folder structure
- **Dynamic Routes**: Support for dynamic segments
- **Route Groups**: Organized routes with parentheses (auth), (shared)
- **Middleware**: Route protection and redirection

### Navigation Components

- **Sidebar**: Role-based navigation menus
- **Breadcrumbs**: Navigation context
- **Protected Routes**: Authentication and authorization checks

## Component Architecture

### Component Organization

- **Atomic Design**: Components organized by complexity
- **Reusable Components**: Shared UI elements
- **Role-specific Components**: Dashboard components per user role
- **Higher-Order Components**: Guards and wrappers

### Key Components

- **AuthGuard**: Protects authenticated routes
- **RoleGuard**: Enforces role-based access
- **DashboardSwitcher**: Role-based dashboard routing
- **Sidebar**: Navigation component
- **Data Tables**: Sortable, filterable data displays
- **Charts**: Various chart types for analytics

## Performance Optimizations

### Next.js Features

- **Server-Side Rendering (SSR)**: Improved initial load times
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Compression**: Gzip compression enabled

### Caching Strategies

- **API Response Caching**: Client-side caching
- **Static Asset Caching**: Browser caching headers
- **Service Worker**: PWA caching for offline use

### Bundle Optimization

- **Tree Shaking**: Unused code elimination
- **Dynamic Imports**: Code splitting for large components
- **Optimized Images**: WebP and AVIF formats

## Security Measures

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Secure Storage**: Encrypted local storage
- **Token Expiration**: Automatic token refresh
- **CSRF Protection**: Security headers

### Application Security

- **Content Security Policy**: XSS prevention
- **HTTPS Only**: Secure communication
- **Input Validation**: Client and server-side validation
- **Secure Headers**: Security headers configuration

## Progressive Web App (PWA)

### PWA Features

- **Installable**: Can be installed as a native app
- **Offline Support**: Service worker caching
- **Push Notifications**: Background sync capabilities
- **App Manifest**: Web app manifest configuration

### PWA Components

- **Service Worker**: Background processing
- **Web App Manifest**: App metadata
- **Install Prompt**: User installation prompts

## Development & Deployment

### Development Environment

- **Hot Reload**: Fast development with Next.js dev server
- **ESLint**: Code quality enforcement
- **Environment Variables**: Configuration management
- **Compatible Dependencies**: All packages compatible with React 18

### Build Process

- **Static Generation**: Pre-built pages where possible
- **Server-Side Rendering**: Dynamic content rendering
- **Image Optimization**: Build-time image processing
- **Bundle Analysis**: Build size optimization

### Deployment Considerations

- **Vercel/Netlify**: Recommended hosting platforms
- **CDN**: Static asset delivery
- **Environment Config**: Production environment variables
- **Monitoring**: Performance and error monitoring

## Testing Strategy

### Testing Approach

- **Unit Tests**: Component and utility testing
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end user flow testing
- **Manual Testing**: User acceptance testing

### Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **Cypress**: End-to-end testing
- **Playwright**: Browser automation

## Monitoring & Analytics

### Performance Monitoring

- **Core Web Vitals**: Google Web Vitals tracking
- **Real User Monitoring**: User experience metrics
- **Error Tracking**: Application error monitoring
- **Performance Budgets**: Build size limits

### Business Analytics

- **User Behavior**: Usage analytics
- **Conversion Tracking**: Business metric monitoring
- **Dashboard Analytics**: Real-time business metrics
- **Reporting**: Automated report generation

## Future Considerations

### Scalability

- **Microservices**: Potential API microservices architecture
- **Database Optimization**: Query optimization and indexing
- **CDN Integration**: Global content delivery
- **Caching Layers**: Redis or similar caching solutions

### Feature Enhancements

- **Real-time Updates**: WebSocket integration
- **Mobile App**: React Native companion app
- **AI/ML Integration**: Predictive analytics
- **Multi-language Support**: Internationalization

### Technical Debt

- **TypeScript Migration**: Gradual adoption of TypeScript
- **Component Refactoring**: Legacy component modernization
- **Bundle Size Optimization**: Continued optimization efforts
- **Testing Coverage**: Increased automated testing

---

*This architecture document provides a comprehensive overview of the COSSIM Next.js frontend application. It should be updated as the application evolves and new features are added.*
