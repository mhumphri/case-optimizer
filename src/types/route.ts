// types/route.ts - UPDATED

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

// ✅ UPDATED: Changed from 'low' | 'medium' | 'high' to 'normal' | 'high'
export type CasePriority = 'normal' | 'high';

export type CaseStatus = 'pending' | 'complete';

export interface TimeSlot {
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
}

export interface CaseData {
  id: string;
  postcode: string;
  location?: Location;
  priority: CasePriority;
  status: CaseStatus;
  assignedAgentIndex: number | null;
  deliveryTime?: string | { seconds: number };
  deliverySlot?: TimeSlot;
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

export interface AgentSettings {
  startTime: string;
  endTime: string;
  lunchDuration: number;
  active: boolean;
  finishPostcode?: string;
  finishLocation?: Location;
}

export interface AgentChange {
  agentIndex: number;
  agentLabel: string;
  oldSettings: AgentSettings;
  newSettings: AgentSettings;
  timestamp: Date;
}

export type Change = CaseChange | AgentChange;

export interface ScenarioConfig {
  name: string;
  description: string;
  caseCount: number;
  agentPostcodes: string[];
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLunchDuration: number;
  agentFinishPostcodes?: (string | undefined)[];
}

export type ScenarioType = 'full' | 'reduced';