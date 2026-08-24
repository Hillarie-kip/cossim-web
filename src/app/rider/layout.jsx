import React from 'react'
import Loader from '@/components/loader/loader'
import Header from '@/components/Sidebar/Header'
import RiderSidebar from '@/components/Sidebar/RiderSidebar'
import AuthGuard from '@/components/AuthGuard'
import RoleGuard from '@/components/RoleGuard'
import { RoleType } from '@/constants/user-roles'
import PropTypes from 'prop-types'

export default function RiderDashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <RoleGuard 
        allowedRoles={[RoleType.ADMIN, RoleType.RIDER]}
      >
        <div className={`main-wrapper`}>
            <Header />
            <RiderSidebar />
            <div className="page-wrapper">
              {children}
            </div>
            <Loader />
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}

RiderDashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
