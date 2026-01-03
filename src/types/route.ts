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

export interface TimeSlot {
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
}

export interface CaseData {
  id: string;
  postcode: string;
  location?: Location; // Geocoded coordinates
  priority: CasePriority;
  status: CaseStatus;
  assignedAgentIndex: number | null; // null if unallocated
  deliveryTime?: string | { seconds: number }; // Expected delivery time
  deliverySlot?: TimeSlot; // Required delivery time window (optional)
}

export interface PriorityChange {
  caseId: string;
  casePostcode: string;
  oldPriority: CasePriority;
  newPriority: CasePriority;
  timestamp: Date;
}

export interface TimeSlotChange {
  caseId: string;
  casePostcode: string;
  oldSlot: TimeSlot | undefined;
  newSlot: TimeSlot | undefined;
  timestamp: Date;
}

export type CaseChange = PriorityChange | TimeSlotChange;