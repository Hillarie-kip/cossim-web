"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SAVendorsRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main vendors page
    router.replace('/sales/vendors');
  }, [router]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Redirecting...</span>
      </div>
    </div>
  );
};

export default SAVendorsRedirect;
