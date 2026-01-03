import React, { useState } from 'react';
import type { OptimizedRoute } from '../types/route';
import { formatDuration, formatTime } from '../utils/formatters';

interface AgentCardProps {
  route: OptimizedRoute;
  index: number;
  color: string;
}

export const AgentCard: React.FC<AgentCardProps> = ({ route, index, color }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract agent name from vehicleLabel (e.g., "Agent 1 (SW1 4GO)")
  const agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
  
  return (
    <div
      className="rounded-lg p-3 mb-3 bg-white"
      style={{
        border: `3px solid ${color}`,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="m-0 text-sm text-green-800 flex items-center gap-1.5 leading-tight">
          <span 
            className="inline-block rounded-sm shrink-0"
            style={{
              width: '3px',
              height: '20px',
              backgroundColor: color,
            }}
          />
          <span>👤 {agentLabel}</span>
        </h3>
        <span className="px-2 py-0.5 bg-green-500 text-white rounded-xl text-[11px] font-bold shrink-0">
          {route.visits.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-2 mb-2">
        <div>
          <div className="text-[11px] text-gray-600 mb-0.5">📏 Distance</div>
          <div className="text-base text-blue-700 font-semibold">
            {(route.metrics.travelDistance / 1000).toFixed(1)} km
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-600 mb-0.5">⏱️ Duration</div>
          <div className="text-base text-blue-700 font-semibold">
            {formatDuration(route.metrics.travelDuration)}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium w-full hover:bg-green-600"
      >
        {isExpanded ? '▼' : '▶'} {route.visits.length} cases
      </button>
      
      {isExpanded && (
        <>
          <div className="max-h-[200px] overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50 mt-2">
            <ol className="leading-tight pl-5 m-0 text-[11px]">
              {route.visits.map((visit, i) => {
                const formattedTime = formatTime(visit.startTime);
                return (
                  <li key={i} className="mb-1">
                    <strong>{visit.shipmentLabel}</strong>
                    {formattedTime && (
                      <div className="text-gray-600 text-[10px]">
                        🕐 {formattedTime}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};