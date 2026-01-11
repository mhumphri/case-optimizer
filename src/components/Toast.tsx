// components/Toast.tsx - Enhanced version
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    // Only auto-dismiss for non-error toasts
    if (type !== 'error') {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onClose, duration, type]);

  const bgColor = type === 'error' ? 'bg-red-500' : 
                  type === 'success' ? 'bg-green-500' : 
                  'bg-blue-500';

  return (
    <>
      {/* Invisible backdrop for click-outside-to-close */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div 
          className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 max-w-md`}
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'error' && (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
          {type === 'success' && (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
          <div className="flex-1 text-sm font-medium break-words">
            {message}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white hover:text-gray-200 transition-colors"
            aria-label="Close notification"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};