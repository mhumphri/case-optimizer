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

// Create agent icon SVG as data URL
const createAgentIcon = (color: string): string => {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(20, 21) scale(0.8)">
        <path d="M-6 -8 A 6 6 0 1 1 6 -8 A 6 6 0 1 1 -6 -8 Z" fill="white"/>
        <path d="M -10 8 Q -10 0, -6 -2 L 6 -2 Q 10 0, 10 8 Z" fill="white"/>
      </g>
    </svg>
  `;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
};

export const AgentCard: React.FC<AgentCardProps> = ({ route, index, color, settings, onSettingsChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract agent name from vehicleLabel (e.g., "Agent 1 (SW1 4GO)")
  const agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
  const agentName = agentLabel.split(' (')[0]; // "Agent 1"
  const agentPostcode = agentLabel.match(/\(([^)]+)\)/)?.[1] || ''; // "SW1 4GO"

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
    <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* Agent Icon and Name */}
      <div className="flex items-center gap-3 mb-2">
        <img 
          src={createAgentIcon(color)} 
          alt={agentName}
          className="w-10 h-10"
        />
        <h3 className="text-base font-bold text-gray-900">{agentName}</h3>
        
        {/* Active/Inactive Toggle */}
        <button
          onClick={() => onSettingsChange(index, { ...settings, active: !settings.active })}
          className={`ml-auto px-2 py-1 text-[10px] font-bold border-none rounded cursor-pointer transition-colors ${
            settings.active
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-400 text-white hover:bg-gray-500'
          }`}
        >
          {settings.active ? '✓ Active' : '✕ Inactive'}
        </button>
      </div>

      {/* Postcode */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-600">📍</span>
        <span className="text-sm text-gray-700">{agentPostcode}</span>
      </div>

      {/* Agent Settings Controls */}
      <div className="mb-3 p-3 bg-gray-50 rounded">
        <h4 className="text-xs font-bold text-gray-700 mb-2">Work Schedule</h4>

        {/* Start and End Time */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-1">
              Start Time
            </label>
            <select
              value={settings.startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              disabled={!settings.active}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time} disabled={time >= settings.endTime}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-1">
              End Time
            </label>
            <select
              value={settings.endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              disabled={!settings.active}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time} disabled={time <= settings.startTime}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lunch Break */}
        <div>
          <label className="block text-[10px] font-medium text-gray-600 mb-1">
            Lunch Break
          </label>
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
          {/* Metrics Row - Cases, Distance, Duration */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Cases</div>
              <div className="text-sm font-bold text-gray-900">{route.visits.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Distance</div>
              <div className="text-sm font-bold text-gray-900">
                {(route.metrics.travelDistance / 1000).toFixed(1)} km
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Duration</div>
              <div className="text-sm font-bold text-gray-900">
                {formatDuration(route.metrics.travelDuration)}
              </div>
            </div>
          </div>

          {/* Expandable Case List */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs font-medium w-full hover:bg-green-600"
          >
            {isExpanded ? '▼' : '▶'} {route.visits.length} cases
          </button>

          {isExpanded && (
            <>
              <div className="mt-2 space-y-1">
                {route.visits.map((visit, i) => {
                  const formattedTime = formatTime(visit.startTime);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-500">{i + 1}.</span>
                        <span className="text-gray-900">{visit.shipmentLabel}</span>
                      </div>
                      {formattedTime && (
                        <div className="text-gray-600 text-[10px]">
                          🕐 {formattedTime}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Inactive Message */}
      {!settings.active && (
        <div className="text-center py-3 text-xs text-gray-500 bg-gray-50 rounded">
          Agent is inactive and will not be included in route optimization
        </div>
      )}
    </div>
  );
};