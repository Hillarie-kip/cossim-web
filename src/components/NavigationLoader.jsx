"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NavigationLoader = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // Listen for route changes
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      handleStart();
      return originalPush.apply(router, args).finally(handleComplete);
    };

    router.replace = (...args) => {
      handleStart();
      return originalReplace.apply(router, args).finally(handleComplete);
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="navigation-loader">
      <div className="loader-bar"></div>
      <style jsx>{`
        .navigation-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
          height: 3px;
          background: transparent;
        }
        
        .loader-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #00d4ff);
          width: 0%;
          animation: progress 0.5s ease-in-out forwards;
        }
        
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default NavigationLoader;
