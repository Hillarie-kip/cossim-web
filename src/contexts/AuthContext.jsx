'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { all_routes } from '@/Router/all_routes'
import { userLogout, getToken, isTokenValid } from '@/services/authService'
import { setSelectedDC } from '@/services/dcService'
import secureStorage from '@/lib/secureStorage'
import { initializeAuthMigration } from '@/lib/authMigration'
import PropTypes from 'prop-types'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vendorCategoryCode, setVendorCategoryCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selected-vendor-category') || ''
    }
    return ''
  })
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && vendorCategoryCode !== null && vendorCategoryCode !== undefined) {
      localStorage.setItem('selected-vendor-category', vendorCategoryCode)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('selected-vendor-category')
    }
  }, [vendorCategoryCode])

  useEffect(() => {
    // Run migration on app startup
    initializeAuthMigration()
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const authData = secureStorage.getAuthData()
      if (authData && authData.token) {
        // For backward compatibility, we still need to fetch full user data
        // In a more secure implementation, you'd fetch user data from API
        const userData = localStorage.getItem('cossim-user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          const token = parsedUser?.UserToken

          // Check if token exists and is valid
          if (token && isTokenValid(token)) {
            setUser(parsedUser)
          } else {
            // Token is invalid, clear storage
            secureStorage.clearAuthData()
            localStorage.removeItem('cossim-user')
            document.cookie = 'user-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
          }
        } else {
          // No user data found, clear auth
          secureStorage.clearAuthData()
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      secureStorage.clearAuthData()
      localStorage.removeItem('cossim-user')
      document.cookie = 'user-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    } finally {
      setLoading(false)
    }
  }

  const login = (userData) => {
    const assignedDCs = Array.isArray(userData?.AssignedDistributionCenter) ? userData.AssignedDistributionCenter : []
    if (assignedDCs[0]?.DCCode) setSelectedDC(assignedDCs[0].DCCode)
    setUser(userData)
    // Store user data in localStorage for now (for backward compatibility)
    localStorage.setItem('cossim-user', JSON.stringify(userData))
    // Use secure storage for authentication data
    secureStorage.setAuthData(userData)

    // Set cookie for server-side middleware
    if (userData?.UserToken) {
      document.cookie = `user-token=${userData.UserToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  }

  const logout = async () => {
    try {
      await userLogout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      secureStorage.clearAuthData()
      localStorage.removeItem('cossim-user')
      router.push(all_routes.signin)
    }
  }

  const isAuthenticated = () => {
    return secureStorage.isAuthenticated() && user && user.UserToken && isTokenValid(user.UserToken)
  }

  const getAuthToken = () => {
    return getToken()
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    getToken: getAuthToken,
    loading,
    vendorCategoryCode,
    setVendorCategoryCode
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
