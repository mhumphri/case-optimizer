// components/RouteDetails.tsx
import React, { useState, useMemo } from 'react';
import type { OptimizedRoute, CaseData, CasePriority, CaseChange, TimeSlot, AgentSettings, AgentChange } from '../types/route';
import { AgentCard } from './AgentCard';
import { CaseCard } from './CaseCard';
import { ChangesPanel } from './ChangesPanel';

interface RouteDetailsProps {
  routes: OptimizedRoute[];
  cases: CaseData[];
  agentSettings: AgentSettings[];
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
  onSlotChange: (caseId: string, slot: TimeSlot | undefined) => void;
  onAgentSettingsChange: (agentIndex: number, settings: AgentSettings) => void;
  caseChanges: CaseChange[];
  agentChanges: AgentChange[];
  onRecalculate: () => void;
  onDeleteCaseChange: (caseId: string, changeType: 'priority' | 'slot') => void;
  onDeleteAgentChange: (agentIndex: number) => void;
  isRecalculating: boolean;
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
type CaseFilter = 'all' | 'allocated' | 'unallocated';
type AgentFilter = 'all' | 'active' | 'inactive';

export const RouteDetails: React.FC<RouteDetailsProps> = ({
  routes,
  cases,
  agentSettings,
  onPriorityChange,
  onSlotChange,
  onAgentSettingsChange,
  caseChanges,
  agentChanges,
  onRecalculate,
  onDeleteCaseChange,
  onDeleteAgentChange,
  isRecalculating,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agents');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('all');
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all');

  // Helper function to get time in seconds for sorting
  const getTimeInSeconds = (time: string | { seconds: number } | undefined): number => {
    if (!time) return Infinity; // Unallocated cases go to end
    if (typeof time === 'object' && 'seconds' in time) {
      return time.seconds;
    }
    if (typeof time === 'string') {
      const date = new Date(time);
      return date.getTime() / 1000;
    }
    return Infinity;
  };

  // Get the "optimized" agent status (status at last optimization)
  // This is the status before any pending changes
  const getOptimizedAgentStatus = (agentIndex: number): boolean => {
    const agentChange = agentChanges.find(change => change.agentIndex === agentIndex);
    if (agentChange) {
      // If there's a pending change, return the OLD status (before the change)
      return agentChange.oldSettings.active;
    }
    // No pending change, so current status is the optimized status
    return agentSettings[agentIndex].active;
  };

  // Filter and sort agents based on optimized status
  const filteredAgents = useMemo(() => {
    const agentsWithIndex = routes.map((route, index) => ({
      route,
      index,
      optimizedActive: getOptimizedAgentStatus(index),
    }));

    // Filter based on selection
    let filtered = agentsWithIndex;
    if (agentFilter === 'active') {
      filtered = agentsWithIndex.filter(a => a.optimizedActive);
    } else if (agentFilter === 'inactive') {
      filtered = agentsWithIndex.filter(a => !a.optimizedActive);
    }

    return filtered;
  }, [routes, agentSettings, agentChanges, agentFilter]);

  // Calculate agent counts based on optimized status
  const agentCounts = useMemo(() => {
    const active = routes.filter((_, index) => getOptimizedAgentStatus(index)).length;
    const inactive = routes.length - active;
    return {
      all: routes.length,
      active,
      inactive,
    };
  }, [routes, agentSettings, agentChanges]);

  // Sort and filter cases
  const filteredAndSortedCases = useMemo(() => {
    // First filter
    let filtered = cases;
    if (caseFilter === 'allocated') {
      filtered = cases.filter(c => c.assignedAgentIndex !== null);
    } else if (caseFilter === 'unallocated') {
      filtered = cases.filter(c => c.assignedAgentIndex === null);
    }

    // Then sort by agent index (ascending) and delivery time (ascending)
    return filtered.sort((a, b) => {
      // First sort by agent (unallocated at the end)
      const agentA = a.assignedAgentIndex ?? Infinity;
      const agentB = b.assignedAgentIndex ?? Infinity;
      if (agentA !== agentB) {
        return agentA - agentB;
      }

      // Then sort by delivery time
      const timeA = getTimeInSeconds(a.deliveryTime);
      const timeB = getTimeInSeconds(b.deliveryTime);
      return timeA - timeB;
    });
  }, [cases, caseFilter]);

  // Calculate case counts for filter options
  const caseCounts = useMemo(() => {
    const allocated = cases.filter(c => c.assignedAgentIndex !== null).length;
    const unallocated = cases.filter(c => c.assignedAgentIndex === null).length;
    return {
      all: cases.length,
      allocated,
      unallocated,
    };
  }, [cases]);

  if (routes.length === 0 && cases.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Tab Bar */}
      <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
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

        {/* Filter Dropdown - Show based on view mode */}
        {viewMode === 'agents' && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter Agents
            </label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value as AgentFilter)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer"
            >
              <option value="all">All Agents ({agentCounts.all})</option>
              <option value="active">Active Only ({agentCounts.active})</option>
              <option value="inactive">Inactive Only ({agentCounts.inactive})</option>
            </select>
          </div>
        )}

        {viewMode === 'cases' && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter Cases
            </label>
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value as CaseFilter)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer"
            >
              <option value="all">All Cases ({caseCounts.all})</option>
              <option value="allocated">Allocated Only ({caseCounts.allocated})</option>
              <option value="unallocated">Unallocated Only ({caseCounts.unallocated})</option>
            </select>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'agents' ? (
          // Agents View
          <div className="space-y-4">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No agents match the current filter
              </div>
            ) : (
              filteredAgents.map(({ route, index }) => (
                <AgentCard
                  key={`agent-${index}`}
                  route={route}
                  index={index}
                  color={ROUTE_COLORS[index % ROUTE_COLORS.length]}
                  settings={agentSettings[index]}
                  onSettingsChange={onAgentSettingsChange}
                />
              ))
            )}
          </div>
        ) : (
          // Cases View
          <div className="space-y-4">
            {filteredAndSortedCases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cases match the current filter
              </div>
            ) : (
              filteredAndSortedCases.map((caseData) => {
                // Find which agent this case is assigned to
                let agentLabel: string | null = null;
                let agentColor = '#9ca3af'; // Grey for unallocated
                let routeNumber: number | null = null;

                if (caseData.assignedAgentIndex !== null) {
                  const route = routes[caseData.assignedAgentIndex];
                  if (route) {
                    agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
                    agentColor = ROUTE_COLORS[caseData.assignedAgentIndex % ROUTE_COLORS.length];

                    // Find the visit index (position in route) for this case
                    const visitIndex = route.visits.findIndex(visit => {
                      // Match by shipment index which corresponds to case
                      return visit.shipmentLabel === caseData.postcode;
                    });

                    if (visitIndex >= 0) {
                      routeNumber = visitIndex + 1; // 1-indexed for display
                    }
                  }
                }

                return (
                  <CaseCard
                    key={caseData.id}
                    caseData={caseData}
                    agentLabel={agentLabel}
                    agentColor={agentColor}
                    routeNumber={routeNumber}
                    onPriorityChange={onPriorityChange}
                    onSlotChange={onSlotChange}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Fixed Changes Panel at Bottom */}
      <div className="shrink-0 border-t border-gray-200 bg-white">
        <ChangesPanel
          caseChanges={caseChanges}
          agentChanges={agentChanges}
          onRecalculate={onRecalculate}
          onDeleteCaseChange={onDeleteCaseChange}
          onDeleteAgentChange={onDeleteAgentChange}
          isRecalculating={isRecalculating}
        />
      </div>
    </div>
  );
};