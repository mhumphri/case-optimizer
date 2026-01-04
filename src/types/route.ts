// types/route.ts

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

// Agent Settings Types
export interface AgentSettings {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  lunchDuration: number; // minutes
  active: boolean; // whether agent is active or inactive
}

export interface AgentChange {
  agentIndex: number;
  agentLabel: string;
  oldSettings: AgentSettings;
  newSettings: AgentSettings;
  timestamp: Date;
}

export type Change = CaseChange | AgentChange;

// Scenario Types
export interface ScenarioConfig {
  name: string;
  description: string;
  caseCount: number;
  agentPostcodes: string[];
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLunchDuration: number;
}

export type ScenarioType = 'full' | 'reduced';