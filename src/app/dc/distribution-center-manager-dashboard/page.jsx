import React from 'react'

export default function DistributionCenterManagerDashboard() {
	return (
		<div className="page-wrapper">
			<div className="content">
				<div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
					<div className="mb-3">
						<h1 className="mb-1">Welcome, Admin</h1>
						<p className="fw-medium">You have <span className="text-primary fw-bold">200+</span> Orders, Today</p>
					</div>
					<div className="input-icon-start position-relative mb-3">
						<span className="input-icon-addon fs-16 text-gray-9">
							<i className="ti ti-calendar"></i>
						</span>
						<input type="text" className="form-control date-range bookingrange" placeholder="Search Product" />
					</div>
				</div>
			</div>
		</div>
	)
}
