"use client";
import React from 'react'
import PropTypes from 'prop-types'

export default function VendorPageHeader({ title, subtitle, actions }) {

  return (
    <div className="page-header">
      <div className="add-item d-flex align-items-center w-100">
        <div className="page-title">
          <h4>{title}</h4>
          {subtitle && <h6 className="text-muted">{subtitle}</h6>}
        </div>
        {actions && <div className="ms-auto">{actions}</div>}
      </div>
    </div>
  )
}

VendorPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
}
