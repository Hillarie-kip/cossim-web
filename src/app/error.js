"use client";

import Error500 from "@/components/errorpages/error500";
import PropTypes from "prop-types";
import { useEffect } from "react";

export default function Error({ error, reset }) {
    useEffect(() => { console.error("Page failed to load:", error); }, [error]);
    return <Error500 onRetry={reset} />;
}


Error.propTypes = {
  error: PropTypes.object.isRequired,
  reset: PropTypes.func.isRequired,
};
