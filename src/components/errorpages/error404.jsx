"use client";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "../Link";

const Error404 = () => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <div className="main-wrapper">
      <div className="error-box">
        <div className="error-img">
          <ImageWithBasePath
            src="assets/img/authentication/error-404.png"
            className="img-fluid"
            alt="404 Error"
          />
        </div>
        <h3 className="h2 mb-3">Oops, something went wrong</h3>
        <p>
          Error 404 Page not found. Sorry the page you looking for doesn’t exist
          or has been moved
        </p>
        <Link onClick={goBack} className="btn btn-primary">
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default Error404;
