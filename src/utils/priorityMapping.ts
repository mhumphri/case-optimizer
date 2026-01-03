import type { CasePriority } from '../types/route';

/**
 * Map case priority to penalty cost for route optimization
 * Penalty cost represents the "cost" of NOT completing this delivery
 * Higher priority = higher cost to skip = more likely to be included
 */
export const getPenaltyCost = (priority: CasePriority): number => {
  switch (priority) {
    case 'high':
      return 1000; // High cost to skip high-priority cases
    case 'medium':
      return 300; // Medium cost to skip medium-priority cases
    case 'low':
      return 100; // Low cost to skip low-priority cases
    default:
      return 300;
  }
};

/**
 * Get display label for penalty cost
 */
export const getPenaltyCostLabel = (priority: CasePriority): string => {
  const cost = getPenaltyCost(priority);
  return `£${cost}`;
};