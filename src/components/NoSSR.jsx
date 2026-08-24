"use client"

import { useState, useEffect } from 'react';

const NoSSR = ({ children, fallback = null }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return fallback;
  }

  return children;
};

export default NoSSR;
