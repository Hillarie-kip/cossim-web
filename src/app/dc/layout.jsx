import React from 'react'
import Loader from '@/components/loader/loader'
import Header from '@/components/Sidebar/Header'
import DistributionCenterManagerSidebar from '@/components/Sidebar/DistributionCenterManagerSidebar'
import AuthGuard from '@/components/AuthGuard'
import RoleGuard from '@/components/RoleGuard'
import { RoleType } from '@/constants/user-roles'
import PropTypes from 'prop-types'
import MobileTaskNavigation from '@/components/MobileTaskNavigation/MobileTaskNavigation'

export default function DistributionCenterDashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <RoleGuard 
        allowedRoles={[
          RoleType.DC_OPERATOR, 
          RoleType.PACKAGE_HANDLER,
          RoleType.ADMIN
        ]}
      >
        <div className={`main-wrapper`}>
            <Header />
            <DistributionCenterManagerSidebar />
            <div className="page-wrapper mobile-task-page-wrapper">
                {children}
            </div>
            <MobileTaskNavigation />
            <Loader />
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}
DistributionCenterDashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
