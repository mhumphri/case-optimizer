import React, { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData, CasePriority } from './types/route';
import { RouteMap } from './components/RouteMap';
import { RouteDetails } from './components/RouteDetails';
import { Header } from './components/Header';

const RouteOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [error, setError] = useState<string>('');
  const [agentLocations, setAgentLocations] = useState<Location[]>([]);
  const [cases, setCases] = useState<CaseData[]>([]);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
  });

  const handlePriorityChange = (caseId: string, priority: CasePriority) => {
    setCases(prevCases => 
      prevCases.map(c => 
        c.id === caseId ? { ...c, priority } : c
      )
    );
  };

  const optimizeRoutes = async () => {
    setLoading(true);
    setError('');

    // Import location generator utilities
    const { 
      generateMultipleLocations, 
      getShiftTimeWindow,
      getLunchBreakConstraint 
    } = await import('./utils/locationGenerator');

    const { generateCasePriority } = await import('./utils/caseGenerator');

    // Generate 200 random case locations in London with priorities
    const caseLocations = generateMultipleLocations(200);
    
    const initialCases: CaseData[] = caseLocations.map((location, index) => ({
      id: `case-${index + 1}`,
      postcode: location.postcode,
      location: { latitude: location.latitude, longitude: location.longitude },
      priority: generateCasePriority(),
      status: 'pending',
      assignedAgentIndex: null, // Will be updated after optimization
    }));

    const shipments = caseLocations.map((location, index) => ({
      deliveries: [
        {
          arrivalLocation: { 
            latitude: location.latitude, 
            longitude: location.longitude 
          },
          duration: { seconds: 300 }, // 5 minutes per case
          timeWindows: [getShiftTimeWindow()], // Must be completed during shift
        },
      ],
      label: location.postcode,
    }));

    // Fixed agent start/end locations with specific postcodes
    const agentStartLocations = [
      { latitude: 51.4935, longitude: -0.2291, postcode: 'W6 9LI' },
      { latitude: 51.5154, longitude: -0.1755, postcode: 'W2 3EL' },
      { latitude: 51.4484, longitude: 0.0285, postcode: 'SE12 4WH' },
      { latitude: 51.5685, longitude: -0.0141, postcode: 'E10 1PI' },
      { latitude: 51.4658, longitude: -0.0348, postcode: 'SE14 5NP' },
      { latitude: 51.4525, longitude: -0.2280, postcode: 'SW15 7GB' },
    ];

    const shiftTimeWindow = getShiftTimeWindow();
    const lunchBreak = getLunchBreakConstraint();

    const vehicles = agentStartLocations.map((location, index) => ({
      startLocation: { 
        latitude: location.latitude, 
        longitude: location.longitude 
      },
      endLocation: { 
        latitude: location.latitude, 
        longitude: location.longitude 
      },
      label: `Agent ${index + 1} (${location.postcode})`,
      startTimeWindows: [shiftTimeWindow], // Shift starts at 9am
      endTimeWindows: [shiftTimeWindow], // Shift ends at 5pm
      breakRule: {
        breakRequests: [
          {
            earliestStartTime: lunchBreak.startTime,
            latestStartTime: { seconds: lunchBreak.startTime.seconds + 3600 }, // Lunch between 12pm-1pm
            minDuration: lunchBreak.duration,
          },
        ],
      },
    }));

    // Store agent locations
    setAgentLocations(vehicles.map(v => v.startLocation));

    const requestBody = {
      model: {
        shipments,
        vehicles,
      },
    };

    try {
      console.log('📤 Sending optimization request...');
      
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
          const location = shipments[shipmentIndex]?.deliveries[0]?.arrivalLocation;
          
          return {
            shipmentIndex: visit.shipmentIndex,
            shipmentLabel: visit.shipmentLabel || shipments[shipmentIndex]?.label || `Stop ${shipmentIndex + 1}`,
            startTime: visit.startTime,
            arrivalLocation: location,
          };
        }) || [],
        metrics: {
          travelDuration: route.metrics?.travelDuration || { seconds: 0 },
          travelDistance: route.metrics?.travelDistanceMeters || 0,
        },
      })) || [];

      // Update case assignments based on optimization results
      const updatedCases = initialCases.map(caseData => {
        // Find which agent was assigned this case
        const assignedRouteIndex = routes.findIndex(route => 
          route.visits.some(visit => {
            const shipmentIndex = visit.shipmentIndex;
            return initialCases[shipmentIndex]?.id === caseData.id;
          })
        );

        return {
          ...caseData,
          assignedAgentIndex: assignedRouteIndex >= 0 ? assignedRouteIndex : null,
        };
      });

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
                {loading ? '⏳ Optimizing...' : '🚀 Optimize Cases'}
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
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizer;