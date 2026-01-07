// components/CaseController.tsx
import React, { useState, useEffect } from 'react';
import type { Location, OptimizedRoute, CaseData, CasePriority, CaseChange, TimeSlot, AgentSettings, AgentChange } from '../types/route';
import { RouteMap } from './RouteMap';
import { RouteDetails } from './RouteDetails';
import { AgentList } from './AgentList';
import { CaseList } from './CaseList';
import { ChangesPanel } from './ChangesPanel';

interface CaseControllerProps {
  routes: OptimizedRoute[];
  agentLocations: Location[];
  cases: CaseData[];
  agentSettings: AgentSettings[];
  optimizedAgentSettings: AgentSettings[];
  caseChanges: CaseChange[];
  agentChanges: AgentChange[];
  unallocatedCases: Array<CaseData & { unallocatedNumber: number }>;
  routesVersion: number;
  originalCasePriorities: Map<string, { priority: CasePriority; deliverySlot?: TimeSlot }>;
  onPriorityChange: (caseId: string, priority: CasePriority) => void;
  onSlotChange: (caseId: string, slot: TimeSlot | undefined) => void;
  onAgentSettingsChange: (agentIndex: number, settings: AgentSettings) => void;
  onRecalculate: () => void;
  onDeleteCaseChange: (caseId: string, changeType: 'priority' | 'slot') => void;
  onDeleteAgentChange: (agentIndex: number) => void;
  onUnallocatedCasesUpdate: (cases: Array<CaseData & { unallocatedNumber: number }>) => void;
  isRecalculating: boolean;
  googleMapsApiKey: string | undefined;
  isLoaded: boolean;
  error?: string;
  isMobile?: boolean;
}

type MobileView = 'map' | 'agents' | 'cases';
type AgentFilter = 'all' | 'active' | 'inactive';
type CaseFilter = 'all' | 'allocated' | 'unallocated';

