'use client';

import React from 'react';

const ClientScrollbars = ({ children, style, ...props }) => {
  return (
    <div style={{ overflowY: 'auto', overflowX: 'hidden', ...style }} {...props}>
      {children}
    </div>
  );
};

export default ClientScrollbars;
