"use client";
import ImageWithBasePath from "@/core/img/imagewithbasebath";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "../Link";

const ComingSoon = () => {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <div className="main-wrapper">
      <div className="error-box">
        <div className="error-img">
          <ImageWithBasePath
            src="assets/img/authentication/under-maintenance.png"
            className="img-fluid"
            alt="Coming Soon"
          />
        </div>
        <h3 className="h2 mb-3">Coming Soon</h3>
        <p>
          This feature is currently under development and will be available soon.
          We're working hard to bring you the best experience.
        </p>
        <Link onClick={goBack} className="btn btn-primary">
          Go Back
        </Link>
      </div>
    </div>
  );
};

export default ComingSoon;
