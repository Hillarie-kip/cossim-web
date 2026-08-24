import React from 'react'
import { Card } from 'react-bootstrap'
import PropTypes from 'prop-types'
import Link from '../Link'

export default function StatsCard({ title, value, icon, comparison, comparedTo, viewAllLink }) {
    return (
        <Card className="card revenue-widget flex-fill">
            <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                    <div>
                        <h4 className="mb-1 custome-heading">{value}</h4>
                        <p>{title}</p>
                    </div>
                    <span className="revenue-icon bg-cyan-transparent text-cyan">
                        <i className={`${icon} fs-16`}></i>
                    </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">
                        <span className="fs-13 fw-bold text-success">{comparison}</span> vs {comparedTo}
                    </p>
                    <Link
                        className="text-decoration-underline fs-13 fw-medium"
                        href={viewAllLink}
                    >
                        View All
                    </Link>
                </div>
            </div>
        </Card>
    )
}

StatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    comparison: PropTypes.string,
    comparedTo: PropTypes.string,
    viewAllLink: PropTypes.string
}
