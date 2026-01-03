import React, { useState, useEffect } from 'react';
import type { CaseChange, PriorityChange, TimeSlotChange } from '../types/route';

interface ChangesPanelProps {
  changes: CaseChange[];
  onRecalculate: () => void;
  onDeleteChange: (caseId: string, changeType: 'priority' | 'slot') => void;
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

  // Auto-collapse when recalculation starts
  useEffect(() => {
    if (isRecalculating) {
      setIsExpanded(false);
    }
  }, [isRecalculating]);

  // Show panel if there are changes OR if recalculating
  if (changes.length === 0 && !isRecalculating) return null;

  return (
    <div className="border-t border-gray-300 bg-white shrink-0">
      {/* Changes Summary Row */}
      <div className="px-3 py-2 flex justify-between items-center border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {isRecalculating && changes.length === 0 
            ? 'Recalculating...' 
            : `${changes.length} change${changes.length !== 1 ? 's' : ''}`
          }
        </span>
        {changes.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isRecalculating}
            className={`px-3 py-1 text-xs font-medium border border-gray-300 rounded cursor-pointer ${
              isRecalculating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isExpanded ? '▼ Hide Changes' : '▶ View Changes'}
          </button>
        )}
      </div>

      {/* Expandable Changes List */}
      {isExpanded && changes.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto border-b border-gray-200">
          <div className="p-3">
            {changes.map((change, index) => {
              // Type guard for PriorityChange
              const isPriorityChange = 'oldPriority' in change;
              
              return (
                <div 
                  key={index}
                  className="mb-2 last:mb-0 p-2 bg-gray-50 rounded text-xs border border-gray-200 flex justify-between items-start gap-2"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      📍 {change.casePostcode}
                    </div>
                    
                    {isPriorityChange ? (
                      // Priority Change Display
                      <div>
                        <div className="text-[10px] text-gray-500 mb-0.5">Priority</div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${PRIORITY_COLORS[(change as PriorityChange).oldPriority]}`}>
                            {PRIORITY_LABELS[(change as PriorityChange).oldPriority]}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`font-medium ${PRIORITY_COLORS[(change as PriorityChange).newPriority]}`}>
                            {PRIORITY_LABELS[(change as PriorityChange).newPriority]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Time Slot Change Display
                      <div>
                        <div className="text-[10px] text-gray-500 mb-0.5">Delivery Slot</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            {(change as TimeSlotChange).oldSlot 
                              ? `${(change as TimeSlotChange).oldSlot!.startTime}-${(change as TimeSlotChange).oldSlot!.endTime}`
                              : 'None'
                            }
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-blue-600">
                            {(change as TimeSlotChange).newSlot 
                              ? `${(change as TimeSlotChange).newSlot!.startTime}-${(change as TimeSlotChange).newSlot!.endTime}`
                              : 'None'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-gray-500 text-[10px] mt-1">
                      {change.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteChange(change.caseId, isPriorityChange ? 'priority' : 'slot')}
                    disabled={isRecalculating}
                    className={`shrink-0 p-1.5 rounded border-none transition-colors ${
                      isRecalculating
                        ? 'text-gray-300 cursor-not-allowed bg-transparent'
                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer bg-transparent'
                    }`}
                    title={isRecalculating ? 'Cannot delete while recalculating' : 'Restore original value'}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
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