import React from 'react'
import Header from '@/components/Sidebar/Header'
import Sidebar from '@/components/Sidebar/Sidebar'
import AuthGuard from '@/components/AuthGuard'
import RoleGuard from '@/components/RoleGuard'
import { RoleType } from '@/constants/user-roles'
import PropTypes from 'prop-types'

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <RoleGuard 
        allowedRoles={[
          RoleType.ADMIN, 
          RoleType.FINANCE, 
          RoleType.SALES_MANAGER
        ]}
      >
        <div className={`main-wrapper`}>
            <Header />
            <Sidebar />
            <div className="page-wrapper">
              {children}
            </div>
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
