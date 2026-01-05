// components/AgentCard.tsx
import React, { useState, useEffect } from 'react';
import type { OptimizedRoute, AgentSettings, CaseData, CasePriority, TimeSlot } from '../types/route';
import { generateTimeOptions, generateLunchOptions } from '../utils/timeSlotGenerator';
import { TimeSlotInput } from './TimeSlotInput';

interface AgentCardProps {
  route: OptimizedRoute;
  index: number;
  color: string;
  settings: AgentSettings;
  cases: CaseData[];
  onSettingsChange: (index: number, settings: AgentSettings) => void;
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
  onSlotChange: (caseId: string, slot: TimeSlot | undefined) => void;
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

// Format duration as hours and minutes (e.g., "2h 34m")
const formatDurationHoursMinutes = (duration: string | { seconds: number } | any): string => {
  let seconds = 0;
  
  if (duration && typeof duration === 'object' && 'seconds' in duration) {
    seconds = duration.seconds;
  } else if (typeof duration === 'string') {
    const match = duration.match(/(\d+)s/);
    if (match) {
      seconds = parseInt(match[1]);
    }
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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

export const AgentCard: React.FC<AgentCardProps> = ({ 
  route, 
  index, 
  color, 
  settings, 
  cases,
  onSettingsChange,
  onPriorityChange,
  onSlotChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Extract agent name from vehicleLabel (e.g., "Agent 1 (SW1 4GO)")
  const agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
  const agentName = agentLabel.split(' (')[0]; // "Agent 1"
  const agentPostcode = agentLabel.match(/\(([^)]+)\)/)?.[1] || ''; // "SW1 4GO"

  const timeOptions = generateTimeOptions(true); // Extended range: 07:00-20:00
  const lunchOptions = generateLunchOptions(); // 0-120 mins in 15-min increments

  // Reset case list when agent becomes inactive
  useEffect(() => {
    if (!settings.active) {
      setIsExpanded(false);
      setExpandedCaseId(null);
    }
  }, [settings.active]);

  // Reset expanded case when case list is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setExpandedCaseId(null);
    }
  }, [isExpanded]);

  // Helper to get case by postcode
  const getCaseByPostcode = (postcode: string): CaseData | undefined => {
    return cases.find(c => c.postcode === postcode);
  };

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

  const handleCaseClick = (caseId: string) => {
    setExpandedCaseId(expandedCaseId === caseId ? null : caseId);
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
        
        {/* Active/Inactive Toggle - smaller standard toggle switch style */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            {settings.active ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => onSettingsChange(index, { ...settings, active: !settings.active })}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border-2 ${
              settings.active
                ? 'bg-blue-400 border-blue-400'
                : 'bg-gray-300 border-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                settings.active ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Postcode - Only show when active */}
      {settings.active && (
        <div className="flex items-center gap-2 mb-3">
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="text-sm text-gray-700">{agentPostcode}</span>
        </div>
      )}

      {/* Agent Settings Controls - Only show when active */}
      {settings.active && (
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
      )}

      {/* Route Details - Only show if agent is active */}
      {settings.active && (
        <>
          {/* Metrics Row - Cases, Distance, Duration without icons */}
          <div className="flex justify-between mb-3 px-1">
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Cases</div>
              <div className="text-sm font-bold text-gray-900">{route.visits.length}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Distance</div>
              <div className="text-sm font-bold text-gray-900">
                {(route.metrics.travelDistance / 1000).toFixed(1)} km
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-medium text-gray-600 mb-1">Duration</div>
              <div className="text-sm font-bold text-gray-900">
                {formatDurationHoursMinutes(route.metrics.travelDuration)}
              </div>
            </div>
          </div>

          {/* Expandable Case List - blue border */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 text-xs font-medium w-full rounded border border-blue-400 bg-white hover:bg-blue-50 text-gray-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="none" 
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path 
                d="M3 4.5L6 7.5L9 4.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            {isExpanded ? 'Hide Cases' : `View Cases (${route.visits.length})`}
          </button>

          {isExpanded && (
            <>
              <div className="mt-2 space-y-1">
                {route.visits.map((visit, i) => {
                  const caseData = getCaseByPostcode(visit.shipmentLabel);
                  if (!caseData) return null;
                  
                  const isHighPriority = caseData.priority === 'high';
                  const formattedTime = formatTimeWithoutSeconds(visit.startTime);
                  const status = caseData.status || 'pending';
                  const isThisCaseExpanded = expandedCaseId === caseData.id;
                  
                  return (
                    <div
                      key={i}
                      className={`text-xs bg-gray-50 rounded overflow-hidden ${
                        isThisCaseExpanded ? 'border border-gray-300' : ''
                      }`}
                    >
                      {/* Case Header - clickable when collapsed */}
                      <div
                        onClick={() => !isThisCaseExpanded && handleCaseClick(caseData.id)}
                        className={`flex items-center justify-between p-2 ${
                          !isThisCaseExpanded ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                      >
                        {/* LHS: Colored circle with number */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="relative">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ 
                                backgroundColor: color,
                                ...(isHighPriority ? {
                                  border: '2px solid white',
                                  outlineWidth: '1px',
                                  outlineStyle: 'solid',
                                  outlineColor: color,
                                } : {})
                              }}
                            >
                              {i + 1}
                            </div>
                            {isHighPriority && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border border-white flex items-center justify-center text-white text-[7px] font-bold">
                                !
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle: Postcode and Time */}
                        <div className="flex-1 ml-2">
                          <div className="text-gray-900 font-medium">{visit.shipmentLabel}</div>
                          {formattedTime && (
                            <div className="text-gray-600 text-[10px]">
                              {formattedTime} ({status})
                            </div>
                          )}
                        </div>

                        {/* RHS: Chevron or Close Button */}
{isThisCaseExpanded ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      setExpandedCaseId(null);
    }}
    className="flex-shrink-0 flex items-center gap-1 text-gray-500 hover:text-gray-700 px-1 text-[10px] cursor-pointer"
  >
    <span>Close</span>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </button>
) : (
  <div className="flex-shrink-0 text-gray-400">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
)}
                      </div>

                      {/* Expanded Content - Priority and Time Slot (no top border) */}
                      {isThisCaseExpanded && (
                        <div className="px-2 pb-2 pt-1">
                          {/* Priority Dropdown */}
                          <div className="mb-2">
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

                          {/* Time Slot Input */}
                          <TimeSlotInput
                            caseId={caseData.id}
                            deliverySlot={caseData.deliverySlot}
                            onSlotChange={onSlotChange}
                          />
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