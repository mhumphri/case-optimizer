import React from 'react';
import type { CaseData, CasePriority } from '../types/route';

interface CaseCardProps {
  caseData: CaseData;
  agentLabel: string | null;
  agentColor: string;
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
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
  onPriorityChange 
}) => {
  return (
    <div className="bg-white rounded-lg p-3 mb-3 border border-gray-300 shadow-sm">
      {/* Case ID/Postcode */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="m-0 text-sm font-semibold text-gray-800">
          📍 {caseData.postcode}
        </h4>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_COLORS[caseData.priority]}`}>
          {caseData.priority.toUpperCase()}
        </span>
      </div>

      {/* Agent Assignment */}
      <div className="mb-2">
        <div className="text-[11px] text-gray-600 mb-1">Assigned Agent</div>
        <div className="flex items-center gap-2">
          <span 
            className="inline-block rounded-full shrink-0"
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: agentColor,
            }}
          />
          <span className="text-xs text-gray-800">
            {agentLabel || 'Unallocated'}
          </span>
        </div>
      </div>

      {/* Status and Priority Dropdown */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <div className="text-[11px] text-gray-600 mb-1">Status</div>
          <span className={`inline-block px-2 py-1 rounded text-[10px] font-medium ${
            caseData.status === 'complete' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {caseData.status === 'complete' ? '✓ Complete' : '⏱ Pending'}
          </span>
        </div>
        
        <div className="flex-1">
          <label className="text-[11px] text-gray-600 block mb-1">Priority</label>
          <select
            value={caseData.priority}
            onChange={(e) => onPriorityChange(caseData.id, e.target.value as CasePriority)}
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