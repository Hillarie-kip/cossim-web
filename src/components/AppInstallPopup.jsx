'use client'

import React, { useEffect, useState } from 'react'
import FeatherIcon from 'feather-icons-react'
import { usePWA } from '@/contexts/PWAContext'
import styles from './AppInstallPopup.module.css'

const DISMISSED_KEY = 'cossim-install-prompt-dismissed'

export default function AppInstallPopup() {
  const { canInstall, isInstalled, isIOS, installApp } = usePWA()
  const [visible, setVisible] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    if (isInstalled || (!canInstall && !isIOS)) return
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0)
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    const timer = window.setTimeout(() => setVisible(true), 1500)
    return () => window.clearTimeout(timer)
  }, [canInstall, isIOS, isInstalled])

  if (!visible || isInstalled) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  const handleInstall = async () => {
    if (canInstall) {
      const result = await installApp()
      if (result?.outcome === 'accepted') setVisible(false)
      return
    }
    setShowInstructions(true)
  }

  return (
    <aside className={styles.popup} aria-label="Install COSSIM app" role="dialog">
      <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss install prompt">
        <FeatherIcon icon="x" size={18} />
      </button>
      <img src="/icons/icon-192.png" alt="" className={styles.icon} />
      <div className={styles.copy}>
        <strong>Install COSSIM</strong>
        <span>Faster access and a full-screen mobile workspace.</span>
        {showInstructions && <small>On iPhone or iPad: tap Share, then “Add to Home Screen”.</small>}
      </div>
      <button type="button" className={styles.install} onClick={handleInstall}>
        <FeatherIcon icon="download" size={16} /> Install
      </button>
    </aside>
  )
}
