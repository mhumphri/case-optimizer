// utils/priorityMapping.ts - UPDATED

import type { CasePriority } from '../types/route';

/**
 * Map case priority to penalty cost for route optimization
 * Penalty cost represents the "cost" of NOT completing this delivery
 * Higher priority = higher cost to skip = more likely to be included
 * 
 * ✅ UPDATED: Two-tier system with 5:1 ratio
 * - Normal: £100 (baseline cost for standard deliveries)
 * - High: £500 (5x multiplier for urgent/priority deliveries)
 */
export const getPenaltyCost = (priority: CasePriority): number => {
  switch (priority) {
    case 'high':
      return 10000; // High cost to skip high-priority cases
    case 'normal':
      return 5000; // Baseline cost for normal cases
    default:
      return 5000;
  }
};

/**
 * Get display label for penalty cost
 */
export const getPenaltyCostLabel = (priority: CasePriority): string => {
  const cost = getPenaltyCost(priority);
  return `£${cost}`;
};