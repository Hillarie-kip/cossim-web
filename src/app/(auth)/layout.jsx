import React from 'react'
import AuthGuard from '@/components/AuthGuard'
import PropTypes from 'prop-types'

function AuthLayout({ children }) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="main-wrapper">
        <div className="account-content">
          <div className="login-wrapper login-new">
            <div className="container">
              {children}
              <div className="my-4 d-flex justify-content-center align-items-center copyright-text">
                <p>Copyright © 2025 Cossim. All rights reserved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default AuthLayout

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired
}
