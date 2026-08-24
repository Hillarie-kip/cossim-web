"use client";

import Error500 from "@/components/errorpages/error500";
import PropTypes from "prop-types";

export default function Error({ error, reset }) {
    return <Error500 />;
}


Error.propTypes = {
  error: PropTypes.object.isRequired,
  reset: PropTypes.func.isRequired,
};
