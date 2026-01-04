// components/RouteMap.tsx
import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData } from '../types/route';
import { formatTime } from '../utils/formatters';

interface RouteMapProps {
  routes: OptimizedRoute[];
  agentLocations: Location[];
  unallocatedCases?: Array<CaseData & { unallocatedNumber: number }>;
  routesVersion?: number; // Add this
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 51.5074, // London
  lng: -0.1278,
};

// Colors for different agent routes
const ROUTE_COLORS = [
  '#4285f4', // Blue
  '#ea4335', // Red
  '#fbbc04', // Yellow
  '#34a853', // Green
  '#ff6d00', // Orange
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#e91e63', // Pink
];

// Create a custom marker icon with a person silhouette
const createAgentMarkerIcon = (color: string): google.maps.Icon => {
  // SVG for person icon (from lucide-react User icon path)
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(20, 21) scale(0.8)">
        <path d="M-6 -8 A 6 6 0 1 1 6 -8 A 6 6 0 1 1 -6 -8 Z" fill="white"/>
        <path d="M -10 8 Q -10 0, -6 -2 L 6 -2 Q 10 0, 10 8 Z" fill="white"/>
      </g>
    </svg>
  `;
  
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  };
};

export const RouteMap: React.FC<RouteMapProps> = ({ 
  routes, 
  agentLocations, 
  unallocatedCases = [],
  routesVersion = 0 
}) => {
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'allocated' | 'unallocated';
    routeIndex?: number;
    visitIndex?: number;
    caseId?: string;
  } | null>(null);

  // Add debugging
  useEffect(() => {
    console.log('🗺️ RouteMap - Received unallocated cases:', unallocatedCases.length);
    unallocatedCases.forEach(c => {
      console.log(`  - ${c.postcode} (#${c.unallocatedNumber}) - Location:`, c.location);
    });
  }, [unallocatedCases]);

  const getRoutePath = (route: OptimizedRoute, agentLocation: Location) => {
    const path = [];

    if (agentLocation) {
      path.push({
        lat: agentLocation.latitude,
        lng: agentLocation.longitude,
      });
    }

    route.visits.forEach(visit => {
      if (visit.arrivalLocation) {
        path.push({
          lat: visit.arrivalLocation.latitude,
          lng: visit.arrivalLocation.longitude,
        });
      }
    });

    if (agentLocation) {
      path.push({
        lat: agentLocation.latitude,
        lng: agentLocation.longitude,
      });
    }

    return path;
  };

  // Generate a unique key for each polyline based on route content
  // This ensures old polylines are unmounted when routes change
  const getPolylineKey = (route: OptimizedRoute, index: number) => {
    const visitCount = route.visits.length;
    const firstVisit = route.visits[0]?.shipmentLabel || '';
    const lastVisit = route.visits[route.visits.length - 1]?.shipmentLabel || '';
    return `route-${index}-${visitCount}-${firstVisit}-${lastVisit}-v${routesVersion}`;
  };

  // Process unallocated markers
  console.log('🎨 Rendering RouteMap - unallocated cases to render:', unallocatedCases.length);
  const unallocatedMarkers = unallocatedCases
    .filter(caseData => {
      const hasLocation = !!caseData.location;
      if (!hasLocation) {
        console.warn(`⚠️ Filtering out ${caseData.postcode} - no location`);
      }
      return hasLocation;
    })
    .map((caseData) => {
      console.log(`✏️ Creating marker for unallocated case: ${caseData.postcode} at`, caseData.location);
      
      const isSelected =
        selectedMarker?.type === 'unallocated' &&
        selectedMarker?.caseId === caseData.id;

      return (
        <React.Fragment key={`unallocated-${caseData.id}`}>
          <Marker
            position={{
              lat: caseData.location!.latitude,
              lng: caseData.location!.longitude,
            }}
            label={{
              text: String(caseData.unallocatedNumber),
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#9ca3af', // Gray color for unallocated
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            onClick={() => setSelectedMarker({ type: 'unallocated', caseId: caseData.id })}
          />
          {isSelected && (
            <InfoWindow
              position={{
                lat: caseData.location!.latitude,
                lng: caseData.location!.longitude,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <div>Unallocated Case</div>
                <div>
                  Case {caseData.unallocatedNumber}: {caseData.postcode}
                </div>
                <div>Priority: {caseData.priority.toUpperCase()}</div>
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      );
    });

  console.log('📍 Total unallocated markers created:', unallocatedMarkers.length);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={11}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Agent Start Markers */}
      {agentLocations.map((location, index) => {
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        return (
          <Marker
            key={`agent-${index}`}
            position={{
              lat: location.latitude,
              lng: location.longitude,
            }}
            icon={createAgentMarkerIcon(color)}
            title={`Agent ${index + 1} Start`}
          />
        );
      })}

      {/* Case Location Markers for all routes */}
      {routes.map((route, routeIndex) =>
        route.visits.map((visit, visitIndex) => {
          if (!visit.arrivalLocation) return null;

          const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];
          const isSelected =
            selectedMarker?.type === 'allocated' &&
            selectedMarker?.routeIndex === routeIndex &&
            selectedMarker?.visitIndex === visitIndex;

          return (
            <React.Fragment key={`visit-${routeIndex}-${visitIndex}-${visit.shipmentLabel}`}>
              <Marker
                position={{
                  lat: visit.arrivalLocation.latitude,
                  lng: visit.arrivalLocation.longitude,
                }}
                label={{
                  text: String(visitIndex + 1),
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: color,
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedMarker({ type: 'allocated', routeIndex, visitIndex })}
              />
              {isSelected && (
                <InfoWindow
                  position={{
                    lat: visit.arrivalLocation.latitude,
                    lng: visit.arrivalLocation.longitude,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div>
                    <div>{route.vehicleLabel}</div>
                    <div>
                      Case {visitIndex + 1}: {visit.shipmentLabel}
                    </div>
                    {formatTime(visit.startTime) && (
                      <div>Arrival: {formatTime(visit.startTime)}</div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          );
        })
      )}

      {/* Unallocated Case Markers */}
      {unallocatedMarkers}

      {/* Route Polylines for all agents - Only render if route has visits */}
      {routes.map((route, index) => {
        // Skip if no agent location or no visits
        if (!agentLocations[index] || route.visits.length === 0) return null;

        const path = getRoutePath(route, agentLocations[index]);
        
        // Skip if path is too short (less than 2 points)
        if (path.length < 2) return null;

        return (
          <Polyline
            key={getPolylineKey(route, index)}
            path={path}
            options={{
              strokeColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
              strokeWeight: 3,
              strokeOpacity: 0.7,
            }}
          />
        );
      })}
    </GoogleMap>
  );
};