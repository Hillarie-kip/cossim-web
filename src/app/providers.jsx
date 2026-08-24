'use client'

import React from 'react'
import PropTypes from 'prop-types'
import { PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from '@/contexts/AuthContext'
import { GlobalFiltersProvider } from '@/contexts/GlobalFiltersContext'
        
export function Providers({ children }) {
  return (
      <PrimeReactProvider>
        <AuthProvider>
          <GlobalFiltersProvider>
            {children}
          </GlobalFiltersProvider>
        </AuthProvider>
      </PrimeReactProvider>
  )
}

Providers.propTypes = {
  children: PropTypes.node.isRequired,
}
