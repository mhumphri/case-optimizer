import React, { useState } from 'react';
import type { OptimizedRoute, CaseData, CasePriority } from '../types/route';
import { AgentCard } from './AgentCard';
import { CaseCard } from './CaseCard';

interface RouteDetailsProps {
  routes: OptimizedRoute[];
  cases: CaseData[];
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
}

// Colors for different agent routes (same as RouteMap)
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

type ViewMode = 'agents' | 'cases';

export const RouteDetails: React.FC<RouteDetailsProps> = ({ routes, cases, onPriorityChange }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agents');

  if (routes.length === 0 && cases.length === 0) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Absolute Positioned Tab Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-300 p-3 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('agents')}
            className={`flex-1 px-4 py-2 text-sm font-semibold border-none rounded cursor-pointer transition-colors ${
              viewMode === 'agents'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            👤 Agents
          </button>
          <button
            onClick={() => setViewMode('cases')}
            className={`flex-1 px-4 py-2 text-sm font-semibold border-none rounded cursor-pointer transition-colors ${
              viewMode === 'cases'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            📋 Cases
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {viewMode === 'agents' ? (
          // Agents View
          <div>
            {routes.map((route, index) => (
              <AgentCard 
                key={index} 
                route={route} 
                index={index}
                color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
              />
            ))}
          </div>
        ) : (
          // Cases View
          <div>
            {cases.map((caseData, index) => {
              // Find which agent this case is assigned to
              let agentLabel: string | null = null;
              let agentColor = '#9ca3af'; // Grey for unallocated
              
              if (caseData.assignedAgentIndex !== null) {
                const route = routes[caseData.assignedAgentIndex];
                if (route) {
                  agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
                  agentColor = ROUTE_COLORS[caseData.assignedAgentIndex % ROUTE_COLORS.length];
                }
              }

              return (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  agentLabel={agentLabel}
                  agentColor={agentColor}
                  onPriorityChange={onPriorityChange}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};