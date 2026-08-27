'use client'

import React from 'react'
import PropTypes from 'prop-types'
import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext'
import { PWAProvider } from '@/contexts/PWAContext'
import AppInstallPopup from '@/components/AppInstallPopup'
        
export function Providers({ children }) {
  return (
      <PrimeReactProvider>
        <PWAProvider>
          <AuthProvider>
            <GlobalFiltersProvider>
              {children}
              <AppInstallPopup />
            </GlobalFiltersProvider>
          </AuthProvider>
        </PWAProvider>
      </PrimeReactProvider>
  )
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
}
