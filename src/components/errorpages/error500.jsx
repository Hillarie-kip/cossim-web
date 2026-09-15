import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "../Link";


const Error500 = ({ onRetry } = {}) => {
    const router = useRouter();
  
    const goBack = () => {
      router.back();
    };

  return (
    <div className="main-wrapper">
      <div className="error-box">
        <div className="error-img">
          <ImageWithBasePath
            src="assets/img/authentication/error-500.png"
            className="img-fluid"
            alt="img"
          />
        </div>
        <h3 className="h2 mb-3">Oops, something went wrong</h3>
        <p>
          We couldn’t load this page. Reload to get the latest version, or try again shortly.
        </p>
        <div className="d-flex justify-content-center flex-wrap gap-2">
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">Reload page</button>
        {onRetry && <button type="button" onClick={onRetry} className="btn btn-outline-primary">Try again</button>}
        <Link onClick={goBack} className="btn btn-outline-secondary">
          Go Back
        </Link>
        </div>
      </div>
    </div>
  );
};

export default Error500;
