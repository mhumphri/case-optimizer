import type { CasePriority } from '../types/route';

/**
 * Generate a random priority with distribution:
 * - 1/7 high priority
 * - 1/7 low priority  
 * - 5/7 medium priority
 */
export const generateCasePriority = (): CasePriority => {
  const random = Math.random();
  
  if (random < 1/3) {
    return 'high';
  } else if (random < 2/7) {
    return 'low';
  } else {
    return 'medium';
  }
};