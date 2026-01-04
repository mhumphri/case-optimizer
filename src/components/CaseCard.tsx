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

  return (
    <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* Case ID/Postcode with Route Number */}
      <div className="flex items-center gap-2 mb-3">
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
        <h3 className="text-sm font-semibold text-gray-900">
          📍 {caseData.postcode}
        </h3>
        <span
          className={`ml-auto px-2 py-0.5 text-[10px] font-bold border rounded ${
            PRIORITY_COLORS[caseData.priority]
          }`}
        >
          {caseData.priority.toUpperCase()}
        </span>
      </div>

      {/* Agent Assignment */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Assigned Agent
        </label>
        <div
          className="text-xs font-medium px-2 py-1 rounded inline-block"
          style={{
            backgroundColor: agentLabel ? `${agentColor}20` : '#f3f4f6',
            color: agentLabel ? agentColor : '#6b7280',
          }}
        >
          {agentLabel || 'Unallocated'}
        </div>
      </div>

      {/* Expected Delivery Time */}
      {caseData.deliveryTime && (
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Expected Delivery
          </label>
          <div className="text-xs text-gray-700">
            🕐 {formatTime(caseData.deliveryTime)}
          </div>
        </div>
      )}

      {/* Delivery Time Slot */}
      <TimeSlotInput
        caseId={caseData.id}
        deliverySlot={caseData.deliverySlot}
        onSlotChange={onSlotChange}
      />

      {/* Status and Priority Dropdown */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <div className="text-xs text-gray-700">
            {caseData.status === 'complete' ? '✓ Complete' : '⏱ Pending'}
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
    </div>
  );
};