import React from 'react'
import Loader from '@/components/loader/loader'
import Header from '@/components/Sidebar/Header'
import VendorSidebar from '@/components/Sidebar/VendorSidebar'
import AuthGuard from '@/components/AuthGuard'
import RoleGuard from '@/components/RoleGuard'
import { RoleType } from '@/constants/user-roles'
import PropTypes from 'prop-types'

export default function VendorDashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <RoleGuard 
        allowedRoles={[RoleType.ADMIN, RoleType.VENDOR]}
      >
        <div className={`main-wrapper`}>
            <Header />
            <VendorSidebar />
            <div className="page-wrapper">
                <div className="content container-fluid">
                  {children}
                </div>
            </div>
            <Loader />
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}
VendorDashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
