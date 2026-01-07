// components/AgentList.tsx
import React, { useMemo } from 'react';
import type { OptimizedRoute, CaseData, AgentSettings, AgentChange } from '../types/route';
import { AgentCard } from './AgentCard';

interface AgentListProps {
  routes: OptimizedRoute[];
  agentSettings: AgentSettings[];
  cases: CaseData[];
  onPriorityChange: (caseId: string, priority: 'normal' | 'high') => void;
  onSlotChange: (caseId: string, slot: { startTime: string; endTime: string } | undefined) => void;
  onAgentSettingsChange: (agentIndex: number, settings: AgentSettings) => void;
  agentChanges?: AgentChange[];
  filterMode?: 'all' | 'active' | 'inactive';
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

export const AgentList: React.FC<AgentListProps> = ({
  routes,
  agentSettings,
  cases,
  onPriorityChange,
  onSlotChange,
  onAgentSettingsChange,
  agentChanges = [],
  filterMode = 'all',
}) => {
  const getOptimizedAgentStatus = (agentIndex: number): boolean => {
    const agentChange = agentChanges.find(change => change.agentIndex === agentIndex);
    if (agentChange) {
      return agentChange.oldSettings.active;
    }
    return agentSettings[agentIndex].active;
  };

  const filteredAgents = useMemo(() => {
    const agentsWithIndex = routes.map((route, index) => ({
      route,
      index,
      optimizedActive: getOptimizedAgentStatus(index),
    }));

    let filtered = agentsWithIndex;
    if (filterMode === 'active') {
      filtered = agentsWithIndex.filter(a => a.optimizedActive);
    } else if (filterMode === 'inactive') {
      filtered = agentsWithIndex.filter(a => !a.optimizedActive);
    }

    return filtered;
  }, [routes, agentSettings, agentChanges, filterMode]);

  if (filteredAgents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No agents match the current filter
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAgents.map(({ route, index }) => (
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
      ))}
    </div>
  );
};