"use client"
import React from 'react'
import Loader from '@/components/loader/loader'
import Header from '@/components/Sidebar/Header'
import AuthGuard from '@/components/AuthGuard'
import RoleGuard from '@/components/RoleGuard'
import { RoleType } from '@/constants/user-roles'
import PropTypes from 'prop-types'
import SalesAgentSidebar from '@/components/Sidebar/SalesAgentSidebar'

export default function SalesAgentDashboardLayout({ children }) {
  return (
    <AuthGuard requireAuth={true}>
      <RoleGuard 
        allowedRoles={[RoleType.ADMIN, RoleType.SALES_AGENT, RoleType.SALES_MANAGER]}
      >
        <div className={`main-wrapper`}>
            <Header />
            <SalesAgentSidebar />
            <div className="page-wrapper">
                {children}
            </div>
            <Loader />
          </div>
      </RoleGuard>
    </AuthGuard>
  )
}
SalesAgentDashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
