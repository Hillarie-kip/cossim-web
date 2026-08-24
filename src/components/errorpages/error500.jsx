import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "../Link";


const Error500 = () => {
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
          Server Error 500. We apologise and are fixing the problem Please try
          again at a later stage
        </p>
        <Link onClick={goBack} className="btn btn-primary">
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default Error500;