export const CaseController: React.FC<CaseControllerProps> = ({
  routes,
  agentLocations,
  cases,
  agentSettings,
  optimizedAgentSettings,
  caseChanges,
  agentChanges,
  unallocatedCases,
  routesVersion,
  originalCasePriorities,
  onPriorityChange,
  onSlotChange,
  onAgentSettingsChange,
  onRecalculate,
  onDeleteCaseChange,
  onDeleteAgentChange,
  onUnallocatedCasesUpdate,
  isRecalculating,
  googleMapsApiKey,
  isLoaded,
  error,
  isMobile = false,
}) => {
  const [activeView, setActiveView] = useState<MobileView>('map');
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('all');
  const [changesExpanded, setChangesExpanded] = useState(false);

  // Scroll position tracking for mobile views
  const [scrollPositions, setScrollPositions] = useState<{
    agents: number;
    cases: number;
  }>({
    agents: 0,
    cases: 0,
  });

  // Refs for scrollable containers
  const agentsScrollRef = React.useRef<HTMLDivElement>(null);
  const casesScrollRef = React.useRef<HTMLDivElement>(null);

  // Calculate filter counts for mobile
  const agentCounts = React.useMemo(() => {
    const active = routes.filter((_, index) => {
      const agentChange = agentChanges.find(change => change.agentIndex === index);
      if (agentChange) {
        return agentChange.oldSettings.active;
      }
      return agentSettings[index].active;
    }).length;
    const inactive = routes.length - active;
    return {
      all: routes.length,
      active,
      inactive,
    };
  }, [routes, agentSettings, agentChanges]);

  const caseCounts = React.useMemo(() => {
    const allocated = cases.filter(c => c.assignedAgentIndex !== null).length;
    const unallocated = cases.filter(c => c.assignedAgentIndex === null).length;
    return {
      all: cases.length,
      allocated,
      unallocated,
    };
  }, [cases]);

  // Collapse ChangesPanel when view changes
  const handleViewChange = (view: MobileView) => {
    // Save current scroll position before switching
    if (activeView === 'agents' && agentsScrollRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        agents: agentsScrollRef.current!.scrollTop,
      }));
    } else if (activeView === 'cases' && casesScrollRef.current) {
      setScrollPositions(prev => ({
        ...prev,
        cases: casesScrollRef.current!.scrollTop,
      }));
    }

    setActiveView(view);
    setChangesExpanded(false);
  };

  const totalChanges = caseChanges.length + agentChanges.length;
  const shouldShowChangesPanel = totalChanges > 0 || isRecalculating;

  // Collapse ChangesPanel when no changes exist
  useEffect(() => {
    if (!shouldShowChangesPanel && changesExpanded) {
      setChangesExpanded(false);
    }
  }, [shouldShowChangesPanel, changesExpanded]);

  // Restore scroll position when view becomes active
  useEffect(() => {
    if (isMobile) {
      if (activeView === 'agents' && agentsScrollRef.current) {
        agentsScrollRef.current.scrollTop = scrollPositions.agents;
      } else if (activeView === 'cases' && casesScrollRef.current) {
        casesScrollRef.current.scrollTop = scrollPositions.cases;
      }
    }
  }, [activeView, isMobile, scrollPositions]);

  // Reset scroll positions when routes are recalculated
  useEffect(() => {
    if (isMobile) {
      setScrollPositions({
        agents: 0,
        cases: 0,
      });
    }
  }, [routesVersion, isMobile]);

  // Mobile View
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - RouteMap always rendered */}
        <div className="flex-1 overflow-hidden relative">
          {/* API Key Missing Warning */}
          {!googleMapsApiKey && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm mx-4">
                <h2 className="text-lg font-bold text-yellow-600 mb-3">⚠️ API Key Missing</h2>
                <p className="text-sm text-gray-700">
                  Add `VITE_GOOGLE_MAPS_API_KEY` to your .env file to enable the map.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm mx-4">
                <h2 className="text-lg font-bold text-red-600 mb-3">❌ Error</h2>
                <p className="text-sm text-gray-700">{error}</p>
              </div>
            </div>
          )}

          {/* RouteMap - Always Rendered */}
          {!error && googleMapsApiKey && isLoaded && (
            <div className="w-full h-full">
              <RouteMap
                routes={routes}
                agentLocations={agentLocations}
                cases={cases}
                unallocatedCases={unallocatedCases}
                routesVersion={routesVersion}
                agentSettings={optimizedAgentSettings}
                originalCasePriorities={originalCasePriorities}
              />
            </div>
          )}

          {/* Map Loading State */}
          {!error && googleMapsApiKey && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-sm text-gray-700">Loading map...</div>
            </div>
          )}

          {/* Agents Modal Overlay */}
          {activeView === 'agents' && (
            <div className="absolute inset-0 bg-white z-20 overflow-y-auto flex flex-col">
              <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                <div>
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
              </div>
              <div 
                ref={agentsScrollRef}
                className="flex-1 overflow-y-auto p-4" 
                style={{ paddingBottom: shouldShowChangesPanel ? '130px' : '1rem' }}
              >
                <AgentList
                  routes={routes}
                  agentSettings={agentSettings}
                  cases={cases}
                  onPriorityChange={onPriorityChange}
                  onSlotChange={onSlotChange}
                  onAgentSettingsChange={onAgentSettingsChange}
                  agentChanges={agentChanges}
                  filterMode={agentFilter}
                />
              </div>
            </div>
          )}

          {/* Cases Modal Overlay */}
          {activeView === 'cases' && (
            <div className="absolute inset-0 bg-white z-20 overflow-y-auto flex flex-col">
              <div className="shrink-0 p-4 border-b border-gray-200 bg-white">
                <div>
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
              </div>
              <div 
                ref={casesScrollRef}
                className="flex-1 overflow-y-auto p-4" 
                style={{ paddingBottom: shouldShowChangesPanel ? '130px' : '1rem' }}
              >
                <CaseList
                  cases={cases}
                  routes={routes}
                  unallocatedCases={unallocatedCases}
                  onPriorityChange={onPriorityChange}
                  onSlotChange={onSlotChange}
                  filterMode={caseFilter}
                />
              </div>
            </div>
          )}

          {/* Changes Panel Overlay */}
          {shouldShowChangesPanel && (
            <div className={`absolute left-0 right-0 bg-white z-30 ${
              changesExpanded ? 'inset-0' : 'bottom-0'
            }`}>
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

        {/* Bottom Navigation Bar */}
        <div className="shrink-0 bg-white border-t border-gray-300 flex">
          <button
            onClick={() => handleViewChange('map')}
            className={`flex-1 py-4 px-2 flex flex-col items-center justify-center border-none cursor-pointer transition-colors ${
              activeView === 'map'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-1"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span className="text-xs font-medium">Map</span>
          </button>

          <button
            onClick={() => handleViewChange('agents')}
            className={`flex-1 py-4 px-2 flex flex-col items-center justify-center border-none cursor-pointer transition-colors ${
              activeView === 'agents'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mb-1"
            >
              <circle cx="12" cy="7" r="5.5" />
              <path d="M2 22 Q 2 15, 6 12.5 L 18 12.5 Q 22 15, 22 22 Z" />
            </svg>
            <span className="text-xs font-medium">Agents</span>
          </button>

          <button
            onClick={() => handleViewChange('cases')}
            className={`flex-1 py-4 px-2 flex flex-col items-center justify-center border-none cursor-pointer transition-colors ${
              activeView === 'cases'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-1"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            <span className="text-xs font-medium">Cases</span>
          </button>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        {/* API Key Missing Warning */}
        {!googleMapsApiKey && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <h2 className="text-xl font-bold text-yellow-600 mb-4">⚠️ Google Maps API Key Missing:</h2>
              <p className="text-gray-700">
                Add `VITE_GOOGLE_MAPS_API_KEY` to your .env file to enable the map.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <h2 className="text-xl font-bold text-red-600 mb-4">❌ Error:</h2>
              <p className="text-gray-700">{error}</p>
            </div>
          </div>
        )}

        {/* Map View */}
        {!error && googleMapsApiKey && isLoaded && (
          <div className="relative w-full h-full">
            <RouteMap
              routes={routes}
              agentLocations={agentLocations}
              cases={cases}
              unallocatedCases={unallocatedCases}
              routesVersion={routesVersion}
              agentSettings={optimizedAgentSettings}
              originalCasePriorities={originalCasePriorities}
            />
          </div>
        )}

        {/* Map Loading State */}
        {!error && googleMapsApiKey && !isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-lg text-gray-700">Loading map...</div>
          </div>
        )}
      </div>

      {/* Route Details Sidebar */}
      <div className="w-[400px] border-l border-gray-200 bg-white">
        <RouteDetails
          routes={routes}
          cases={cases}
          agentSettings={agentSettings}
          onPriorityChange={onPriorityChange}
          onSlotChange={onSlotChange}
          onAgentSettingsChange={onAgentSettingsChange}
          caseChanges={caseChanges}
          agentChanges={agentChanges}
          onRecalculate={onRecalculate}
          onDeleteCaseChange={onDeleteCaseChange}
          onDeleteAgentChange={onDeleteAgentChange}
          isRecalculating={isRecalculating}
          onUnallocatedCasesUpdate={onUnallocatedCasesUpdate}
        />
      </div>
    </div>
  );
};