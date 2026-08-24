'use client'

import { usePathname, useSearchParams } from 'next/navigation'

// Hook that provides React Router useLocation compatibility with Next.js
export const useLocation = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString()

  return {
    pathname,
    // Add other properties that might be used from React Router's useLocation
    search: search ? `?${search}` : '',
    hash: '',
    state: null,
    key: 'default'
  }
}

export default useLocation
