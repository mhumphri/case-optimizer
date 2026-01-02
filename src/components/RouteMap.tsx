import React, { useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import type { Location, OptimizedRoute } from '../types/route';
import { formatTime } from '../utils/formatters';

interface RouteMapProps {
  route: OptimizedRoute;
  vehicleLocation: Location | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

export const RouteMap: React.FC<RouteMapProps> = ({ route, vehicleLocation }) => {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

  const getRoutePath = () => {
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
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
      >
        {/* Vehicle Start Marker */}
        {vehicleLocation && (
          <Marker
            position={{ lat: vehicleLocation.latitude, lng: vehicleLocation.longitude }}
            label={{
              text: '🚚',
              fontSize: '20px',
            }}
            title="Vehicle Start/End"
          />
        )}

        {/* Delivery Location Markers */}
        {route.visits.map((visit, index) => {
          if (!visit.arrivalLocation) return null;
          
          return (
            <Marker
              key={index}
              position={{
                lat: visit.arrivalLocation.latitude,
                lng: visit.arrivalLocation.longitude,
              }}
              label={{
                text: `${index + 1}`,
                color: 'white',
                fontWeight: 'bold',
              }}
              onClick={() => setSelectedMarker(index)}
            >
              {selectedMarker === index && (
                <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                  <div>
                    <strong>Stop {index + 1}</strong>
                    <p style={{ margin: '5px 0' }}>{visit.shipmentLabel}</p>
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
        })}

        {/* Route Polyline */}
        <Polyline
          path={getRoutePath()}
          options={{
            strokeColor: '#4285f4',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      </GoogleMap>
    </div>
  );
};