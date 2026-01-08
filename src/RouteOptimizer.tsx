// RouteOptimizer.tsx - COMPLETE FILE with responsive mobile/desktop views
import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData, CasePriority, CaseChange, TimeSlot, AgentSettings, AgentChange, ScenarioConfig, ScenarioType } from './types/route';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { CaseController } from './components/CaseController';
import { CompletionModal } from './components/CompletionModal';
import { Toast } from './components/Toast';

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
    agentPostcodes: ['W1A 1AA', 'SE14 5NP','SW1P 4DR'],
    defaultStartTime: '10:30',
    defaultEndTime: '14:00',
    defaultLunchDuration: 45,
    agentFinishPostcodes: ['EC1A 1BB', undefined, undefined],
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
  const [isMobile, setIsMobile] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionSummary, setCompletionSummary] = useState({
    activeAgents: 0,
    totalCases: 0,
    allocatedCases: 0,
    unallocatedCases: 0,
    timeWindow: { start: '09:00', end: '17:00' },
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Store original case data and agent settings for change tracking
  const originalCaseData = useRef<Map<string, { priority: CasePriority; deliverySlot?: TimeSlot }>>(new Map());
  const originalAgentSettings = useRef<AgentSettings[]>([]);
  const currentScenarioConfig = useRef<ScenarioConfig | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
  });

  // Detect screen size changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    
    const handleScreenChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleScreenChange);

    return () => {
      mediaQuery.removeEventListener('change', handleScreenChange);
    };
  }, []);

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

  const handleReset = () => {
    // Reset all state
    setOptimizedRoutes([]);
    setCases([]);
    setCaseChanges([]);
    setAgentSettings([]);
    setAgentChanges([]);
    setAgentLocations([]);
    setUnallocatedCases([]);
    setRoutesVersion(0);
    setOptimizedAgentSettings([]);
    setSelectedScenario(null);
    setError('');
    setShowCompletionModal(false);
    setToastMessage(null);
    
    // Clear refs
    originalCaseData.current = new Map();
    originalAgentSettings.current = [];
    currentScenarioConfig.current = null;
  };

  const handleRecalculate = async () => {
    try {
      await optimizeRoutes(cases, agentSettings);
      setCaseChanges([]);
      setAgentChanges([]);
    } catch (error) {
      console.error('Recalculation failed:', error);
      setToastMessage(error instanceof Error ? error.message : 'Recalculation failed');
    }
  };

  const handleScenarioSelect = (scenarioType: ScenarioType) => {
    setSelectedScenario(scenarioType);
    currentScenarioConfig.current = SCENARIOS[scenarioType];
    optimizeRoutes(undefined, undefined, scenarioType);
  };

  // Helper function to reset state to last successful optimization
  const resetToLastSuccessfulState = () => {
    console.log('🔄 Resetting to previous state...');
    
    // Restore cases to their original values
    const restoredCases = cases.map(caseData => {
      const original = originalCaseData.current.get(caseData.id);
      if (original) {
        return {
          ...caseData,
          priority: original.priority,
          deliverySlot: original.deliverySlot,
        };
      }
      return caseData;
    });
    setCases(restoredCases);
    
    // Restore agent settings to their original values
    setAgentSettings(originalAgentSettings.current.map(s => ({ ...s })));
    
    // Clear all pending changes
    setCaseChanges([]);
    setAgentChanges([]);
    
    console.log('✅ State restored to last successful optimization');
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

    // Validate at least one active agent
    const settingsToCheck = existingAgentSettings || agentSettings;
    const activeAgentsCount = settingsToCheck.filter(s => s.active).length;
    if (activeAgentsCount === 0 && existingCases) {
      setToastMessage('Please activate at least one agent before recalculating routes');
      resetToLastSuccessfulState();
      setLoading(false);
      return;
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

      // Geocode any custom agent locations that don't have coordinates yet
      const customPostcodes = new Set<string>();
      currentAgentSettings.forEach(settings => {
        if (settings.startPostcode && !settings.startLocation) {
          customPostcodes.add(settings.startPostcode);
        }
        if (settings.finishPostcode && !settings.finishLocation) {
          customPostcodes.add(settings.finishPostcode);
        }
      });

      if (customPostcodes.size > 0) {
        console.log(`🌍 Geocoding ${customPostcodes.size} custom agent locations...`);
        const customLocations = await geocodePostcodes(Array.from(customPostcodes));
        
        const failedCustomLocations: string[] = [];
        currentAgentSettings = currentAgentSettings.map(settings => {
          const updated = { ...settings };
          
          if (settings.startPostcode && !settings.startLocation) {
            const location = customLocations.get(settings.startPostcode);
            if (location) {
              updated.startLocation = location;
            } else {
              failedCustomLocations.push(`Start: ${settings.startPostcode}`);
            }
          }
          
          if (settings.finishPostcode && !settings.finishLocation) {
            const location = customLocations.get(settings.finishPostcode);
            if (location) {
              updated.finishLocation = location;
            } else {
              failedCustomLocations.push(`Finish: ${settings.finishPostcode}`);
            }
          }
          
          return updated;
        });

        if (failedCustomLocations.length > 0) {
          setToastMessage(`Warning: Failed to geocode ${failedCustomLocations.length} agent location(s): ${failedCustomLocations.join(', ')}`);
        }
      }
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

      const agentLocs = scenario.agentPostcodes.map(pc => {
        const location = geocodedLocations.get(pc);
        if (!location) {
          console.warn(`⚠️  Failed to geocode agent postcode: ${pc}`);
        }
        return location;
      });
      
      const failedAgentLocations: string[] = [];
      scenario.agentPostcodes.forEach((pc, index) => {
        if (!geocodedLocations.get(pc)) {
          failedAgentLocations.push(`Agent ${index + 1} start: ${pc}`);
        }
      });
      
      setAgentLocations(agentLocs as (Location | undefined)[]);

      currentAgentSettings = currentAgentSettings.map((settings, index) => {
        if (settings.finishPostcode) {
          const finishLocation = geocodedLocations.get(settings.finishPostcode);
          if (!finishLocation) {
            console.warn(`⚠️  Failed to geocode agent finish location: ${settings.finishPostcode}`);
            failedAgentLocations.push(`Agent ${index + 1} finish: ${settings.finishPostcode}`);
          }
          return {
            ...settings,
            finishLocation,
          };
        }
        return settings;
      });
      
      if (failedAgentLocations.length > 0) {
        setToastMessage(`Warning: Failed to geocode ${failedAgentLocations.length} agent location(s): ${failedAgentLocations.join(', ')}`);
      }

      setAgentSettings(currentAgentSettings);
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));
    }

    const casesWithCoords = initialCases.filter(c => c.location);
    const failedGeocodesCount = initialCases.length - casesWithCoords.length;
    
    if (casesWithCoords.length === 0) {
      setToastMessage('Error: No cases could be geocoded. Cannot proceed with optimization.');
      
      // Reset to previous state if this was a recalculation
      if (existingCases && existingCases.length > 0) {
        resetToLastSuccessfulState();
      }
      
      setLoading(false);
      return;
    }
    
    if (failedGeocodesCount > 0) {
      console.warn(`⚠️ ${failedGeocodesCount} cases failed to geocode and will be skipped`);
      setToastMessage(`Warning: ${failedGeocodesCount} of ${initialCases.length} case(s) could not be geocoded and were excluded`);
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

        const startLocation = settings.startLocation 
          ? settings.startLocation 
          : agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 };

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

      //http://localhost:3001/api/optimize-routes
      //https://applied-plexus-360100.nw.r.appspot.com/api/optimize-routes
      const response = await fetch('https://applied-plexus-360100.nw.r.appspot.com/api/optimize-routes', {
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
      
      setOptimizedAgentSettings(currentAgentSettings.map(s => ({ ...s })));
      
      originalCaseData.current = new Map(
        updatedCases.map(c => [c.id, { priority: c.priority, deliverySlot: c.deliverySlot }])
      );
      
      originalAgentSettings.current = currentAgentSettings.map(s => ({ ...s }));

      // Calculate summary statistics for modal
      const activeAgentCount = currentAgentSettings.filter(s => s.active).length;
      const allocatedCount = updatedCases.filter(c => c.assignedAgentIndex !== null).length;
      const unallocatedCount = updatedCases.filter(c => c.assignedAgentIndex === null).length;
      
      // Get time window from agent settings (use the most common time window)
      const activeSettings = currentAgentSettings.filter(s => s.active);
      const timeWindow = activeSettings.length > 0
        ? {
            start: activeSettings[0].startTime,
            end: activeSettings[0].endTime,
          }
        : { start: scenario.defaultStartTime, end: scenario.defaultEndTime };

      setCompletionSummary({
        activeAgents: activeAgentCount,
        totalCases: updatedCases.length,
        allocatedCases: allocatedCount,
        unallocatedCases: unallocatedCount,
        timeWindow,
      });

      // Show completion modal
      setShowCompletionModal(true);
    } catch (err) {
      console.error('❌ Error:', err);
      setToastMessage(err instanceof Error ? err.message : 'An error occurred during optimization');
      
      // If this was a recalculation (not initial load), reset to previous state
      if (existingCases && existingCases.length > 0) {
        resetToLastSuccessfulState();
      }
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

  // MOBILE VIEW - Shown when screen width < 768px
  if (isMobile) {
    return (
      <div className="flex flex-col bg-gray-50" style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}>
        <Header onReset={handleReset} showReset={optimizedRoutes.length > 0} />
        
        {optimizedRoutes.length === 0 && !loading && (
          <LandingPage onScenarioSelect={handleScenarioSelect} />
        )}

        {loading && optimizedRoutes.length === 0 && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center px-4">
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Geocoding & Optimizing...</h2>
              <p className="text-gray-600 text-sm">
                {selectedScenario === 'full'
                  ? 'Processing 200 cases across 6 agents'
                  : 'Processing 8 cases across 2 agents'}
              </p>
            </div>
          </div>
        )}

        {optimizedRoutes.length > 0 && (
          <CaseController
            routes={optimizedRoutes}
            agentLocations={agentLocations}
            cases={cases}
            agentSettings={agentSettings}
            optimizedAgentSettings={optimizedAgentSettings}
            caseChanges={caseChanges}
            agentChanges={agentChanges}
            unallocatedCases={unallocatedCases}
            routesVersion={routesVersion}
            originalCasePriorities={originalCaseData.current}
            onPriorityChange={handlePriorityChange}
            onSlotChange={handleSlotChange}
            onAgentSettingsChange={handleAgentSettingsChange}
            onRecalculate={handleRecalculate}
            onDeleteCaseChange={handleDeleteCaseChange}
            onDeleteAgentChange={handleDeleteAgentChange}
            onUnallocatedCasesUpdate={setUnallocatedCases}
            isRecalculating={loading}
            googleMapsApiKey={googleMapsApiKey}
            isLoaded={isLoaded}
            isMobile={true}
          />
        )}

        <CompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          activeAgents={completionSummary.activeAgents}
          totalCases={completionSummary.totalCases}
          allocatedCases={completionSummary.allocatedCases}
          unallocatedCases={completionSummary.unallocatedCases}
          timeWindow={completionSummary.timeWindow}
        />

        {toastMessage && (
          <Toast
            message={toastMessage}
            type="error"
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    );
  }

  // DESKTOP VIEW - Existing full interface
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onReset={handleReset} showReset={optimizedRoutes.length > 0} />

      {/* Landing Page */}
      {optimizedRoutes.length === 0 && !loading && (
        <LandingPage onScenarioSelect={handleScenarioSelect} />
      )}

      {/* Loading State During Optimization */}
      {loading && optimizedRoutes.length === 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
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

      {/* Case Controller - Map and Route Details */}
      {optimizedRoutes.length > 0 && (
        <CaseController
          routes={optimizedRoutes}
          agentLocations={agentLocations}
          cases={cases}
          agentSettings={agentSettings}
          optimizedAgentSettings={optimizedAgentSettings}
          caseChanges={caseChanges}
          agentChanges={agentChanges}
          unallocatedCases={unallocatedCases}
          routesVersion={routesVersion}
          originalCasePriorities={originalCaseData.current}
          onPriorityChange={handlePriorityChange}
          onSlotChange={handleSlotChange}
          onAgentSettingsChange={handleAgentSettingsChange}
          onRecalculate={handleRecalculate}
          onDeleteCaseChange={handleDeleteCaseChange}
          onDeleteAgentChange={handleDeleteAgentChange}
          onUnallocatedCasesUpdate={setUnallocatedCases}
          isRecalculating={loading}
          googleMapsApiKey={googleMapsApiKey}
          isLoaded={isLoaded}
          isMobile={false}
        />
      )}

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        activeAgents={completionSummary.activeAgents}
        totalCases={completionSummary.totalCases}
        allocatedCases={completionSummary.allocatedCases}
        unallocatedCases={completionSummary.unallocatedCases}
        timeWindow={completionSummary.timeWindow}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default RouteOptimizer;