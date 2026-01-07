// components/CaseController.tsx
import React, { useState } from 'react';
import type { Location, OptimizedRoute, CaseData, CasePriority, CaseChange, TimeSlot, AgentSettings, AgentChange } from '../types/route';
import { RouteMap } from './RouteMap';
import { RouteDetails } from './RouteDetails';

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

  // Mobile View
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - fills space between header and bottom nav */}
        <div className="flex-1 overflow-hidden relative">
          {/* Map View */}
          {activeView === 'map' && (
            <>
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

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-sm mx-4">
                    <h2 className="text-lg font-bold text-red-600 mb-3">❌ Error</h2>
                    <p className="text-sm text-gray-700">{error}</p>
                  </div>
                </div>
              )}

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

              {!error && googleMapsApiKey && !isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-sm text-gray-700">Loading map...</div>
                </div>
              )}
            </>
          )}

          {/* Agents View - Placeholder */}
          {activeView === 'agents' && (
            <div className="flex-1 bg-yellow-300 flex items-center justify-center">
              <div className="text-center text-gray-900 font-semibold text-lg">
                Agents View (Coming Soon)
              </div>
            </div>
          )}

          {/* Cases View - Placeholder */}
          {activeView === 'cases' && (
            <div className="flex-1 bg-yellow-300 flex items-center justify-center">
              <div className="text-center text-gray-900 font-semibold text-lg">
                Cases View (Coming Soon)
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="shrink-0 bg-white border-t border-gray-300 flex">
          <button
            onClick={() => setActiveView('map')}
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
            onClick={() => setActiveView('agents')}
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
            onClick={() => setActiveView('cases')}
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