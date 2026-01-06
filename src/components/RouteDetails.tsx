// components/RouteDetails.tsx
import React, { useState, useMemo, useEffect } from 'react';
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
  onUnallocatedCasesUpdate?: (cases: Array<CaseData & { unallocatedNumber: number }>) => void;
}

const ROUTE_COLORS = [
  '#4285f4',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#ff6d00',
  '#9c27b0',
  '#00bcd4',
  '#e91e63',
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
  onUnallocatedCasesUpdate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('agents');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('all');
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all');
  const [changesExpanded, setChangesExpanded] = useState(false);

  const getTimeInSeconds = (time: string | { seconds: number } | undefined): number => {
    if (!time) return Infinity;
    if (typeof time === 'object' && 'seconds' in time) {
      return time.seconds;
    }
    if (typeof time === 'string') {
      const date = new Date(time);
      return date.getTime() / 1000;
    }
    return Infinity;
  };

  const getOptimizedAgentStatus = (agentIndex: number): boolean => {
    const agentChange = agentChanges.find(change => change.agentIndex === agentIndex);
    if (agentChange) {
      return agentChange.oldSettings.active;
    }
    return agentSettings[agentIndex].active;
  };

  const unallocatedCasesWithNumbers = useMemo(() => {
    const unallocated = cases.filter(c => c.assignedAgentIndex === null);
    unallocated.sort((a, b) => a.id.localeCompare(b.id));
    
    const numbered = unallocated.map((caseData, index) => ({
      ...caseData,
      unallocatedNumber: index + 1,
    }));

    console.log('📋 RouteDetails - Created unallocated cases:', numbered.length);
    numbered.forEach(c => {
      console.log(`  - ${c.postcode} (#${c.unallocatedNumber}) - Has location: ${!!c.location}`);
    });

    return numbered;
  }, [cases]);

  useEffect(() => {
    if (onUnallocatedCasesUpdate) {
      console.log('📤 RouteDetails - Sending unallocated cases to parent:', unallocatedCasesWithNumbers.length);
      onUnallocatedCasesUpdate(unallocatedCasesWithNumbers);
    }
  }, [unallocatedCasesWithNumbers, onUnallocatedCasesUpdate]);

  const unallocatedNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    unallocatedCasesWithNumbers.forEach(c => {
      map.set(c.id, c.unallocatedNumber);
    });
    return map;
  }, [unallocatedCasesWithNumbers]);

  const filteredAgents = useMemo(() => {
    const agentsWithIndex = routes.map((route, index) => ({
      route,
      index,
      optimizedActive: getOptimizedAgentStatus(index),
    }));

    let filtered = agentsWithIndex;
    if (agentFilter === 'active') {
      filtered = agentsWithIndex.filter(a => a.optimizedActive);
    } else if (agentFilter === 'inactive') {
      filtered = agentsWithIndex.filter(a => !a.optimizedActive);
    }

    return filtered;
  }, [routes, agentSettings, agentChanges, agentFilter]);

  const agentCounts = useMemo(() => {
    const active = routes.filter((_, index) => getOptimizedAgentStatus(index)).length;
    const inactive = routes.length - active;
    return {
      all: routes.length,
      active,
      inactive,
    };
  }, [routes, agentSettings, agentChanges]);

  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases;
    if (caseFilter === 'allocated') {
      filtered = cases.filter(c => c.assignedAgentIndex !== null);
    } else if (caseFilter === 'unallocated') {
      filtered = cases.filter(c => c.assignedAgentIndex === null);
    }

    return filtered.sort((a, b) => {
      const aAllocated = a.assignedAgentIndex !== null;
      const bAllocated = b.assignedAgentIndex !== null;

      if (aAllocated && !bAllocated) return -1;
      if (!aAllocated && bAllocated) return 1;

      if (aAllocated && bAllocated) {
        const agentA = a.assignedAgentIndex!;
        const agentB = b.assignedAgentIndex!;
        if (agentA !== agentB) {
          return agentA - agentB;
        }

        const timeA = getTimeInSeconds(a.deliveryTime);
        const timeB = getTimeInSeconds(b.deliveryTime);
        return timeA - timeB;
      }

      const numA = unallocatedNumberMap.get(a.id) ?? Infinity;
      const numB = unallocatedNumberMap.get(b.id) ?? Infinity;
      return numA - numB;
    });
  }, [cases, caseFilter, unallocatedNumberMap]);

  const caseCounts = useMemo(() => {
    const allocated = cases.filter(c => c.assignedAgentIndex !== null).length;
    const unallocated = cases.filter(c => c.assignedAgentIndex === null).length;
    return {
      all: cases.length,
      allocated,
      unallocated,
    };
  }, [cases]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setChangesExpanded(false);
  };

  const handleAgentFilterChange = (filter: AgentFilter) => {
    setAgentFilter(filter);
    setChangesExpanded(false);
  };

  const handleCaseFilterChange = (filter: CaseFilter) => {
    setCaseFilter(filter);
    setChangesExpanded(false);
  };

  const totalChanges = caseChanges.length + agentChanges.length;
  const shouldShowChangesPanel = totalChanges > 0 || isRecalculating;

  useEffect(() => {
    if (!shouldShowChangesPanel && changesExpanded) {
      setChangesExpanded(false);
    }
  }, [shouldShowChangesPanel, changesExpanded]);

  if (routes.length === 0 && cases.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleViewModeChange('agents')}
            className={`flex-1 px-4 py-2 text-sm font-semibold border-none rounded cursor-pointer transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'agents'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <circle cx="12" cy="7" r="5.5" />
              <path d="M2 22 Q 2 15, 6 12.5 L 18 12.5 Q 22 15, 22 22 Z" />
            </svg>
            <span>Agents</span>
          </button>
          <button
            onClick={() => handleViewModeChange('cases')}
            className={`flex-1 px-4 py-2 text-sm font-semibold border-none rounded cursor-pointer transition-colors flex items-center justify-center gap-2 ${
              viewMode === 'cases'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <span>Cases</span>
          </button>
        </div>

        {viewMode === 'agents' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter Agents
            </label>
            <select
              value={agentFilter}
              onChange={(e) => handleAgentFilterChange(e.target.value as AgentFilter)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer"
            >
              <option value="all">All Agents ({agentCounts.all})</option>
              <option value="active">Active Only ({agentCounts.active})</option>
              <option value="inactive">Inactive Only ({agentCounts.inactive})</option>
            </select>
          </div>
        )}

        {viewMode === 'cases' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter Cases
            </label>
            <select
              value={caseFilter}
              onChange={(e) => handleCaseFilterChange(e.target.value as CaseFilter)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer"
            >
              <option value="all">All Cases ({caseCounts.all})</option>
              <option value="allocated">Allocated Only ({caseCounts.allocated})</option>
              <option value="unallocated">Unallocated Only ({caseCounts.unallocated})</option>
            </select>
          </div>
        )}
      </div>

      {!changesExpanded && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {viewMode === 'agents' ? (
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
                    cases={cases}
                    onSettingsChange={onAgentSettingsChange}
                    onPriorityChange={onPriorityChange}
                    onSlotChange={onSlotChange}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cases match the current filter
                </div>
              ) : (
                filteredAndSortedCases.map((caseData) => {
                  let agentLabel: string | null = null;
                  let agentColor = '#9ca3af';
                  let routeNumber: number | null = null;
                  let unallocatedNumber: number | null = null;

                  if (caseData.assignedAgentIndex !== null) {
                    const route = routes[caseData.assignedAgentIndex];
                    if (route) {
                      agentLabel = route.vehicleLabel.replace('Vehicle', 'Agent');
                      agentColor = ROUTE_COLORS[caseData.assignedAgentIndex % ROUTE_COLORS.length];

                      const visitIndex = route.visits.findIndex(visit => {
                        return visit.shipmentLabel === caseData.postcode;
                      });

                      if (visitIndex >= 0) {
                        routeNumber = visitIndex + 1;
                      }
                    }
                  } else {
                    unallocatedNumber = unallocatedNumberMap.get(caseData.id) ?? null;
                  }

                  return (
                    <CaseCard
                      key={caseData.id}
                      caseData={caseData}
                      agentLabel={agentLabel}
                      agentColor={agentColor}
                      routeNumber={routeNumber}
                      unallocatedNumber={unallocatedNumber}
                      onPriorityChange={onPriorityChange}
                      onSlotChange={onSlotChange}
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {shouldShowChangesPanel && (
        <div className={changesExpanded ? "flex-1 min-h-0 bg-white" : "bg-white shrink-0"}>
          <ChangesPanel
            caseChanges={caseChanges}
            agentChanges={agentChanges}
            onRecalculate={onRecalculate}
            onDeleteCaseChange={onDeleteCaseChange}
            onDeleteAgentChange={onDeleteAgentChange}
            isRecalculating={isRecalculating}
            isExpanded={changesExpanded}
            onToggleExpanded={setChangesExpanded}
          />
        </div>
      )}
    </div>
  );
};