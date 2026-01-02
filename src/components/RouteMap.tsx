import React, { useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import type { Location, OptimizedRoute } from '../types/route';
import { formatTime } from '../utils/formatters';

interface RouteMapProps {
  routes: OptimizedRoute[];
  vehicleLocations: Location[];
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 51.5074, // London
  lng: -0.1278,
};

// Colors for different vehicle routes
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

export const RouteMap: React.FC<RouteMapProps> = ({ routes, vehicleLocations }) => {
  const [selectedMarker, setSelectedMarker] = useState<{ routeIndex: number; visitIndex: number } | null>(null);

  const getRoutePath = (route: OptimizedRoute, vehicleLocation: Location) => {
    const path = [];

    if (vehicleLocation) {
      path.push({ lat: vehicleLocation.latitude, lng: vehicleLocation.longitude });
    }

    route.visits.forEach(visit => {
      if (visit.arrivalLocation) {
        path.push({
          lat: visit.arrivalLocation.latitude,
          lng: visit.arrivalLocation.longitude,
        });
      }
    });

    if (vehicleLocation) {
      path.push({ lat: vehicleLocation.latitude, lng: vehicleLocation.longitude });
    }

    return path;
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h2>🗺️ Route Map</h2>
      
      {/* Route Legend */}
      {routes.length > 1 && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          {routes.map((route, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '20px',
                height: '4px',
                backgroundColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
                borderRadius: '2px',
              }} />
              <span style={{ fontSize: '13px', fontWeight: '500' }}>
                {route.vehicleLabel}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
      >
        {/* Vehicle Start Markers */}
        {vehicleLocations.map((location, index) => (
          <Marker
            key={`vehicle-${index}`}
            position={{ lat: location.latitude, lng: location.longitude }}
            label={{
              text: '🚚',
              fontSize: '20px',
            }}
            title={routes[index]?.vehicleLabel || `Vehicle ${index + 1}`}
          />
        ))}

        {/* Delivery Location Markers for all routes */}
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
                      <p style={{ margin: '5px 0' }}>Stop {visitIndex + 1}: {visit.shipmentLabel}</p>
                      {formatTime(visit.startTime) && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
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

        {/* Route Polylines for all vehicles */}
        {routes.map((route, index) => {
          if (!vehicleLocations[index]) return null;
          
          return (
            <Polyline
              key={`route-${index}`}
              path={getRoutePath(route, vehicleLocations[index])}
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