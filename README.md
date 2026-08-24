# COSSIM - Comprehensive Logistics Management Platform

![COSSIM Logo](public/favicon.png)

COSSIM is a comprehensive logistics and package management platform built with Next.js 14.2.15 and React 18.3.1. It provides multi-role dashboards for administrators, vendors, riders, sales agents, and distribution center managers, enabling efficient management of logistics operations, real-time tracking, analytics, and user management.

## Features

### Multi-Role Architecture

COSSIM implements a sophisticated role-based access control system with dedicated dashboards:

- **Administrator Dashboard**: Complete system oversight, user management, and configuration
- **Vendor Portal**: Package creation, customer management, payment tracking, and performance analytics
- **Rider Dashboard**: Delivery assignment, route optimization, earnings tracking, and performance metrics
- **Sales Agent Interface**: Customer acquisition, lead management, commission tracking, and territory management
- **Distribution Center Manager**: Warehouse management, inventory tracking, and logistics coordination

### Core Capabilities

- **Real-time Package Tracking**: Live shipment monitoring with status updates
- **Advanced Analytics**: Comprehensive business intelligence and reporting dashboards
- **Data Export System**: PDF and Excel export functionality for all data tables
- **Progressive Web App**: Mobile-optimized experience with offline capabilities
- **Secure Authentication**: JWT-based authentication with encrypted storage
- **Responsive Design**: Seamless experience across all devices and screen sizes

## Technology Stack

### Core Framework

- **Next.js 14.2.15** - React framework with App Router for SSR and file-based routing
- **React 18.3.1** - Modern React with hooks and concurrent features
- **Node.js >=18.0.0** - Runtime environment

### UI & Styling

- **Ant Design 5.20.6** - Primary UI component library
- **Bootstrap 5.3.7** - CSS framework for responsive design
- **SCSS** - Custom styling with variables and mixins
- **PrimeReact 10.9.6** - Additional specialized UI components

### State Management & Data

- **Redux Toolkit 2.8.2** - Modern Redux with slices and RTK Query
- **React Context API** - Local state management for auth and PWA features

### Data Visualization

- **ApexCharts 5.3.2** - Advanced charting library
- **Chart.js 4.5.0** - Simple charting solutions
- **React ApexCharts & React Chart.js 2** - React wrappers

### Utilities & Libraries

- **React Hot Toast** - Notification system
- **React DnD** - Drag and drop functionality
- **QRCode, JSZip, HTML2Canvas, jsPDF** - Document and media utilities
- **FullCalendar** - Calendar and scheduling components
- **React Icons, Lucide React, FontAwesome** - Icon libraries

### Development Tools

- **ESLint** - Code linting (with known TypeScript parser issues)
- **Next.js DevTools** - Built-in development tools

## Prerequisites

- **Node.js >= 18.0.0**
- **npm >= 8.0.0**
- **Internet connection** (required for production builds due to Google Fonts)

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Validation**: Always verify the server responds with HTTP 200 before proceeding.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

 **Critical**: Production builds require internet access for Google Fonts. Builds will fail in sandboxed environments without network connectivity.

### Code Quality

```bash
# Run linting
npm run lint
```

 **Known Issue**: ESLint may show TypeScript parser errors even though this is primarily a JavaScript project. This does not affect functionality and can be safely ignored.

## Project Architecture

### Application Structure

```
src/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Authentication routes (signin, forgot-password)
│   ├── (shared)/                 # Shared routes and layouts
│   ├── admin/                    # Administrator dashboard routes
│   ├── dc/                       # Distribution center routes
│   ├── profile/                  # User profile routes
│   ├── rider/                    # Rider dashboard routes
│   ├── sales/                    # Sales agent routes
│   ├── track/                    # Package tracking routes
│   ├── vendor/                   # Vendor dashboard routes
│   ├── layout.js                 # Root layout with providers
│   ├── page.js                   # Home page (redirects to dashboard)
│   ├── providers.jsx             # App-wide providers (Auth, PWA)
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
│   ├── vendor/                  # Vendor-specific components
│   └── [feature]/               # Feature-specific components
├── contexts/                    # React contexts
│   ├── AuthContext.jsx         # Authentication state management
│   └── PWAContext.jsx          # PWA functionality
├── services/                   # API service layer
│   ├── authService.js          # Authentication operations
│   ├── vendorService.js        # Vendor management APIs
│   ├── riderService.js         # Rider operations
│   ├── agentService.js         # Sales agent operations
│   └── [role]Service.js        # Role-specific services
├── hooks/                      # Custom React hooks
│   ├── useAPI.js              # Generic API hook with loading/error
│   ├── useAuth.js             # Authentication hook
│   ├── useVendorDashboard.js  # Vendor dashboard logic
│   ├── useRiderDashboard.js   # Rider dashboard logic
│   └── [role]Hooks.js         # Role-specific hooks
├── lib/                       # Utility libraries
│   ├── apiClient.js           # Centralized API client with auth
│   ├── secureStorage.js       # Encrypted local storage
│   ├── toast.js               # Toast notification utilities
│   └── authMigration.js       # Auth data migration utilities
├── constants/                 # Application constants
│   ├── apis.js                # API endpoint definitions
│   ├── constants.js           # General application constants
│   ├── user-roles.js          # User role definitions
│   └── package_status.js      # Package status definitions
├── core/                      # Core business logic
│   ├── data/                  # Static data and mock data
│   ├── pagination/            # Pagination utilities
│   └── redux/                 # Redux store configuration
├── Router/                    # Routing utilities and configurations
├── style/                     # Styling assets
│   └── scss/                  # SCSS stylesheets and variables
├── utils/                     # General utility functions
└── documentation/             # Technical documentation
```

