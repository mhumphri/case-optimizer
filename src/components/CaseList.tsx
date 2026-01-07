// components/CaseList.tsx
import React, { useMemo } from 'react';
import type { OptimizedRoute, CaseData } from '../types/route';
import { CaseCard } from './CaseCard';

interface CaseListProps {
  cases: CaseData[];
  routes: OptimizedRoute[];
  unallocatedCases: Array<CaseData & { unallocatedNumber: number }>;
  onPriorityChange: (caseId: string, priority: 'normal' | 'high') => void;
  onSlotChange: (caseId: string, slot: { startTime: string; endTime: string } | undefined) => void;
  filterMode?: 'all' | 'allocated' | 'unallocated';
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

export const CaseList: React.FC<CaseListProps> = ({
  cases,
  routes,
  unallocatedCases,
  onPriorityChange,
  onSlotChange,
  filterMode = 'all',
}) => {
  const unallocatedNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    unallocatedCases.forEach(c => {
      map.set(c.id, c.unallocatedNumber);
    });
    return map;
  }, [unallocatedCases]);

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

  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases;
    if (filterMode === 'allocated') {
      filtered = cases.filter(c => c.assignedAgentIndex !== null);
    } else if (filterMode === 'unallocated') {
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
  }, [cases, filterMode, unallocatedNumberMap]);

  if (filteredAndSortedCases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cases match the current filter
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedCases.map((caseData) => {
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
      })}
    </div>
  );
};