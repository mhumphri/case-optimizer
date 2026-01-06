// RouteOptimizer.tsx - COMPLETE FILE with editable start location support
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
    agentFinishPostcodes: ['SW1A 1AA', undefined, undefined, undefined, undefined, undefined],
  },
  reduced: {
    name: 'Reduced Scenario',
    description: '8 cases across 2 agents',
    caseCount: 8,
    agentPostcodes: ['W6 9LI', 'SE14 5NP'],
    defaultStartTime: '10:30',
    defaultEndTime: '14:00',
    defaultLunchDuration: 45,
    agentFinishPostcodes: ['EC1A 1BB', undefined],
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
  const [optimizedAgentSettings, setOptimizedAgentSettings] = useState<AgentSettings[]>([]);

  // Store original case data and agent settings for change tracking
  const originalCaseData = useRef<Map<string, { priority: CasePriority; deliverySlot?: TimeSlot }>>(new Map());
  const originalAgentSettings = useRef<AgentSettings[]>([]);
  const currentScenarioConfig = useRef<ScenarioConfig | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
  });

  const handlePriorityChange = (caseId: string, newPriority: CasePriority) => {
    const targetCase = cases.find(c => c.id === caseId);
    if (!targetCase) return;

    const currentPriority = targetCase.priority;

    if (currentPriority !== newPriority) {
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, priority: newPriority } : c
        )
      );

      setCaseChanges(prev => {
        const originalData = originalCaseData.current.get(caseId);
        if (!originalData) return prev;

        const originalPriority = originalData.priority;
        const filteredChanges = prev.filter(change =>
          !(change.caseId === caseId && 'oldPriority' in change)
        );

        if (newPriority === originalPriority) {
          return filteredChanges;
        }

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

    setCases(prevCases =>
      prevCases.map(c =>
        c.id === caseId ? { ...c, deliverySlot: newSlot } : c
      )
    );

    setCaseChanges(prev => {
      const originalData = originalCaseData.current.get(caseId);
      if (!originalData) return prev;

      const originalSlot = originalData.deliverySlot;
      const filteredChanges = prev.filter(change =>
        !(change.caseId === caseId && 'oldSlot' in change)
      );

      const slotsEqual =
        (originalSlot === undefined && newSlot === undefined) ||
        (originalSlot && newSlot &&
          originalSlot.startTime === newSlot.startTime &&
          originalSlot.endTime === newSlot.endTime);

      if (slotsEqual) {
        return filteredChanges;
      }

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
    if (newSettings.active && newSettings.startTime >= newSettings.endTime) {
      return;
    }

    setAgentSettings(prev => {
      const updated = [...prev];
      updated[agentIndex] = newSettings;
      return updated;
    });

    setAgentChanges(prev => {
      const originalSettings = originalAgentSettings.current[agentIndex];
      if (!originalSettings) return prev;

      const filteredChanges = prev.filter(change => change.agentIndex !== agentIndex);

      const settingsEqual =
        originalSettings.startTime === newSettings.startTime &&
        originalSettings.endTime === newSettings.endTime &&
        originalSettings.lunchDuration === newSettings.lunchDuration &&
        originalSettings.active === newSettings.active &&
        originalSettings.startPostcode === newSettings.startPostcode &&
        originalSettings.finishPostcode === newSettings.finishPostcode;

      if (settingsEqual) {
        return filteredChanges;
      }

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
    const originalData = originalCaseData.current.get(caseId);
    if (!originalData) return;

    if (changeType === 'priority') {
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, priority: originalData.priority } : c
        )
      );

      setCaseChanges(prev =>
        prev.filter(change =>
          !(change.caseId === caseId && 'oldPriority' in change)
        )
      );
    } else {
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, deliverySlot: originalData.deliverySlot } : c
        )
      );

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

    setAgentSettings(prev => {
      const updated = [...prev];
      updated[agentIndex] = originalSettings;
      return updated;
    });

    setAgentChanges(prev => prev.filter(change => change.agentIndex !== agentIndex));
  };

  const handleRecalculate = async () => {
    try {
      await optimizeRoutes(cases, agentSettings);
      setCaseChanges([]);
      setAgentChanges([]);
    } catch (error) {
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

    const scenario = scenarioType
      ? SCENARIOS[scenarioType]
      : currentScenarioConfig.current || SCENARIOS.full;

    if (!existingCases) {
      setCaseChanges([]);
      setAgentChanges([]);
    }

    const { generateMultiplePostcodes, timeToSeconds } = await import('./utils/locationGenerator');
    const { generateCasePriority } = await import('./utils/caseGenerator');
    const { getPenaltyCost } = await import('./utils/priorityMapping');
    const { geocodePostcodes } = await import('./utils/geocoding');
    const { generateDeliverySlot, timeStringToSeconds } = await import('./utils/timeSlotGenerator');

    let initialCases: CaseData[];
    let currentAgentSettings: AgentSettings[];

    if (existingCases && existingCases.length > 0) {
      initialCases = existingCases;
      currentAgentSettings = existingAgentSettings || agentSettings;
      console.log('🔄 Recalculating with updated priorities, slots, and agent settings...');
      console.log(`  ${caseChanges.length} case changes + ${agentChanges.length} agent changes to apply`);

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
        if (change.oldSettings.startPostcode !== change.newSettings.startPostcode) {
          console.log(`    Start: ${change.oldSettings.startPostcode || 'Default'} → ${change.newSettings.startPostcode || 'Default'}`);
        }
        if (change.oldSettings.finishPostcode !== change.newSettings.finishPostcode) {
          console.log(`    Finish: ${change.oldSettings.finishPostcode || 'None'} → ${change.newSettings.finishPostcode || 'None'}`);
        }
      });
    } else {
      console.log(`📍 Generating ${scenario.caseCount} unique cases from real postcodes...`);
      console.log(`  Scenario: ${scenario.name}`);
      console.log(`  Agents: ${scenario.agentPostcodes.length}`);
      console.log(`  Default hours: ${scenario.defaultStartTime}-${scenario.defaultEndTime}`);

      const postcodes = generateMultiplePostcodes(scenario.caseCount);

      initialCases = postcodes.map((postcodeCase, index) => ({
        id: `case-${index + 1}`,
        postcode: postcodeCase.postcode,
        priority: generateCasePriority(),
        deliverySlot: generateDeliverySlot(),
        status: 'pending' as const,
        assignedAgentIndex: null,
      }));

      currentAgentSettings = scenario.agentPostcodes.map((postcode, index) => ({
        startTime: scenario.defaultStartTime,
        endTime: scenario.defaultEndTime,
        lunchDuration: scenario.defaultLunchDuration,
        active: true,
        startPostcode: undefined,
        startLocation: undefined,
        finishPostcode: scenario.agentFinishPostcodes?.[index],
        finishLocation: undefined,
      }));

      setAgentSettings(currentAgentSettings);
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));

      console.log('🌍 Geocoding postcodes...');
      const allPostcodes = [
        ...new Set([
          ...postcodes.map(p => p.postcode),
          ...scenario.agentPostcodes,
          ...(scenario.agentFinishPostcodes?.filter(Boolean) || [])
        ])
      ];

      const geocodedLocations = await geocodePostcodes(allPostcodes, (completed, total) => {
        console.log(`  Geocoded ${completed}/${total} postcodes`);
      });

      console.log(`✅ Geocoded ${geocodedLocations.size} unique postcodes`);

      initialCases = initialCases.map(c => ({
        ...c,
        location: geocodedLocations.get(c.postcode),
      }));

      originalCaseData.current = new Map(
        initialCases.map(c => [c.id, { priority: c.priority, deliverySlot: c.deliverySlot }])
      );

      const agentLocs = scenario.agentPostcodes.map(pc => geocodedLocations.get(pc)).filter(Boolean) as Location[];
      setAgentLocations(agentLocs);

      currentAgentSettings = currentAgentSettings.map(settings => {
        if (settings.finishPostcode) {
          return {
            ...settings,
            finishLocation: geocodedLocations.get(settings.finishPostcode),
          };
        }
        return settings;
      });

      setAgentSettings(currentAgentSettings);
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));
    }

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
            duration: { seconds: 300 },
            timeWindows: [
              {
                startTime: { seconds: timeToSeconds('09:00') },
                endTime: { seconds: timeToSeconds('17:00') },
              }
            ],
          },
        ],
        label: caseData.postcode,
        penaltyCost: getPenaltyCost(caseData.priority),
      };

      if (caseData.deliverySlot) {
        baseShipment.deliveries[0].timeWindows = [{
          startTime: { seconds: timeStringToSeconds(caseData.deliverySlot.startTime) },
          endTime: { seconds: timeStringToSeconds(caseData.deliverySlot.endTime) },
        }];
      }

      return baseShipment;
    });

    const activeAgentIndices: number[] = [];
    const vehicles = scenario.agentPostcodes
      .map((postcode, index) => {
        const settings = currentAgentSettings[index];

        if (!settings.active) {
          return null;
        }

        activeAgentIndices.push(index);

        const shiftTimeWindow = {
          startTime: { seconds: timeToSeconds(settings.startTime) },
          endTime: { seconds: timeToSeconds(settings.endTime) },
        };

        // ✅ Use custom start location if set, otherwise use default
        const startLocation = settings.startLocation 
          ? settings.startLocation 
          : agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 };

        // ✅ Use custom finish location if set, otherwise use start location
        const endLocation = settings.finishLocation
          ? settings.finishLocation
          : startLocation;

        const vehicle: any = {
          startLocation: startLocation,
          endLocation: endLocation,
          label: `Agent ${index + 1} (${settings.startPostcode || postcode})`,
          startTimeWindows: [shiftTimeWindow],
          endTimeWindows: [shiftTimeWindow],
        };

        if (settings.lunchDuration > 0) {
          const shiftStart = timeToSeconds(settings.startTime);
          const shiftEnd = timeToSeconds(settings.endTime);
          const shiftMidpoint = Math.floor((shiftStart + shiftEnd) / 2);

          vehicle.breakRule = {
            breakRequests: [
              {
                earliestStartTime: { seconds: shiftMidpoint - 1800 },
                latestStartTime: { seconds: shiftMidpoint + 1800 },
                minDuration: { seconds: settings.lunchDuration * 60 },
              },
            ],
          };
        }

        return vehicle;
      })
      .filter(vehicle => vehicle !== null);

    const londonDate = new Date();
    londonDate.setUTCHours(0, 0, 0, 0);

    console.log('🌍 Setting global time context:');
    console.log(`  Start: ${londonDate.toISOString()}`);
    console.log(`  Timezone: Europe/London`);

    const requestBody = {
      model: {
        shipments,
        vehicles,
        globalStartTime: londonDate.toISOString(),
        globalEndTime: new Date(londonDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };

    try {
      console.log('📤 Sending optimization request...');

      if (shipments.length > 0) {
        console.log('📦 Sample shipment structure:', JSON.stringify(shipments[0], null, 2));
        const slotsCount = shipments.filter(s =>
          s.deliveries[0].timeWindows[0].startTime.seconds !== 32400
        ).length;
        console.log(`  Cases with delivery slots: ${slotsCount}/${shipments.length}`);
      }

      const priorityDistribution = {
        high: initialCases.filter(c => c.priority === 'high').length,
        normal: initialCases.filter(c => c.priority === 'normal').length,
      };
      console.log('📊 Priority Distribution:', priorityDistribution);
      console.log('💰 Penalty Costs: High=£500, Normal=£100');

      console.log('👤 Agent Settings:');
      currentAgentSettings.forEach((settings, index) => {
        if (settings.active) {
          const startInfo = settings.startPostcode 
            ? `Start: ${settings.startPostcode}` 
            : `Start: ${scenario.agentPostcodes[index]}`;
          const finishInfo = settings.finishPostcode 
            ? ` → Finish: ${settings.finishPostcode}` 
            : ' (returns to start)';
          console.log(
            `  Agent ${index + 1}: ${startInfo}${finishInfo}, ` +
            `${settings.startTime}-${settings.endTime}, ${settings.lunchDuration}min lunch [ACTIVE]`
          );
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

      const fullRoutes: OptimizedRoute[] = scenario.agentPostcodes.map((postcode, index) => {
        const settings = currentAgentSettings[index];

        if (!settings.active) {
          return {
            vehicleLabel: `Agent ${index + 1} (${postcode})`,
            visits: [],
            metrics: {
              travelDuration: { seconds: 0 },
              travelDistance: 0,
            },
          };
        }

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

      const updatedCases = initialCases.map(caseData => {
        let assignedRouteIndex = -1;
        let deliveryTime: string | { seconds: number } | undefined = undefined;

        for (let routeIdx = 0; routeIdx < fullRoutes.length; routeIdx++) {
          const visit = fullRoutes[routeIdx].visits.find(v => {
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
      
      // Update optimized agent settings - these are what the map will display
      setOptimizedAgentSettings(currentAgentSettings.map(s => ({ ...s })));
      
      // Update original case data to reflect the priorities/slots used in this optimization
      originalCaseData.current = new Map(
        updatedCases.map(c => [c.id, { priority: c.priority, deliverySlot: c.deliverySlot }])
      );
      
      // Update original agent settings to reflect settings used in this optimization
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));
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

      <div className="flex flex-1 overflow-hidden">
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

          {optimizedRoutes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="max-w-4xl w-full px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Choose Optimization Scenario
                </h1>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <h2 className="text-2xl font-bold text-blue-600 mb-4">📊 Full Scenario</h2>
                    <ul className="space-y-2 mb-6 text-gray-700">
                      <li>✓ 200 cases across London</li>
                      <li>✓ 6 agents (W6 9LI, W2 3EL, SE12 4WH, E10 1PI, SE14 5NP, SW15 7GB)</li>
                      <li>✓ Default hours: 09:00-17:00</li>
                      <li>✓ 45-minute lunch break</li>
                      <li>✓ Priority-based optimization</li>
                      <li>✓ ~1 in 12 cases with delivery slots</li>
                      <li>✓ Agent 1 finishes at SW1A 1AA</li>
                    </ul>
                    <button
                      onClick={() => handleScenarioSelect('full')}
                      className="w-full px-6 py-3 text-base font-bold text-white bg-blue-500 border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
                    >
                      🚀 Run Full Scenario
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">📉 Reduced Scenario</h2>
                    <ul className="space-y-2 mb-6 text-gray-700">
                      <li>✓ 8 cases across London</li>
                      <li>✓ 2 agents (W6 9LI, SE14 5NP)</li>
                      <li>✓ Default hours: 10:30-14:00</li>
                      <li>✓ 45-minute lunch break</li>
                      <li>✓ Priority-based optimization</li>
                      <li>✓ ~1 in 12 cases with delivery slots</li>
                      <li>✓ Agent 1 finishes at EC1A 1BB</li>
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

          {loading && optimizedRoutes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Geocoding & Optimizing...</h2>
                <p className="text-gray-600">
                  {selectedScenario === 'full'
                    ? 'Processing 200 cases across 6 agents'
                    : 'Processing 8 cases across 2 agents'}
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

          {optimizedRoutes.length > 0 && googleMapsApiKey && isLoaded && (
            <div className="relative w-full h-full">
              <RouteMap
                routes={optimizedRoutes}
                agentLocations={agentLocations}
                cases={cases}
                unallocatedCases={unallocatedCases}
                routesVersion={routesVersion}
                agentSettings={optimizedAgentSettings}
                originalCasePriorities={originalCaseData.current}
              />
            </div>
          )}

          {optimizedRoutes.length > 0 && googleMapsApiKey && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-lg text-gray-700">Loading map...</div>
            </div>
          )}
        </div>

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