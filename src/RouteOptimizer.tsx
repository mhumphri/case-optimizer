// RouteOptimizer.tsx
import React, { useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData, CasePriority, CaseChange, TimeSlot, AgentSettings, AgentChange, ScenarioConfig, ScenarioType } from './types/route';
import { RouteMap } from './components/RouteMap';
import { RouteDetails } from './components/RouteDetails';
import { Header } from './components/Header';

// Scenario Definitions
const SCENARIOS: Record<ScenarioType, ScenarioConfig> = {
  full: {
    name: 'Full Scenario',
    description: '200 cases across 6 agents',
    caseCount: 200,
    agentPostcodes: ['W6 9LI', 'W2 3EL', 'SE12 4WH', 'E10 1PI', 'SE14 5NP', 'SW15 7GB'],
    defaultStartTime: '09:00',
    defaultEndTime: '17:00',
    defaultLunchDuration: 45,
  },
  reduced: {
    name: 'Reduced Scenario',
    description: '10 cases across 2 agents',
    caseCount: 10,
    agentPostcodes: ['W6 9LI', 'W2 3EL'], // Subset of full scenario agents
    defaultStartTime: '10:30',
    defaultEndTime: '14:00',
    defaultLunchDuration: 45,
  },
};

const RouteOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [error, setError] = useState('');
  const [agentLocations, setAgentLocations] = useState<Location[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [caseChanges, setCaseChanges] = useState<CaseChange[]>([]);
  const [agentSettings, setAgentSettings] = useState<AgentSettings[]>([]);
  const [agentChanges, setAgentChanges] = useState<AgentChange[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [unallocatedCases, setUnallocatedCases] = useState<Array<CaseData & { unallocatedNumber: number }>>([]);
  const [routesVersion, setRoutesVersion] = useState(0);

  // Store original case data and agent settings for change tracking
  const originalCaseData = useRef<Map<string, { priority: CasePriority; deliverySlot?: TimeSlot }>>(new Map());
  const originalAgentSettings = useRef<AgentSettings[]>([]);
  const currentScenarioConfig = useRef<ScenarioConfig | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
  });

  const handlePriorityChange = (caseId: string, newPriority: CasePriority) => {
    // Find the case first to get its current priority
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    const currentPriority = targetCase.priority;

    // Only update if priority actually changed
    if (currentPriority !== newPriority) {
      // Update the case priority
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, priority: newPriority } : c
        )
      );

      // Update changes list based on original priority
      setCaseChanges(prev => {
        const originalData = originalCaseData.current.get(caseId);
        if (!originalData) return prev;

        const originalPriority = originalData.priority;

        // Remove any existing priority change for this case
        const filteredChanges = prev.filter(change =>
          !(change.caseId === caseId && 'oldPriority' in change)
        );

        // If new priority is same as original, no change to track
        if (newPriority === originalPriority) {
          return filteredChanges;
        }

        // Otherwise, add/update the priority change
        return [
          ...filteredChanges,
          {
            caseId: targetCase.id,
            casePostcode: targetCase.postcode,
            oldPriority: originalPriority,
            newPriority,
            timestamp: new Date(),
          }
        ];
      });
    }
  };

  const handleSlotChange = (caseId: string, newSlot: TimeSlot | undefined) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    // Update the case delivery slot
    setCases(prevCases =>
      prevCases.map(c =>
        c.id === caseId ? { ...c, deliverySlot: newSlot } : c
      )
    );

    // Update changes list based on original slot
    setCaseChanges(prev => {
      const originalData = originalCaseData.current.get(caseId);
      if (!originalData) return prev;

      const originalSlot = originalData.deliverySlot;

      // Remove any existing slot change for this case
      const filteredChanges = prev.filter(change =>
        !(change.caseId === caseId && 'oldSlot' in change)
      );

      // Compare slots (considering undefined)
      const slotsEqual =
        (originalSlot === undefined && newSlot === undefined) ||
        (originalSlot && newSlot &&
          originalSlot.startTime === newSlot.startTime &&
          originalSlot.endTime === newSlot.endTime);

      // If slot is same as original, no change to track
      if (slotsEqual) {
        return filteredChanges;
      }

      // Otherwise, add/update the slot change
      return [
        ...filteredChanges,
        {
          caseId: targetCase.id,
          casePostcode: targetCase.postcode,
          oldSlot: originalSlot,
          newSlot: newSlot,
          timestamp: new Date(),
        }
      ];
    });
  };

  const handleAgentSettingsChange = (agentIndex: number, newSettings: AgentSettings) => {
    // Validation: start time cannot be after finish time (only if active)
    if (newSettings.active && newSettings.startTime >= newSettings.endTime) {
      return; // Invalid, ignore the change
    }

    // Update agent settings
    setAgentSettings(prev => {
      const updated = [...prev];
      updated[agentIndex] = newSettings;
      return updated;
    });

    // Update changes list based on original settings
    setAgentChanges(prev => {
      const originalSettings = originalAgentSettings.current[agentIndex];
      if (!originalSettings) return prev;

      // Remove any existing change for this agent
      const filteredChanges = prev.filter(change => change.agentIndex !== agentIndex);

      // Check if settings match original
      const settingsEqual =
        originalSettings.startTime === newSettings.startTime &&
        originalSettings.endTime === newSettings.endTime &&
        originalSettings.lunchDuration === newSettings.lunchDuration &&
        originalSettings.active === newSettings.active;

      // If same as original, no change to track
      if (settingsEqual) {
        return filteredChanges;
      }

      // Otherwise, add/update the agent change
      const route = optimizedRoutes[agentIndex];
      return [
        ...filteredChanges,
        {
          agentIndex,
          agentLabel: route?.vehicleLabel?.replace('Vehicle', 'Agent') || `Agent ${agentIndex + 1}`,
          oldSettings: originalSettings,
          newSettings,
          timestamp: new Date(),
        }
      ];
    });
  };

  const handleDeleteCaseChange = (caseId: string, changeType: 'priority' | 'slot') => {
    // Get the original data
    const originalData = originalCaseData.current.get(caseId);
    if (!originalData) return;

    if (changeType === 'priority') {
      // Restore the case to its original priority
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, priority: originalData.priority } : c
        )
      );

      // Remove the priority change from the list
      setCaseChanges(prev =>
        prev.filter(change =>
          !(change.caseId === caseId && 'oldPriority' in change)
        )
      );
    } else {
      // Restore the case to its original slot
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, deliverySlot: originalData.deliverySlot } : c
        )
      );

      // Remove the slot change from the list
      setCaseChanges(prev =>
        prev.filter(change =>
          !(change.caseId === caseId && 'oldSlot' in change)
        )
      );
    }
  };

  const handleDeleteAgentChange = (agentIndex: number) => {
    const originalSettings = originalAgentSettings.current[agentIndex];
    if (!originalSettings) return;

    // Restore agent to original settings
    setAgentSettings(prev => {
      const updated = [...prev];
      updated[agentIndex] = originalSettings;
      return updated;
    });

    // Remove the agent change from the list
    setAgentChanges(prev => prev.filter(change => change.agentIndex !== agentIndex));
  };

  const handleRecalculate = async () => {
    try {
      // Re-run optimization with current case priorities/slots and agent settings
      await optimizeRoutes(cases, agentSettings);

      // Clear changes lists only after successful recalculation
      setCaseChanges([]);
      setAgentChanges([]);
    } catch (error) {
      // Keep changes visible if recalculation fails
      console.error('Recalculation failed:', error);
    }
  };

  const handleScenarioSelect = (scenarioType: ScenarioType) => {
    setSelectedScenario(scenarioType);
    currentScenarioConfig.current = SCENARIOS[scenarioType];
    optimizeRoutes(undefined, undefined, scenarioType);
  };

  const optimizeRoutes = async (
    existingCases?: CaseData[],
    existingAgentSettings?: AgentSettings[],
    scenarioType?: ScenarioType
  ) => {
    setLoading(true);
    setError('');

    // Determine which scenario to use
    const scenario = scenarioType
      ? SCENARIOS[scenarioType]
      : currentScenarioConfig.current || SCENARIOS.full;

    // Clear changes if this is a new optimization (not a recalculation)
    if (!existingCases) {
      setCaseChanges([]);
      setAgentChanges([]);
    }

    // Import utilities
    const { generateMultiplePostcodes, timeToSeconds } = await import('./utils/locationGenerator');
    const { generateCasePriority } = await import('./utils/caseGenerator');
    const { getPenaltyCost } = await import('./utils/priorityMapping');
    const { geocodePostcodes } = await import('./utils/geocoding');
    const { generateDeliverySlot, timeStringToSeconds } = await import('./utils/timeSlotGenerator');

    let initialCases: CaseData[];
    let currentAgentSettings: AgentSettings[];

    // Use existing cases if recalculating, otherwise generate new ones
    if (existingCases && existingCases.length > 0) {
      initialCases = existingCases;
      currentAgentSettings = existingAgentSettings || agentSettings;
      console.log('🔄 Recalculating with updated priorities, slots, and agent settings...');
      console.log(`  ${caseChanges.length} case changes + ${agentChanges.length} agent changes to apply`);

      // Log the changes
      caseChanges.forEach(change => {
        if ('oldPriority' in change) {
          console.log(`  - ${change.casePostcode}: priority ${change.oldPriority} → ${change.newPriority}`);
        } else {
          const oldSlot = change.oldSlot ? `${change.oldSlot.startTime}-${change.oldSlot.endTime}` : 'None';
          const newSlot = change.newSlot ? `${change.newSlot.startTime}-${change.newSlot.endTime}` : 'None';
          console.log(`  - ${change.casePostcode}: slot ${oldSlot} → ${newSlot}`);
        }
      });

      agentChanges.forEach(change => {
        console.log(`  - ${change.agentLabel}:`);
        console.log(`    Hours: ${change.oldSettings.startTime}-${change.oldSettings.endTime} → ${change.newSettings.startTime}-${change.newSettings.endTime}`);
        console.log(`    Lunch: ${change.oldSettings.lunchDuration}min → ${change.newSettings.lunchDuration}min`);
      });
    } else {
      // Generate cases based on scenario
      console.log(`📍 Generating ${scenario.caseCount} unique cases from real postcodes...`);
      console.log(`  Scenario: ${scenario.name}`);
      console.log(`  Agents: ${scenario.agentPostcodes.length}`);
      console.log(`  Default hours: ${scenario.defaultStartTime}-${scenario.defaultEndTime}`);

      const postcodes = generateMultiplePostcodes(scenario.caseCount);

      initialCases = postcodes.map((postcodeCase, index) => ({
        id: `case-${index + 1}`,
        postcode: postcodeCase.postcode,
        priority: generateCasePriority(),
        deliverySlot: generateDeliverySlot(), // 1 in 12 cases get a delivery slot
        status: 'pending' as const,
        assignedAgentIndex: null,
      }));

      // Initialize agent settings with scenario defaults
      currentAgentSettings = scenario.agentPostcodes.map(() => ({
        startTime: scenario.defaultStartTime,
        endTime: scenario.defaultEndTime,
        lunchDuration: scenario.defaultLunchDuration,
        active: true, // All agents start as active
      }));

      setAgentSettings(currentAgentSettings);
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));

      // Geocode all postcodes (cases + agents)
      console.log('🌍 Geocoding postcodes...');
      const allPostcodes = [...new Set([...postcodes.map(p => p.postcode), ...scenario.agentPostcodes])];

      const geocodedLocations = await geocodePostcodes(allPostcodes, (completed, total) => {
        console.log(`  Geocoded ${completed}/${total} postcodes`);
      });

      console.log(`✅ Geocoded ${geocodedLocations.size} unique postcodes`);

      // Add geocoded locations to cases
      initialCases = initialCases.map(c => ({
        ...c,
        location: geocodedLocations.get(c.postcode),
      }));

      // Store original case data for change tracking
      originalCaseData.current = new Map(
        initialCases.map(c => [c.id, { priority: c.priority, deliverySlot: c.deliverySlot }])
      );

      // Store geocoded agent locations
      const agentLocs = scenario.agentPostcodes.map(pc => geocodedLocations.get(pc)).filter(Boolean) as Location[];
      setAgentLocations(agentLocs);
    }

    // Filter out cases without coordinates
    const casesWithCoords = initialCases.filter(c => c.location);
    if (casesWithCoords.length < initialCases.length) {
      console.warn(`⚠️ ${initialCases.length - casesWithCoords.length} cases failed to geocode and will be skipped`);
    }

    const shipments = casesWithCoords.map((caseData) => {
      const baseShipment = {
        deliveries: [
          {
            arrivalLocation: {
              latitude: caseData.location!.latitude,
              longitude: caseData.location!.longitude,
            },
            duration: { seconds: 300 }, // 5 minutes per case
            timeWindows: [
              // Use shift time window from agent settings (will be set per vehicle below)
              {
                startTime: { seconds: timeToSeconds('09:00') },
                endTime: { seconds: timeToSeconds('17:00') },
              }
            ],
          },
        ],
        label: caseData.postcode,
        // Penalty cost for NOT completing this delivery (based on priority)
        penaltyCost: getPenaltyCost(caseData.priority),
      };

      // If case has a delivery slot, override with specific time window
      if (caseData.deliverySlot) {
        baseShipment.deliveries[0].timeWindows = [{
          startTime: { seconds: timeStringToSeconds(caseData.deliverySlot.startTime) },
          endTime: { seconds: timeStringToSeconds(caseData.deliverySlot.endTime) },
        }];
      }

      return baseShipment;
    });

    // Build vehicles with custom time windows per agent (only for active agents)
    const activeAgentIndices: number[] = []; // Track which agents are active
    const vehicles = scenario.agentPostcodes
      .map((postcode, index) => {
        const settings = currentAgentSettings[index];

        // Skip inactive agents
        if (!settings.active) {
          return null;
        }

        activeAgentIndices.push(index); // Track this agent's original index

        const shiftTimeWindow = {
          startTime: { seconds: timeToSeconds(settings.startTime) },
          endTime: { seconds: timeToSeconds(settings.endTime) },
        };

        const vehicle: any = {
          startLocation: agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 },
          endLocation: agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 },
          label: `Agent ${index + 1} (${postcode})`,
          startTimeWindows: [shiftTimeWindow],
          endTimeWindows: [shiftTimeWindow],
        };

        // Only add lunch break if duration > 0
        if (settings.lunchDuration > 0) {
          // Lunch break starts at midpoint of shift
          const shiftStart = timeToSeconds(settings.startTime);
          const shiftEnd = timeToSeconds(settings.endTime);
          const shiftMidpoint = Math.floor((shiftStart + shiftEnd) / 2);

          vehicle.breakRule = {
            breakRequests: [
              {
                earliestStartTime: { seconds: shiftMidpoint - 1800 }, // 30 min before midpoint
                latestStartTime: { seconds: shiftMidpoint + 1800 }, // 30 min after midpoint
                minDuration: { seconds: settings.lunchDuration * 60 },
              },
            ],
          };
        }

        return vehicle;
      })
      .filter(vehicle => vehicle !== null); // Remove null entries (inactive agents)

    // Set up time context for London timezone
    const today = new Date();
    const londonDate = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    londonDate.setHours(0, 0, 0, 0); // Start of day in London

    console.log('🌍 Setting global time context:');
    console.log(`  Start: ${londonDate.toISOString()}`);
    console.log(`  Timezone: Europe/London`);

    const requestBody = {
      model: {
        shipments,
        vehicles,
        // Explicitly set the reference time for the optimization
        // This ensures time windows are interpreted in London timezone
        globalStartTime: londonDate.toISOString(),
        globalEndTime: new Date(londonDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    try {
      console.log('📤 Sending optimization request...');

      // Debug: Log sample shipment to verify structure
      if (shipments.length > 0) {
        console.log('📦 Sample shipment structure:', JSON.stringify(shipments[0], null, 2));
        const slotsCount = shipments.filter(s =>
          s.deliveries[0].timeWindows[0].startTime.seconds !== 32400
        ).length;
        console.log(`  Cases with delivery slots: ${slotsCount}/${shipments.length}`);
      }

      // Log priority distribution
      const priorityDistribution = {
        high: initialCases.filter(c => c.priority === 'high').length,
        medium: initialCases.filter(c => c.priority === 'medium').length,
        low: initialCases.filter(c => c.priority === 'low').length,
      };
      console.log('📊 Priority Distribution:', priorityDistribution);
      console.log('💰 Penalty Costs: High=£1000, Medium=£300, Low=£100');

      // Log agent settings
      console.log('👤 Agent Settings:');
      currentAgentSettings.forEach((settings, index) => {
        if (settings.active) {
          console.log(`  Agent ${index + 1}: ${settings.startTime}-${settings.endTime}, ${settings.lunchDuration}min lunch [ACTIVE]`);
        } else {
          console.log(`  Agent ${index + 1}: [INACTIVE]`);
        }
      });
      console.log(`  Active agents: ${activeAgentIndices.length}/${currentAgentSettings.length}`);

      const response = await fetch('http://localhost:3001/api/optimize-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);

      const routes: OptimizedRoute[] = data.routes?.map((route: any, apiRouteIndex: number) => ({
        vehicleLabel: route.vehicleLabel || `Vehicle ${apiRouteIndex + 1}`,
        visits: route.visits?.map((visit: any) => {
          const shipmentIndex = visit.shipmentIndex;
          const caseData = casesWithCoords[shipmentIndex];

          return {
            shipmentIndex: visit.shipmentIndex,
            shipmentLabel: visit.shipmentLabel || caseData?.postcode || `Stop ${shipmentIndex + 1}`,
            startTime: visit.startTime,
            arrivalLocation: caseData?.location,
          };
        }) || [],
        metrics: {
          travelDuration: route.metrics?.travelDuration || { seconds: 0 },
          travelDistance: route.metrics?.travelDistanceMeters || 0,
        },
      })) || [];

      // Create a full routes array with placeholders for inactive agents
      // This ensures route indices match agent indices
      const fullRoutes: OptimizedRoute[] = scenario.agentPostcodes.map((postcode, index) => {
        const settings = currentAgentSettings[index];

        if (!settings.active) {
          // Inactive agent - create empty route placeholder
          return {
            vehicleLabel: `Agent ${index + 1} (${postcode})`,
            visits: [],
            metrics: {
              travelDuration: { seconds: 0 },
              travelDistance: 0,
            },
          };
        }

        // Active agent - find corresponding route from API response
        const apiRouteIndex = activeAgentIndices.indexOf(index);
        return routes[apiRouteIndex] || {
          vehicleLabel: `Agent ${index + 1} (${postcode})`,
          visits: [],
          metrics: {
            travelDuration: { seconds: 0 },
            travelDistance: 0,
          },
        };
      });

      // Update case assignments based on optimization results
      const updatedCases = initialCases.map(caseData => {
        // Find which agent was assigned this case and when
        let assignedRouteIndex = -1;
        let deliveryTime: string | { seconds: number } | undefined = undefined;

        // Search through all routes (including inactive placeholders)
        for (let routeIdx = 0; routeIdx < fullRoutes.length; routeIdx++) {
          const visit = fullRoutes[routeIdx].visits.find(v => {
            // Match by postcode label
            return v.shipmentLabel === caseData.postcode;
          });

          if (visit) {
            assignedRouteIndex = routeIdx;
            deliveryTime = visit.startTime;
            break;
          }
        }

        return {
          ...caseData,
          assignedAgentIndex: assignedRouteIndex >= 0 ? assignedRouteIndex : null,
          deliveryTime: deliveryTime,
        };
      });

      setOptimizedRoutes(fullRoutes);
      setCases(updatedCases);
      setRoutesVersion(prev => prev + 1); 
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        {/* Error Content */}
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">❌ Map Loading Error:</h2>
          <p className="text-gray-700">Failed to load Google Maps. Please check your API key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />

      {/* Two Column Layout - fills remaining space */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Map */}
        <div className="flex-1 relative">
          {!googleMapsApiKey && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                <h2 className="text-xl font-bold text-yellow-600 mb-4">⚠️ Google Maps API Key Missing:</h2>
                <p className="text-gray-700">
                  Add `VITE_GOOGLE_MAPS_API_KEY` to your .env file to enable the map.
                </p>
              </div>
            </div>
          )}

          {/* Scenario Selection - Only show when no routes optimized */}
          {optimizedRoutes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="max-w-4xl w-full px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Choose Optimization Scenario
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Scenario Card */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">📊 Full Scenario</h2>
                    <ul className="space-y-2 mb-6 text-gray-700">
                      <li>✓ 200 cases across London</li>
                      <li>✓ 6 agents (W6 9LI, W2 3EL, SE12 4WH, E10 1PI, SE14 5NP, SW15 7GB)</li>
                      <li>✓ Default hours: 09:00-17:00</li>
                      <li>✓ 45-minute lunch break</li>
                      <li>✓ Priority-based optimization</li>
                      <li>✓ ~1 in 12 cases with delivery slots</li>
                    </ul>
                    <button
                      onClick={() => handleScenarioSelect('full')}
                      className="w-full px-6 py-3 text-base font-bold text-white bg-blue-500 border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                      🚀 Run Full Scenario
                    </button>
                  </div>

                  {/* Reduced Scenario Card */}
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">📉 Reduced Scenario</h2>
                    <ul className="space-y-2 mb-6 text-gray-700">
                      <li>✓ 15 cases across London</li>
                      <li>✓ 2 agents (W6 9LI, W2 3EL)</li>
                      <li>✓ Default hours: 11:30-14:00</li>
                      <li>✓ 45-minute lunch break</li>
                      <li>✓ Priority-based optimization</li>
                      <li>✓ ~1 in 12 cases with delivery slots</li>
                    </ul>
                    <button
                      onClick={() => handleScenarioSelect('reduced')}
                      className="w-full px-6 py-3 text-base font-bold text-white bg-green-500 border-none rounded cursor-pointer hover:bg-green-600 transition-colors"
                    >
                      🚀 Run Reduced Scenario
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                  All scenarios use real London postcodes and Google Route Optimization API
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && optimizedRoutes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Geocoding & Optimizing...</h2>
                <p className="text-gray-600">
                  {selectedScenario === 'full'
                    ? 'Processing 200 cases across 6 agents'
                    : 'Processing 40 cases across 2 agents'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                <h2 className="text-xl font-bold text-red-600 mb-4">❌ Error:</h2>
                <p className="text-gray-700">{error}</p>
              </div>
            </div>
          )}

          {/* Map Section - Fill entire container */}
          {optimizedRoutes.length > 0 && googleMapsApiKey && isLoaded && (
            <div className="relative w-full h-full">
<RouteMap
  routes={optimizedRoutes}
  agentLocations={agentLocations}
  cases={cases}
  unallocatedCases={unallocatedCases}
  routesVersion={routesVersion}
/>
            </div>
          )}

          {/* Map Loading State */}
          {optimizedRoutes.length > 0 && googleMapsApiKey && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-lg text-gray-700">Loading map...</div>
            </div>
          )}
        </div>

        {/* Right Column - Tabbed Interface */}
        {optimizedRoutes.length > 0 && (
          <div className="w-[400px] border-l border-gray-200 bg-white">
            <RouteDetails
              routes={optimizedRoutes}
              cases={cases}
              agentSettings={agentSettings}
              onPriorityChange={handlePriorityChange}
              onSlotChange={handleSlotChange}
              onAgentSettingsChange={handleAgentSettingsChange}
              caseChanges={caseChanges}
              agentChanges={agentChanges}
              onRecalculate={handleRecalculate}
              onDeleteCaseChange={handleDeleteCaseChange}
              onDeleteAgentChange={handleDeleteAgentChange}
              isRecalculating={loading}
              onUnallocatedCasesUpdate={setUnallocatedCases}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizer;