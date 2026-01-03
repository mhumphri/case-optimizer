import React, { useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import type { Location, OptimizedRoute } from '../types/route';
import { formatTime } from '../utils/formatters';

interface RouteMapProps {
  routes: OptimizedRoute[];
  agentLocations: Location[];
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

export const RouteMap: React.FC<RouteMapProps> = ({ routes, agentLocations }) => {
  const [selectedMarker, setSelectedMarker] = useState<{ routeIndex: number; visitIndex: number } | null>(null);

  const getRoutePath = (route: OptimizedRoute, agentLocation: Location) => {
    const path = [];

    if (agentLocation) {
      path.push({ lat: agentLocation.latitude, lng: agentLocation.longitude });
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
      path.push({ lat: agentLocation.latitude, lng: agentLocation.longitude });
    }

    return path;
  };

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
      >
        {/* Agent Start Markers */}
        {agentLocations.map((location, index) => (
          <Marker
            key={`agent-${index}`}
            position={{ lat: location.latitude, lng: location.longitude }}
            label={{
              text: '👤',
              fontSize: '20px',
            }}
            title={routes[index]?.vehicleLabel || `Agent ${index + 1}`}
          />
        ))}

        {/* Case Location Markers for all routes */}
        {routes.map((route, routeIndex) => 
          route.visits.map((visit, visitIndex) => {
            if (!visit.arrivalLocation) return null;
            
            const color = ROUTE_COLORS[routeIndex % ROUTE_COLORS.length];
            const isSelected = selectedMarker?.routeIndex === routeIndex && selectedMarker?.visitIndex === visitIndex;
            
            return (
              <Marker
                key={`${routeIndex}-${visitIndex}`}
                position={{
                  lat: visit.arrivalLocation.latitude,
                  lng: visit.arrivalLocation.longitude,
                }}
                label={{
                  text: `${visitIndex + 1}`,
                  color: 'white',
                  fontWeight: 'bold',
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedMarker({ routeIndex, visitIndex })}
              >
                {isSelected && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div>
                      <strong>{route.vehicleLabel}</strong>
                      <p className="my-1">Case {visitIndex + 1}: {visit.shipmentLabel}</p>
                      {formatTime(visit.startTime) && (
                        <p className="my-1 text-xs text-gray-600">
                          Arrival: {formatTime(visit.startTime)}
                        </p>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            );
          })
        )}

        {/* Route Polylines for all agents */}
        {routes.map((route, index) => {
          if (!agentLocations[index]) return null;
          
          return (
            <Polyline
              key={`route-${index}`}
              path={getRoutePath(route, agentLocations[index])}
              options={{
                strokeColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
                strokeOpacity: 0.6,
                strokeWeight: 3,
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
};