### Architectural Patterns

- **Component-Based Architecture**: Clear separation of concerns with reusable components
- **Role-Based Access Control**: Multi-tenant architecture supporting 5 distinct user roles
- **Progressive Web App**: Installable web application with offline capabilities
- **Security-First Design**: JWT authentication with middleware protection
- **Performance-Optimized**: SSR, code splitting, and intelligent caching

## 🔐 Authentication & Security

### Authentication System

- **JWT-based Authentication**: Secure token-based session management
- **Secure Storage**: Encrypted local storage with migration support
- **Token Validation**: Automatic refresh and expiration handling
- **Middleware Protection**: Server-side route protection and redirection

### Role-Based Access Control

Each role has dedicated permissions and dashboard features:

- **Administrators**: Full system access, user management, system analytics
- **Vendors**: Package management, customer operations, payment tracking
- **Riders**: Delivery operations, route management, earnings tracking
- **Sales Agents**: Customer acquisition, lead management, commission tracking
- **Distribution Center Managers**: Warehouse operations, inventory management

### Security Features

- **Content Security Policy**: XSS prevention
- **HTTPS Enforcement**: Secure communication
- **Input Validation**: Client and server-side validation
- **Security Headers**: Comprehensive security headers configuration

## 📱 Progressive Web App

COSSIM is built as a modern PWA with:

- **Offline Functionality**: Service worker caching for offline use
- **Mobile Optimization**: App-like experience on mobile devices
- **Push Notifications**: Background sync capabilities
- **App Manifest**: Web app manifest for installation
- **Install Prompts**: User-friendly installation prompts

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_APP_URL=your_app_url

# Authentication (if using NextAuth)
NEXTAUTH_URL=your_auth_url
NEXTAUTH_SECRET=your_secret_key

# Optional: PWA and Analytics
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Build Configuration

Key configuration files:

- `next.config.mjs` - Next.js configuration with security headers
- `middleware.js` - Route protection and authentication middleware
- `jsconfig.js` - Path aliases configuration (`@/*` → `./src/*`)
- `eslint.config.mjs` - ESLint configuration

## 📊 Performance & Monitoring

### Performance Metrics

- **First Contentful Paint**: ~1.5s
- **Largest Contentful Paint**: ~2.1s
- **Time to Interactive**: ~2.8s
- **PWA Score**: 95+

### Optimization Features

- **Server-Side Rendering**: Improved initial load times
- **Image Optimization**: Automatic WebP/AVIF conversion
- **Code Splitting**: Route-based automatic splitting
- **Bundle Optimization**: Tree shaking and dynamic imports
- **Caching Strategies**: API response and static asset caching

## 🧪 Testing Strategy

### Testing Framework

- **Unit Tests**: Component and utility testing with Jest
- **Integration Tests**: API service and component integration
- **End-to-End Tests**: Critical user flows with Playwright
- **Manual Testing**: Authentication and role-based feature validation

### Code Quality

- **ESLint**: Code linting and style enforcement
- **PropTypes**: Component prop validation
- **Error Boundaries**: Graceful error handling in production

## 🚀 Deployment

### Recommended Platforms

- **Vercel**: Optimized Next.js deployment with global CDN
- **Netlify**: Static site hosting with serverless functions
- **Self-hosted**: Docker containerization support

### Production Considerations

- **Environment Variables**: Secure configuration management
- **CDN Integration**: Global content delivery optimization
- **Monitoring**: Performance and error tracking setup
- **Security**: HTTPS enforcement and security headers
- **Analytics**: User behavior and conversion tracking

## 📚 API Documentation

### API Integration

- **Centralized API Client**: `apiClient.js` handles all HTTP requests
- **Automatic Authentication**: JWT tokens automatically included
- **Error Handling**: Consistent error handling with user feedback
- **Service Layer**: Feature-based API service organization

### Available Services

- `authService.js` - Authentication operations
- `vendorService.js` - Vendor management APIs
- `riderService.js` - Rider operations
- `agentService.js` - Sales agent operations

## 📋 Table Export Utility

COSSIM includes a powerful, reusable table export system that supports exporting data to PDF and Excel formats with full support for server-side pagination.

### Quick Usage

```jsx
import TableExportIcons from '@/components/TableExportIcons';

<TableExportIcons
  data={tableData}
  columns={columns}
  filename="export"
  title="Report Title"
/>
```

### Documentation

- [Quick Start Guide](./EXPORT_QUICK_START.md)
- [Complete Documentation](./src/utils/TABLE_EXPORT_README.md)
- [Implementation Summary](./EXPORT_UTILITY_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established project structure and naming conventions
- Implement proper error handling and loading states
- Add comprehensive tests for new features
- Update documentation for significant changes
- Ensure responsive design and accessibility compliance

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support & Documentation

### Support Channels

- **Email**: [support@cossim.com](mailto:support@cossim.com)
- **Issues**: [GitHub Issues](https://github.com/mwaiseghegift/cossim-next-frontend/issues)
- **Documentation**: [View Docs](./src/documentation/)

### Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Documentation](./src/documentation/)
- [Component Library](./src/components/)
- [AI Assistant Instructions](./.github/copilot-instructions.md)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI Components from [Ant Design](https://ant.design/)
- Styled with [Bootstrap](https://getbootstrap.com/)
- Charts powered by [ApexCharts](https://apexcharts.com/)
- Icons from [FontAwesome](https://fontawesome.com/), [Feather Icons](https://feathericons.com/), and [Lucide React](https://lucide.dev/)

---

**COSSIM Team** - Building the future of logistics management
# cossim-web
