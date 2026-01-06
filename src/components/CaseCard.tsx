import React from 'react';
import type { CaseData, CasePriority, TimeSlot } from '../types/route';
import { formatTime, formatTimeWithoutSeconds } from '../utils/formatters';
import { TimeSlotInput } from './TimeSlotInput';

interface CaseCardProps {
  caseData: CaseData;
  agentLabel: string | null;
  agentColor: string;
  routeNumber: number | null;
  unallocatedNumber: number | null;
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
  onSlotChange: (caseId: string, slot: TimeSlot | undefined) => void;
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

export const CaseCard: React.FC<CaseCardProps> = ({
  caseData,
  agentLabel,
  agentColor,
  routeNumber,
  unallocatedNumber,
  onPriorityChange,
  onSlotChange,
}) => {
  const isHighPriority = caseData.priority === 'high';

  // Format agent label - extract just "Agent X" from "Agent X (postcode)"
  const formattedAgentLabel = agentLabel 
    ? agentLabel.split(' (')[0] // Remove postcode part
    : 'Unallocated';

  return (
    <div className={`p-4 bg-white rounded-lg shadow-sm ${
      isHighPriority ? 'border-2 border-red-500' : 'border border-gray-300'
    }`}>
      {/* Header Row: Postcode with Icon (LHS) and Circle + Agent Label (RHS) */}
      <div className="flex items-center justify-between mb-3">
        {/* Postcode with clipboard icon on LHS */}
        <div className="flex items-center gap-2">
          <svg 
            width="16" 
            height="16" 
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
          <span className="text-sm font-semibold text-gray-900">
            {caseData.postcode}
          </span>
        </div>

        {/* Circle + Agent Label on RHS */}
        <div className="flex items-center gap-2">
          {/* Route/Unallocated Number Circle */}
          {routeNumber !== null && (
            <div className="relative shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ 
                  backgroundColor: agentColor,
                  ...(isHighPriority ? {
                    border: '3px solid white',
                    outlineWidth: '2px',
                    outlineStyle: 'solid',
                    outlineColor: agentColor,
                  } : {})
                }}
              >
                {routeNumber}
              </div>
              {isHighPriority && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                  !
                </div>
              )}
            </div>
          )}
          {unallocatedNumber !== null && (
            <div className="relative shrink-0">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-600"
                style={{
                  ...(isHighPriority ? {
                    border: '3px solid white',
                    outlineWidth: '2px',
                    outlineStyle: 'solid',
                    outlineColor: '#6b7280',
                  } : {})
                }}
              >
                {unallocatedNumber}
              </div>
              {isHighPriority && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                  !
                </div>
              )}
            </div>
          )}
          
          {/* Agent Label - regular color */}
          <span className="text-sm font-semibold text-gray-900">
            {formattedAgentLabel}
          </span>
        </div>
      </div>

      {/* Arrival Time and Priority Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex flex-col justify-center">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Arrival Time
          </label>
          <div className="text-xs text-gray-700">
            {caseData.deliveryTime ? (
              <>
                🕐 {formatTimeWithoutSeconds(caseData.deliveryTime)} ({caseData.status === 'complete' ? 'complete' : 'pending'})
              </>
            ) : (
              <span className="text-gray-400">Not scheduled</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Priority
          </label>
          <select
            value={caseData.priority}
            onChange={(e) =>
              onPriorityChange(caseData.id, e.target.value as CasePriority)
            }
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Time Slot - moved to bottom */}
      <TimeSlotInput
        caseId={caseData.id}
        deliverySlot={caseData.deliverySlot}
        onSlotChange={onSlotChange}
      />
    </div>
  );
};
