import React from 'react';

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, showReset = false }) => {
  return (
    <>
      {/* Header with Logo and Title */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img 
            src="/A2BLogo.png" 
            alt="A2B Logo" 
            className="h-[40px] w-auto shrink-0"
          />
          <h1 className="m-0 text-2xl font-semibold text-gray-800 truncate">
            Case Manager
          </h1>
        </div>
        {showReset && (
          <button
            onClick={onReset}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2 shrink-0 ml-4"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Reset
          </button>
        )}
      </div>
      
      {/* Full Width Border */}
      <div className="border-b border-gray-300 shrink-0" />
    </>
  );
};