import React from "react";

export default function PageContainer({ children, className = "" }) {
  return (
    <div className={`w-full max-w-7xl mx-auto px-0 ${className}`}>
      {children}
    </div>
  );
}
