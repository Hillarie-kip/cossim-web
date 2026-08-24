'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { all_routes } from '@/Router/all_routes'
import PropTypes from 'prop-types'

const AuthGuard = ({ children, requireAuth = true, fallbackPath = null }) => {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated()) {
        // Redirect to signin if authentication is required but user is not authenticated
        router.push(fallbackPath || all_routes.signin)
      } else if (!requireAuth && isAuthenticated()) {
        router.push('/')
      }
    }
  }, [isAuthenticated, loading, requireAuth, router, fallbackPath])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // For protected routes, only render children if authenticated
  if (requireAuth && !isAuthenticated()) {
    return null // Will redirect to signin
  }

  // For public routes (like signin), only render if not authenticated
  if (!requireAuth && isAuthenticated()) {
    return null // Will redirect to dashboard
  }

  return children
}

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
  requireAuth: PropTypes.bool,
  fallbackPath: PropTypes.string,
}

export default AuthGuard
