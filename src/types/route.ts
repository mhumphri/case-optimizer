export interface Location {
  latitude: number;
  longitude: number;
}

export interface Visit {
  shipmentIndex: number;
  shipmentLabel: string;
  startTime: string | { seconds: number };
  arrivalLocation?: Location;
}

export interface RouteMetrics {
  travelDuration: string | { seconds: number };
  travelDistance: number;
}

export interface OptimizedRoute {
  vehicleLabel: string;
  visits: Visit[];
  metrics: RouteMetrics;
}

export type CasePriority = 'low' | 'medium' | 'high';
export type CaseStatus = 'pending' | 'complete';

export interface CaseData {
  id: string;
  postcode: string;
  location: Location;
  priority: CasePriority;
  status: CaseStatus;
  assignedAgentIndex: number | null; // null if unallocated
}