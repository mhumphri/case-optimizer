import React from 'react';
import type { CaseData, CasePriority, TimeSlot } from '../types/route';
import { formatTime } from '../utils/formatters';
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

// Format time without seconds
const formatTimeWithoutSeconds = (timestamp: string | { seconds: number } | any): string => {
  try {
    let date: Date;
    
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
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
    <div className={`p-4 bg-white border-2 rounded-lg shadow-sm ${
      isHighPriority ? 'border-red-500' : 'border-gray-300'
    }`}>
      {/* Header Row: Circle + Agent Label (LHS) and Postcode (RHS) */}
      <div className="flex items-center justify-between mb-3">
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

        {/* Postcode on RHS */}
        <div className="text-sm font-semibold text-gray-900">
          📍 {caseData.postcode}
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
