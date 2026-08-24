import { Lexend } from "next/font/google";
import "./globals.css";
import '@/style/scss/main.scss'
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "COSSIM - Comprehensive Logistics Management Platform",
    template: "%s | COSSIM Dashboard"
  },
  description: "COSSIM is a comprehensive logistics and package management platform built with Next.js. Features multi-role dashboards for administrators, vendors, riders, sales agents, and distribution center managers with real-time tracking, analytics, and management tools.",
  keywords: [
    "logistics management",
    "package tracking",
    "vendor dashboard",
    "rider management",
    "distribution center",
    "sales agent platform",
    "admin dashboard",
    "real-time tracking",
    "analytics",
    "supply chain management"
  ],
  authors: [{ name: "COSSIM Team", url: "https://cossim.com" }],
  creator: "COSSIM Team",
  publisher: "COSSIM",
  category: "Business Application",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" }
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "COSSIM Dashboard",
    startupImage: [
      {
        url: "/favicon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      }
    ]
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  metadataBase: new URL('https://cossim.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cossim.com',
    siteName: 'COSSIM',
    title: 'COSSIM - Comprehensive Logistics Management Platform',
    description: 'Advanced logistics and package management platform with multi-role dashboards, real-time tracking, and comprehensive analytics for efficient supply chain management.',
    images: [
      {
        url: '/favicon.png',
        width: 1200,
        height: 630,
        alt: 'COSSIM Logistics Management Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COSSIM - Comprehensive Logistics Management Platform',
    description: 'Advanced logistics and package management platform with multi-role dashboards and real-time tracking.',
    images: ['/favicon.png'],
    creator: '@cossim'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#dc6545' },
    { media: '(prefers-color-scheme: dark)', color: '#dc6545' }
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={lexend.variable} suppressHydrationWarning={true}>
         <Providers>
          <div id="root">
            {children}
          </div>
        
        <Toaster position="top-right" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}
