import React, { useState } from 'react';
import type { PriorityChange } from '../types/route';

interface ChangesPanelProps {
  changes: PriorityChange[];
  onRecalculate: () => void;
  onDeleteChange: (caseId: string) => void;
  isRecalculating: boolean;
}

const PRIORITY_COLORS = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

const PRIORITY_LABELS = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

export const ChangesPanel: React.FC<ChangesPanelProps> = ({ 
  changes, 
  onRecalculate,
  onDeleteChange,
  isRecalculating 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (changes.length === 0) return null;

  return (
    <div className="border-t border-gray-300 bg-white shrink-0">
      {/* Changes Summary Row */}
      <div className="px-3 py-2 flex justify-between items-center border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {changes.length} change{changes.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded cursor-pointer hover:bg-gray-200"
        >
          {isExpanded ? '▼ Hide Changes' : '▶ View Changes'}
        </button>
      </div>

      {/* Expandable Changes List */}
      {isExpanded && (
        <div className="max-h-[200px] overflow-y-auto border-b border-gray-200">
          <div className="p-3">
            {changes.map((change, index) => (
              <div 
                key={index}
                className="mb-2 last:mb-0 p-2 bg-gray-50 rounded text-xs border border-gray-200 flex justify-between items-start gap-2"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 mb-1">
                    📍 {change.casePostcode}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${PRIORITY_COLORS[change.oldPriority]}`}>
                      {PRIORITY_LABELS[change.oldPriority]}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`font-medium ${PRIORITY_COLORS[change.newPriority]}`}>
                      {PRIORITY_LABELS[change.newPriority]}
                    </span>
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">
                    {change.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={() => onDeleteChange(change.caseId)}
                  className="shrink-0 p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer border-none bg-transparent transition-colors"
                  title="Restore original priority"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recalculate Button */}
      <div className="p-3">
        <button
          onClick={onRecalculate}
          disabled={isRecalculating}
          className={`w-full px-4 py-3 text-sm font-bold border-none rounded cursor-pointer ${
            isRecalculating
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isRecalculating ? '⏳ Recalculating Routes...' : '🔄 Recalculate Routes'}
        </button>
      </div>
    </div>
  );
};