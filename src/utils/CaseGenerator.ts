// utils/caseGenerator.ts - UPDATED

import type { CasePriority } from '../types/route';

/**
 * Generate a random priority with distribution:
 * - 1/6 high priority (approximately 17% of cases)
 * - 5/6 normal priority (approximately 83% of cases)
 * 
 * ✅ UPDATED: Changed from three-tier (low/medium/high) to two-tier (normal/high)
 */
export const generateCasePriority = (): CasePriority => {
  const random = Math.random();
  
  // 1 in 6 cases are high priority
  if (random < 1/4) {
    return 'high';
  } else {
    return 'normal';
  }
};