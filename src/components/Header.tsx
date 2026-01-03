import React from 'react';

export const Header: React.FC = () => {
  return (
    <>
      {/* Header with Logo and Title */}
      <div className="flex items-center gap-2 px-5 py-4 shrink-0">
        <img 
          src="/A2BLogo.png" 
          alt="A2B Logo" 
          className="h-[40px] w-auto"
        />
        <h1 className="m-0 text-2xl font-semibold text-gray-800">
          Case Manager
        </h1>
      </div>
      
      {/* Full Width Border */}
      <div className="border-b border-gray-300 shrink-0" />
    </>
  );
};