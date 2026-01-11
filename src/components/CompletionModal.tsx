// components/CompletionModal.tsx
import React from 'react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgents: number;
  totalCases: number;
  allocatedCases: number;
  unallocatedCases: number;
  timeWindow: { start: string; end: string };
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  activeAgents,
  totalCases,
  allocatedCases,
  unallocatedCases,
  timeWindow,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full relative flex flex-col" 
        style={{ maxHeight: '80vh', maxWidth: '320px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="p-6 pb-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Optimization Complete
            </h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 overflow-y-auto flex-1">
          <div className="space-y-0">
            {/* Total Cases */}
            <div className="flex items-center justify-between p-3 py-2 rounded-lg">
              <span className="font-medium text-gray-700">Total Cases</span>
              <span className="text-gray-900">{totalCases}</span>
            </div>

            {/* Allocated Cases */}
            <div className="flex items-center justify-between p-3 py-2 rounded-lg">
              <span className="font-medium text-gray-700">Allocated Cases</span>
              <span className="text-gray-900">{allocatedCases}</span>
            </div>

            {/* Unallocated Cases */}

              <div className="flex items-center justify-between p-3 py-2 rounded-lg">
                <span className="font-medium text-gray-700">Unallocated Cases</span>
                <span className="text-gray-900">{unallocatedCases}</span>
              </div>


            {/* Time Window */}
            <div className="flex items-center justify-between p-3 py-2 rounded-lg">
              <span className="font-medium text-gray-700">Time Window</span>
              <span className="text-gray-900">
                {timeWindow.start} - {timeWindow.end}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button - Fixed at bottom */}
        <div className="p-6 pt-4 pb-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};