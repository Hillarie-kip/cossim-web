import React from "react";
import PropTypes from "prop-types";
import CountUp from "react-countup";

export default function DashCard({ title, value, icon, className, textColor }) {
    return (
        <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className={`dash-count w-100 ${className}`}>
                <div className="dash-counts">
                    <h4>
                        <CountUp start={0} end={value} duration={3} className={`text-${textColor || "dark"}`} />
                    </h4>
                    <h5 className={`text-${textColor || "dark"}`}>{title}</h5>
                </div>
                <div className="dash-imgs">
                    <span>
                        {icon}
                    </span>
                </div>
            </div>
        </div>
    );
}

DashCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    icon: PropTypes.string.isRequired,
    className: PropTypes.string,
    textColor: PropTypes.string
};
