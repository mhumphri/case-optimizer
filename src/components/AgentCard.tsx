// components/AgentCard.tsx

import React, { useState } from 'react';
import type { OptimizedRoute, AgentSettings } from '../types/route';
import { formatDuration, formatTime } from '../utils/formatters';
import { generateTimeOptions, generateLunchOptions } from '../utils/timeSlotGenerator';

interface AgentCardProps {
  route: OptimizedRoute;
  index: number;
  color: string;
  settings: AgentSettings;
  onSettingsChange: (index: number, settings: AgentSettings) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ 
  route, 
  index, 
  color, 
  settings, 
  onSettingsChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract agent name from vehicleLabel (e.g., "Agent 1 (SW1 4GO)")
  const agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
  
  const timeOptions = generateTimeOptions(true); // Extended range: 07:00-20:00
  const lunchOptions = generateLunchOptions(); // 0-120 mins in 15-min increments

  const handleStartTimeChange = (newStartTime: string) => {
    // Validate: start time cannot be after end time
    if (newStartTime >= settings.endTime) {
      return; // Invalid, ignore
    }
    
    onSettingsChange(index, {
      ...settings,
      startTime: newStartTime,
    });
  };

  const handleEndTimeChange = (newEndTime: string) => {
    // Validate: end time cannot be before start time
    if (newEndTime <= settings.startTime) {
      return; // Invalid, ignore
    }
    
    onSettingsChange(index, {
      ...settings,
      endTime: newEndTime,
    });
  };

  const handleLunchChange = (newLunchDuration: number) => {
    onSettingsChange(index, {
      ...settings,
      lunchDuration: newLunchDuration,
    });
  };
  
  return (
    <div className="bg-white rounded-lg p-3 mb-3 border border-gray-300 shadow-sm">
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
        
        {/* Active/Inactive Toggle */}
        <button
          onClick={() => onSettingsChange(index, { ...settings, active: !settings.active })}
          className={`px-2 py-1 text-[10px] font-bold border-none rounded cursor-pointer transition-colors ${
            settings.active 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
        >
          {settings.active ? '✓ Active' : '✕ Inactive'}
        </button>
      </div>

      {/* Agent Settings Controls */}
      <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
        <div className="text-[11px] text-gray-600 font-semibold mb-2">Work Schedule</div>
        
        {/* Start and End Time */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-600 block mb-0.5">Start Time</label>
            <select
              value={settings.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              disabled={!settings.active}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {timeOptions.map((time) => (
                <option 
                  key={time} 
                  value={time}
                  disabled={time >= settings.endTime}
                >
                  {time}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="text-[10px] text-gray-600 block mb-0.5">End Time</label>
            <select
              value={settings.endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              disabled={!settings.active}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {timeOptions.map((time) => (
                <option 
                  key={time} 
                  value={time}
                  disabled={time <= settings.startTime}
                >
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <label className="text-[10px] text-gray-600 block mb-0.5">Lunch Break</label>
          <select
            value={settings.lunchDuration}
            onChange={(e) => handleLunchChange(Number(e.target.value))}
            disabled={!settings.active}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {lunchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Route Details - Only show if agent is active */}
      {settings.active && (
        <>
          <div className="flex flex-col gap-2 mb-2">
            <div>
              <div className="text-[11px] text-gray-600 mb-0.5">📦 Cases</div>
              <div className="text-base text-blue-700 font-semibold">
                {route.visits.length}
              </div>
            </div>
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
        </>
      )}
      
      {/* Inactive Message */}
      {!settings.active && (
        <div className="p-3 bg-gray-100 rounded text-center text-xs text-gray-600">
          Agent is inactive and will not be included in route optimization
        </div>
      )}
    </div>
  );
};