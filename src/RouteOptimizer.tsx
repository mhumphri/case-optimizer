import React, { useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData, CasePriority, PriorityChange } from './types/route';
import { RouteMap } from './components/RouteMap';
import { RouteDetails } from './components/RouteDetails';
import { Header } from './components/Header';

const RouteOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [error, setError] = useState<string>('');
  const [agentLocations, setAgentLocations] = useState<Location[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [priorityChanges, setPriorityChanges] = useState<PriorityChange[]>([]);
  
  // Store original case priorities for change tracking
  const originalPriorities = useRef<Map<string, CasePriority>>(new Map());

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
      setPriorityChanges(prev => {
        const originalPriority = originalPriorities.current.get(caseId);
        if (!originalPriority) return prev;
        
        // Remove any existing change for this case
        const filteredChanges = prev.filter(change => change.caseId !== caseId);
        
        // If new priority is same as original, no change to track
        if (newPriority === originalPriority) {
          return filteredChanges;
        }
        
        // Otherwise, add/update the change
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

  const handleDeleteChange = (caseId: string) => {
    // Get the original priority
    const originalPriority = originalPriorities.current.get(caseId);
    if (!originalPriority) return;
    
    // Restore the case to its original priority
    setCases(prevCases => 
      prevCases.map(c => 
        c.id === caseId ? { ...c, priority: originalPriority } : c
      )
    );
    
    // Remove the change from the list
    setPriorityChanges(prev => prev.filter(change => change.caseId !== caseId));
  };

  const handleRecalculate = async () => {
    try {
      // Re-run optimization with current case priorities
      await optimizeRoutes(cases);
      
      // Clear changes list only after successful recalculation
      setPriorityChanges([]);
    } catch (error) {
      // Keep changes visible if recalculation fails
      console.error('Recalculation failed:', error);
    }
  };

  const optimizeRoutes = async (existingCases?: CaseData[]) => {
    setLoading(true);
    setError('');

    // Clear changes if this is a new optimization (not a recalculation)
    if (!existingCases) {
      setPriorityChanges([]);
    }

    // Import utilities
    const { 
      generateMultiplePostcodes, 
      getShiftTimeWindow,
      getLunchBreakConstraint 
    } = await import('./utils/locationGenerator');

    const { generateCasePriority } = await import('./utils/caseGenerator');
    const { getPenaltyCost } = await import('./utils/priorityMapping');
    const { geocodePostcodes } = await import('./utils/geocoding');

    let initialCases: CaseData[];

    // Use existing cases if recalculating, otherwise generate new ones
    if (existingCases && existingCases.length > 0) {
      initialCases = existingCases;
      console.log('🔄 Recalculating with updated priorities...');
      console.log(`   ${priorityChanges.length} priority changes to apply`);
      
      // Log the changes
      priorityChanges.forEach(change => {
        console.log(`   - ${change.casePostcode}: ${change.oldPriority} → ${change.newPriority}`);
      });
    } else {
      // Generate 200 random postcodes from the real postcode list
      console.log('📍 Generating cases from real postcodes...');
      const postcodes = generateMultiplePostcodes(200);
      
      initialCases = postcodes.map((postcodeCase, index) => ({
        id: `case-${index + 1}`,
        postcode: postcodeCase.postcode,
        priority: generateCasePriority(),
        status: 'pending' as const,
        assignedAgentIndex: null,
      }));

      // Geocode all postcodes (cases + agents)
      console.log('🌍 Geocoding postcodes...');
      const agentPostcodes = ['W6 9LI', 'W2 3EL', 'SE12 4WH', 'E10 1PI', 'SE14 5NP', 'SW15 7GB'];
      const allPostcodes = [...new Set([...postcodes.map(p => p.postcode), ...agentPostcodes])];
      
      const geocodedLocations = await geocodePostcodes(allPostcodes, (completed, total) => {
        console.log(`   Geocoded ${completed}/${total} postcodes`);
      });

      console.log(`✅ Geocoded ${geocodedLocations.size} unique postcodes`);

      // Add geocoded locations to cases
      initialCases = initialCases.map(c => ({
        ...c,
        location: geocodedLocations.get(c.postcode),
      }));

      // Store original priorities for change tracking
      originalPriorities.current = new Map(
        initialCases.map(c => [c.id, c.priority])
      );

      // Store geocoded agent locations
      const agentLocs = agentPostcodes.map(pc => geocodedLocations.get(pc)).filter(Boolean) as Location[];
      setAgentLocations(agentLocs);
    }

    // Filter out cases without coordinates
    const casesWithCoords = initialCases.filter(c => c.location);
    if (casesWithCoords.length < initialCases.length) {
      console.warn(`⚠️  ${initialCases.length - casesWithCoords.length} cases failed to geocode and will be skipped`);
    }

    const shipments = casesWithCoords.map((caseData) => ({
      deliveries: [
        {
          arrivalLocation: { 
            latitude: caseData.location!.latitude, 
            longitude: caseData.location!.longitude 
          },
          duration: { seconds: 300 }, // 5 minutes per case
          timeWindows: [getShiftTimeWindow()], // Must be completed during shift
        },
      ],
      label: caseData.postcode,
      // Penalty cost for NOT completing this delivery (based on priority)
      penaltyCost: getPenaltyCost(caseData.priority),
    }));

    // Agent postcodes
    const agentPostcodes = ['W6 9LI', 'W2 3EL', 'SE12 4WH', 'E10 1PI', 'SE14 5NP', 'SW15 7GB'];
    
    // Get agent locations (already geocoded above for new optimization, or from state for recalculation)
    const agentLocs = existingCases && agentLocations.length > 0 
      ? agentLocations 
      : agentPostcodes.map(pc => {
          const loc = initialCases[0]?.location ? 
            (async () => {
              const { geocodePostcode } = await import('./utils/geocoding');
              return await geocodePostcode(pc);
            })() : null;
          return loc;
        });

    const shiftTimeWindow = getShiftTimeWindow();
    const lunchBreak = getLunchBreakConstraint();

    const vehicles = agentPostcodes.map((postcode, index) => ({
      startLocation: agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 }, // Fallback to London center
      endLocation: agentLocations[index] || { latitude: 51.5074, longitude: -0.1278 },
      label: `Agent ${index + 1} (${postcode})`,
      startTimeWindows: [shiftTimeWindow],
      endTimeWindows: [shiftTimeWindow],
      breakRule: {
        breakRequests: [
          {
            earliestStartTime: lunchBreak.startTime,
            latestStartTime: { seconds: lunchBreak.startTime.seconds + 3600 },
            minDuration: lunchBreak.duration,
          },
        ],
      },
    }));

    const requestBody = {
      model: {
        shipments,
        vehicles,
      },
    };

    try {
      console.log('📤 Sending optimization request...');
      
      // Log priority distribution
      const priorityDistribution = {
        high: initialCases.filter(c => c.priority === 'high').length,
        medium: initialCases.filter(c => c.priority === 'medium').length,
        low: initialCases.filter(c => c.priority === 'low').length,
      };
      console.log('📊 Priority Distribution:', priorityDistribution);
      console.log('💰 Penalty Costs: High=£1000, Medium=£300, Low=£100');
      
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
      
      const routes: OptimizedRoute[] = data.routes?.map((route: any, index: number) => ({
        vehicleLabel: route.vehicleLabel || `Vehicle ${index + 1}`,
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

      // Update case assignments based on optimization results
      const updatedCases = initialCases.map(caseData => {
        // Find which agent was assigned this case and when
        let assignedRouteIndex = -1;
        let deliveryTime: string | { seconds: number } | undefined = undefined;

        for (let routeIdx = 0; routeIdx < routes.length; routeIdx++) {
          const visit = routes[routeIdx].visits.find(v => {
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

      setOptimizedRoutes(routes);
      setCases(updatedCases);

      setOptimizedRoutes(routes);
      setCases(updatedCases);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        
        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="p-4 bg-red-50 rounded-lg border border-red-400 max-w-[600px]">
            <strong>❌ Map Loading Error:</strong> 
            <p>Failed to load Google Maps. Please check your API key.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      
      {/* Two Column Layout - fills remaining space */}
      <div className="flex flex-1 min-h-0">
        {/* Left Column - Map */}
        <div className="flex-1 relative min-w-0 h-full flex flex-col">
          {!googleMapsApiKey && (
            <div className="absolute top-5 left-5 right-5 z-10 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
              <strong>⚠️ Google Maps API Key Missing:</strong>
              <p className="mt-2 mb-0">
                Add <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file to enable the map.
              </p>
            </div>
          )}

          {/* Test Scenario and Button - Only show when no routes optimized */}
          {optimizedRoutes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center bg-white p-8 rounded-lg shadow-md">
              <div className="mb-5 p-4 bg-blue-50 rounded-lg">
                <p className="m-0">
                  <strong>Test Scenario:</strong> 200 random London cases across 6 agents
                  <br />
                  <small className="text-gray-600">
                    • 8-hour shift (9am-5pm) • 45-minute lunch break • 5 minutes per case
                  </small>
                  <br />
                  <small className="text-gray-600 mt-2 block">
                    • Fixed agent locations: W6 9LI, W2 3EL, SE12 4WH, E10 1PI, SE14 5NP, SW15 7GB
                  </small>
                  <br />
                  <small className="text-gray-600 mt-1 block">
                    • Priority-based optimization: High (£1000) | Medium (£300) | Low (£100)
                  </small>
                </p>
              </div>

              <button
                onClick={optimizeRoutes}
                disabled={loading}
                className={`px-6 py-3 text-base font-bold text-white border-none rounded ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 cursor-pointer hover:bg-blue-600'
                }`}
              >
                {loading ? '⏳ Geocoding & Optimizing...' : '🚀 Optimize Cases'}
              </button>
            </div>
          )}

          {error && (
            <div className="absolute top-5 left-5 right-5 z-10 p-4 bg-red-50 rounded-lg border border-red-400">
              <strong>❌ Error:</strong> 
              <div className="mt-2 font-mono text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Map Section - Fill entire container */}
          {optimizedRoutes.length > 0 && googleMapsApiKey && isLoaded && (
            <div className="absolute inset-0">
              <RouteMap routes={optimizedRoutes} agentLocations={agentLocations} />
            </div>
          )}

          {/* Map Loading State */}
          {optimizedRoutes.length > 0 && googleMapsApiKey && !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p>Loading map...</p>
            </div>
          )}
        </div>

        {/* Right Column - Tabbed Interface */}
        {optimizedRoutes.length > 0 && (
          <div className="w-[440px] min-w-[340px] max-w-[35%] bg-gray-50 border-l border-gray-300 shrink-0 flex flex-col">
            <RouteDetails 
              routes={optimizedRoutes} 
              cases={cases}
              onPriorityChange={handlePriorityChange}
              changes={priorityChanges}
              onRecalculate={handleRecalculate}
              onDeleteChange={handleDeleteChange}
              isRecalculating={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizer;