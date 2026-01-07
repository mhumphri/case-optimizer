// RouteMap.tsx - FIXED: Agent marker rendering now properly aligned
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, OverlayView } from '@react-google-maps/api';
import type { Location, OptimizedRoute, CaseData, AgentSettings, CasePriority, TimeSlot } from '../types/route';
import { formatTime } from '../utils/formatters';

interface RouteMapProps {
  routes: OptimizedRoute[];
  agentLocations: Location[];
  cases: CaseData[];
  unallocatedCases?: Array<CaseData & { unallocatedNumber: number }>;
  routesVersion?: number;
  agentSettings: AgentSettings[];
  originalCasePriorities: Map<string, { priority: CasePriority; deliverySlot?: TimeSlot }>;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278,
};

const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#e8f4f8' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#b8d4e8' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fff4cc' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#c8e6c9' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }]
  }
];

const ROUTE_COLORS = [
  '#4285f4',
  '#ea4335',
  '#fbbc04',
  '#34a853',
  '#ff6d00',
  '#9c27b0',
  '#00bcd4',
  '#e91e63',
];

const createAgentMarkerIcon = (color: string): google.maps.Icon => {
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

const createFinishMarkerIcon = (color: string): google.maps.Icon => {
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(21.5, 20) scale(0.75)">
        <rect x="-10" y="-8" width="1.5" height="18" fill="white"/>
        <g transform="translate(-9, -8)">
          <rect x="0" y="0" width="4" height="3" fill="white"/>
          <rect x="4" y="0" width="4" height="3" fill="#333"/>
          <rect x="8" y="0" width="4" height="3" fill="white"/>
          <rect x="12" y="0" width="4" height="3" fill="#333"/>
          <rect x="0" y="3" width="4" height="3" fill="#333"/>
          <rect x="4" y="3" width="4" height="3" fill="white"/>
          <rect x="8" y="3" width="4" height="3" fill="#333"/>
          <rect x="12" y="3" width="4" height="3" fill="white"/>
          <rect x="0" y="6" width="4" height="3" fill="white"/>
          <rect x="4" y="6" width="4" height="3" fill="#333"/>
          <rect x="8" y="6" width="4" height="3" fill="white"/>
          <rect x="12" y="6" width="4" height="3" fill="#333"/>
          <rect x="0" y="9" width="4" height="3" fill="#333"/>
          <rect x="4" y="9" width="4" height="3" fill="white"/>
          <rect x="8" y="9" width="4" height="3" fill="#333"/>
          <rect x="12" y="9" width="4" height="3" fill="white"/>
        </g>
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
  cases,
  unallocatedCases = [],
  routesVersion = 0,
  agentSettings,
  originalCasePriorities,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'allocated' | 'unallocated';
    routeIndex?: number;
    visitIndex?: number;
    caseId?: string;
  } | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;

      // ✅ FIXED: Iterate over routes to maintain proper alignment with agentSettings
      routes.forEach((route, index) => {
        const settings = agentSettings[index];
        const defaultLocation = agentLocations[index];
        const startLocation = settings?.startLocation || defaultLocation;
        
        if (startLocation) {
          bounds.extend({ lat: startLocation.latitude, lng: startLocation.longitude });
          hasPoints = true;
        }
      });

      agentSettings.forEach(settings => {
        if (settings.finishLocation) {
          bounds.extend({ 
            lat: settings.finishLocation.latitude, 
            lng: settings.finishLocation.longitude 
          });
          hasPoints = true;
        }
      });

      routes.forEach(route => {
        route.visits.forEach(visit => {
          if (visit.arrivalLocation) {
            bounds.extend({ 
              lat: visit.arrivalLocation.latitude, 
              lng: visit.arrivalLocation.longitude 
            });
            hasPoints = true;
          }
        });
      });

      unallocatedCases.forEach(caseData => {
        if (caseData.location) {
          bounds.extend({ 
            lat: caseData.location.latitude, 
            lng: caseData.location.longitude 
          });
          hasPoints = true;
        }
      });

      if (hasPoints) {
        mapRef.current.fitBounds(bounds, {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [routes, agentLocations, unallocatedCases, routesVersion, agentSettings]);

  const getRoutePath = (route: OptimizedRoute, agentLocation: Location, agentIndex: number) => {
    const path = [];

    // ✅ Use custom start location if available
    const settings = agentSettings[agentIndex];
    const startLocation = settings?.startLocation || agentLocation;

    if (startLocation) {
      path.push({
        lat: startLocation.latitude,
        lng: startLocation.longitude,
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

    const finishLocation = settings?.finishLocation;
    const endLocation = finishLocation || startLocation;
    
    if (endLocation) {
      path.push({
        lat: endLocation.latitude,
        lng: endLocation.longitude,
      });
    }

    return path;
  };

  const getPolylineKey = (index: number) => {
    return `polyline-${index}-v${routesVersion}`;
  };

  const getCasePriority = (postcode: string): string => {
    const caseData = cases.find(c => c.postcode === postcode);
    if (!caseData) return 'normal';
    
    // Use original priority from last optimization, not current priority with pending changes
    const originalData = originalCasePriorities.get(caseData.id);
    return originalData?.priority || caseData.priority;
  };

  const unallocatedMarkers = unallocatedCases
    .filter(caseData => !!caseData.location)
    .map((caseData) => {
      const isSelected =
        selectedMarker?.type === 'unallocated' &&
        selectedMarker?.caseId === caseData.id;

      // Use original priority from last optimization
      const originalData = originalCasePriorities.get(caseData.id);
      const displayPriority = originalData?.priority || caseData.priority;
      const isHighPriority = displayPriority === 'high';

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
              scale: isHighPriority ? 13 : 10,
              fillColor: '#6b7280',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: isHighPriority ? 4 : 2,
            }}
            onClick={() => setSelectedMarker({ type: 'unallocated', caseId: caseData.id })}
            zIndex={isHighPriority ? 1000 : 100}
          />
          {isHighPriority && (
            <OverlayView
              position={{
                lat: caseData.location!.latitude,
                lng: caseData.location!.longitude,
              }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    right: '-18px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: '#dc2626',
                    borderRadius: '50%',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  !
                </div>
              </div>
            </OverlayView>
          )}
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
                <div>Priority: {displayPriority.toUpperCase()}</div>
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      );
    });

  return (
    <GoogleMap
      key={`map-v${routesVersion}`}
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={11}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      options={{
        styles: mapStyles,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        disableDefaultUI: false,
      }}
    >
      {/* Agent Start Markers - FIXED: Now iterates over routes to maintain alignment */}
      {routes.map((route, index) => {
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const settings = agentSettings[index];
        const defaultLocation = agentLocations[index];
        
        // ✅ Use custom start location from settings if available, otherwise use default
        const startLocation = settings?.startLocation || defaultLocation;
        
        if (!startLocation) return null;
        
        return (
          <Marker
            key={`agent-start-${index}`}
            position={{
              lat: startLocation.latitude,
              lng: startLocation.longitude,
            }}
            icon={createAgentMarkerIcon(color)}
            title={`Agent ${index + 1} Start${settings?.startPostcode ? ` (${settings.startPostcode})` : ''}`}
            zIndex={50}
          />
        );
      })}

      {/* Agent Finish Markers */}
      {agentSettings.map((settings, index) => {
        if (!settings.finishLocation) return null;
        
        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        return (
          <Marker
            key={`agent-finish-${index}`}
            position={{
              lat: settings.finishLocation.latitude,
              lng: settings.finishLocation.longitude,
            }}
            icon={createFinishMarkerIcon(color)}
            title={`Agent ${index + 1} Finish`}
            zIndex={50}
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

          const isHighPriority = getCasePriority(visit.shipmentLabel) === 'high';

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
                  scale: isHighPriority ? 13 : 10,
                  fillColor: color,
                  fillOpacity: 0.9,
                  strokeColor: '#ffffff',
                  strokeWeight: isHighPriority ? 4 : 2,
                }}
                onClick={() => setSelectedMarker({ type: 'allocated', routeIndex, visitIndex })}
                zIndex={isHighPriority ? 1000 : 100}
              />
              {isHighPriority && (
                <OverlayView
                  position={{
                    lat: visit.arrivalLocation.latitude,
                    lng: visit.arrivalLocation.longitude,
                  }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    style={{
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        right: '-18px',
                        width: '16px',
                        height: '16px',
                        backgroundColor: '#dc2626',
                        borderRadius: '50%',
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'white',
                      }}
                    >
                      !
                    </div>
                  </div>
                </OverlayView>
              )}
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

      {/* Route Polylines for all agents */}
      {routes.map((route, index) => {
        if (!agentLocations[index] || route.visits.length === 0) return null;

        const path = getRoutePath(route, agentLocations[index], index);
        if (path.length < 2) return null;

        return (
          <Polyline
            key={getPolylineKey(index)}
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