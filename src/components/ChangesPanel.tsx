// components/ChangesPanel.tsx

import React, { useState, useEffect } from 'react';
import type { CaseChange, PriorityChange, TimeSlotChange, AgentChange } from '../types/route';

interface ChangesPanelProps {
  caseChanges: CaseChange[];
  agentChanges: AgentChange[];
  onRecalculate: () => void;
  onDeleteCaseChange: (caseId: string, changeType: 'priority' | 'slot') => void;
  onDeleteAgentChange: (agentIndex: number) => void;
  isRecalculating: boolean;
}

// Colors for different agents (same as RouteMap and RouteDetails)
const ROUTE_COLORS = [
  '#4285f4', // Blue
  '#ea4335', // Red
  '#fbbc04', // Yellow
  '#34a853', // Green
  '#ff6d00', // Orange
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#e91e63', // Pink
];

// Create agent icon SVG as data URL
const createAgentIcon = (color: string): string => {
  const svg = `
    <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(20, 21) scale(0.8)">
        <path d="M-6 -8 A 6 6 0 1 1 6 -8 A 6 6 0 1 1 -6 -8 Z" fill="white"/>
        <path d="M -10 8 Q -10 0, -6 -2 L 6 -2 Q 10 0, 10 8 Z" fill="white"/>
      </g>
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
};

const PRIORITY_LABELS = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

export const ChangesPanel: React.FC<ChangesPanelProps> = ({ 
  caseChanges,
  agentChanges,
  onRecalculate,
  onDeleteCaseChange,
  onDeleteAgentChange,
  isRecalculating 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalChanges = caseChanges.length + agentChanges.length;

  // Auto-collapse when recalculation starts
  useEffect(() => {
    if (isRecalculating) {
      setIsExpanded(false);
    }
  }, [isRecalculating]);

  // Show panel if there are changes OR if recalculating
  if (totalChanges === 0 && !isRecalculating) return null;

  return (
    <div className="border border-x-0 border-b-0 border-gray-300 bg-white shrink-0 rounded-t-xl flex flex-col max-h-full">
      {/* Changes Summary Row */}
      <div className="px-3 py-3 flex justify-between items-center border-b border-gray-200 shrink-0">
        <span className="text-sm font-medium text-gray-700">
          {isRecalculating && totalChanges === 0 
            ? 'Recalculating...' 
            : `${totalChanges} change${totalChanges !== 1 ? 's' : ''}`
          }
        </span>
        {totalChanges > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isRecalculating}
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
              isRecalculating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300'
                : isExpanded
                  ? 'bg-transparent text-gray-500 border border-blue-500 hover:bg-gray-50'
                  : 'bg-blue-500 text-white border-none hover:bg-blue-600'
            }`}
          >
            {isExpanded ? 'Hide Changes' : 'View Changes'}
          </button>
        )}
      </div>

      {/* Expandable Changes List - Scrollable with flex-1 */}
      {isExpanded && totalChanges > 0 && (
        <div 
          className="flex-1 overflow-y-auto border-b border-gray-200 min-h-0"
          style={{ marginTop: '2px' }} // 2px gap from the summary row
        >
          <div className="p-3">
            {/* Agent Changes */}
            {agentChanges.map((change, index) => {
              const agentColor = ROUTE_COLORS[change.agentIndex % ROUTE_COLORS.length];
              const agentName = change.agentLabel.split(' (')[0]; // Remove postcode part
              
              return (
                <div 
                  key={`agent-${index}`}
                  className="mb-2 last:mb-0 p-2 bg-blue-50 rounded text-xs border border-blue-200 flex justify-between items-start gap-2"
                >
                  <div className="flex-1">
                    {/* Agent icon and name */}
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={createAgentIcon(agentColor)} 
                        alt={agentName}
                        className="w-7 h-7"
                      />
                      <div className="font-semibold text-gray-800">
                        {agentName}
                      </div>
                    </div>
                    
                    <div>
                      {/* Show active/inactive change if it changed */}
                      {change.oldSettings.active !== change.newSettings.active && (
                        <>
                          <div className="text-[10px] text-gray-500 mb-0.5">Status</div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">
                              {change.oldSettings.active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-gray-800">
                              {change.newSettings.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Show work hours change if it changed */}
                      {(change.oldSettings.startTime !== change.newSettings.startTime || 
                        change.oldSettings.endTime !== change.newSettings.endTime) && (
                        <>
                          <div className="text-[10px] text-gray-500 mb-0.5">Work Hours</div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">
                              {change.oldSettings.startTime}-{change.oldSettings.endTime}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-gray-800">
                              {change.newSettings.startTime}-{change.newSettings.endTime}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Show lunch break change if it changed */}
                      {change.oldSettings.lunchDuration !== change.newSettings.lunchDuration && (
                        <>
                          <div className="text-[10px] text-gray-500 mb-0.5">Lunch Break</div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {change.oldSettings.lunchDuration} min
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-gray-800">
                              {change.newSettings.lunchDuration} min
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="text-gray-500 text-[10px] mt-1">
                      {change.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteAgentChange(change.agentIndex)}
                    disabled={isRecalculating}
                    className={`shrink-0 flex items-center gap-1 text-[10px] rounded border-none transition-colors p-1.5 ${
                      isRecalculating
                        ? 'text-gray-300 cursor-not-allowed bg-transparent'
                        : 'text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent'
                    }`}
                    title={isRecalculating ? 'Cannot delete while recalculating' : 'Restore original settings'}
                  >
                    <span>Delete</span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Case Changes */}
            {caseChanges.map((change, index) => {
              // Type guard for PriorityChange
              const isPriorityChange = 'oldPriority' in change;
              
              return (
                <div 
                  key={`case-${index}`}
                  className="mb-2 last:mb-0 p-2 bg-gray-50 rounded text-xs border border-gray-200 flex justify-between items-start gap-2"
                >
                  <div className="flex-1">
                    {/* Postcode with clipboard icon */}
                    <div className="flex items-center gap-2 mb-1">
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="text-gray-600"
                      >
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                      </svg>
                      <div className="font-semibold text-gray-800">
                        {change.casePostcode}
                      </div>
                    </div>
                    
                    {isPriorityChange ? (
                      // Priority Change Display
                      <div>
                        <div className="text-[10px] text-gray-500 mb-0.5">Priority</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {PRIORITY_LABELS[(change as PriorityChange).oldPriority]}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-gray-800">
                            {PRIORITY_LABELS[(change as PriorityChange).newPriority]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Time Slot Change Display
                      <div>
                        <div className="text-[10px] text-gray-500 mb-0.5">Delivery Slot</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {(change as TimeSlotChange).oldSlot 
                              ? `${(change as TimeSlotChange).oldSlot!.startTime}-${(change as TimeSlotChange).oldSlot!.endTime}`
                              : 'None'
                            }
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium text-gray-800">
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
                    onClick={() => onDeleteCaseChange(change.caseId, isPriorityChange ? 'priority' : 'slot')}
                    disabled={isRecalculating}
                    className={`shrink-0 flex items-center gap-1 text-[10px] rounded border-none transition-colors p-1.5 ${
                      isRecalculating
                        ? 'text-gray-300 cursor-not-allowed bg-transparent'
                        : 'text-gray-500 hover:text-gray-700 cursor-pointer bg-transparent'
                    }`}
                    title={isRecalculating ? 'Cannot delete while recalculating' : 'Restore original value'}
                  >
                    <span>Delete</span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recalculate Button - Always visible at bottom */}
      <div className="p-3 shrink-0">
        <button
          onClick={onRecalculate}
          disabled={isRecalculating}
          className={`w-full px-4 py-3 text-base font-semibold border-none rounded cursor-pointer ${
            isRecalculating
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {isRecalculating ? '◐ Recalculating Routes...' : '↻ Recalculate Routes'}
        </button>
      </div>
    </div>
  );
};