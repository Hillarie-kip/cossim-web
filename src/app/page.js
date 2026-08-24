'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAvailableDashboards, getPrimaryDashboardRoute, getDashboardPreference } from '@/utils/roleMapping'
import DashboardSelectionModal from '@/components/modals/DashboardSelectionModal'
import toast from 'react-hot-toast'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [availableDashboards, setAvailableDashboards] = useState([])
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const handleRedirection = async () => {
      // Wait for auth to load
      if (authLoading) {
        return
      }

      // If not authenticated, redirect to signin
      if (!isAuthenticated()) {
        router.replace('/signin')
        return
      }

      // If authenticated, redirect based on user role
      if (user?.AssignedRoles && user.AssignedRoles.length > 0) {
        setRedirecting(true)

        try {
          const assignedRoles = user.AssignedRoles

          // Get available dashboards for user
          const dashboards = getAvailableDashboards(assignedRoles)

          if (dashboards.length === 0) {
            toast.error("No accessible dashboards found for your roles.")
            router.replace('/signin')
            return
          }

          if (dashboards.length === 1) {
            // Single dashboard, redirect directly
            const dashboard = dashboards[0]
            toast.success(`Redirecting to ${dashboard.displayName}`)
            router.replace(dashboard.route)
            return
          }

          // Multiple dashboards available, check for stored preference
          const storedPreference = getDashboardPreference()
          if (storedPreference) {
            const isValidPreference = dashboards.some(d => d.route === storedPreference)
            if (isValidPreference) {
              const preferredDashboard = dashboards.find(d => d.route === storedPreference)
              router.replace(storedPreference)
              return
            }
          }

          // Get primary dashboard based on role priority
          const primaryRoute = getPrimaryDashboardRoute(assignedRoles)
          if (primaryRoute) {
            router.replace(primaryRoute)
            return
          }

          // Multiple options with equal priority, show selection modal
          setAvailableDashboards(dashboards)
          setShowDashboardModal(true)
          setRedirecting(false)

        } catch (error) {
          console.error('Error during dashboard redirection:', error)
          toast.error("Failed to determine dashboard access. Redirecting to default.")
          router.replace('/admin/dashboard')
        } finally {
          // Don't set redirecting to false here if we're showing modal
          if (!showDashboardModal) {
            setRedirecting(false)
          }
        }
        return
      }

      // Fallback to default dashboard for users without role info
      router.replace('/admin/dashboard')
    }

    handleRedirection()
  }, [authLoading, user, isAuthenticated, router, showDashboardModal])

  const handleDashboardSelection = async (selectedDashboard) => {
    try {
      setRedirecting(true)

      // Store user preference for future logins
      const { storeDashboardPreference } = await import('@/utils/roleMapping')
      storeDashboardPreference(selectedDashboard.route)

      // Close modal
      setShowDashboardModal(false)

      // Redirect to selected dashboard
      toast.success(`Redirecting to ${selectedDashboard.displayName}`)
      router.replace(selectedDashboard.route)

    } catch (error) {
      console.error('Error during dashboard selection:', error)
      toast.error("Failed to redirect to dashboard. Please try again.")
      setRedirecting(false)
    }
  }

  const closeDashboardModal = () => {
    setShowDashboardModal(false)
    setRedirecting(false)
    // If user closes modal without selecting, redirect to default
    if (availableDashboards.length > 0) {
      router.replace(availableDashboards[0].route)
    }
  }

  // Show loading spinner while determining redirection
  if (authLoading || redirecting || (isAuthenticated() && !showDashboardModal)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="alert">
          <span className="visually-hidden">
            {authLoading ? "Loading..." : "Redirecting to your dashboard..."}
          </span>
        </div>
      </div>
    )
  }

  // Render dashboard selection modal if needed
  return (
    <DashboardSelectionModal
      show={showDashboardModal}
      onHide={closeDashboardModal}
      dashboards={availableDashboards}
      onSelectDashboard={handleDashboardSelection}
      loading={redirecting}
    />
  )
}
