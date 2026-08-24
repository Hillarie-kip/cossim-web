'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import PropTypes from 'prop-types'

const LogoutButton = ({ className = "btn btn-outline-danger", children = "Logout" }) => {
  const { logout } = useAuth()

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <button 
      className={className} 
      onClick={handleLogout}
      type="button"
    >
      {children}
    </button>
  )
}

LogoutButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
}

export default LogoutButton
