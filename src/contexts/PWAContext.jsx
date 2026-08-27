'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const PWAContext = createContext(null)

const isStandaloneMode = () => typeof window !== 'undefined' && (
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
)

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsInstalled(isStandaloneMode())
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent))

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('Service worker registration failed:', error)
      })
    }

    const capturePrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    const handleInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', capturePrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice
  }, [deferredPrompt])

  const value = useMemo(() => ({
    canInstall: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    installApp,
  }), [deferredPrompt, installApp, isInstalled, isIOS])

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>
}

PWAProvider.propTypes = { children: PropTypes.node.isRequired }

export const usePWA = () => {
  const context = useContext(PWAContext)
  if (!context) throw new Error('usePWA must be used within PWAProvider')
  return context
}
