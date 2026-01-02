import React, { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { Location, OptimizedRoute } from './types/route';
import { RouteMap } from './components/RouteMap';
import { RouteDetails } from './components/RouteDetails';

const RouteOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [error, setError] = useState<string>('');
  const [vehicleLocation, setVehicleLocation] = useState<Location | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || '',
  });

  const optimizeRoutes = async () => {
    setLoading(true);
    setError('');

    const shipments = [
      {
        deliveries: [
          {
            arrivalLocation: { latitude: 37.7749, longitude: -122.4194 },
            duration: { seconds: 300 },
          },
        ],
        label: 'San Francisco',
      },
      {
        deliveries: [
          {
            arrivalLocation: { latitude: 37.8044, longitude: -122.2712 },
            duration: { seconds: 300 },
          },
        ],
        label: 'Oakland',
      },
      {
        deliveries: [
          {
            arrivalLocation: { latitude: 37.6879, longitude: -122.4702 },
            duration: { seconds: 300 },
          },
        ],
        label: 'Daly City',
      },
    ];

    const vehicles = [
      {
        startLocation: { latitude: 37.7937, longitude: -122.3965 },
        endLocation: { latitude: 37.7937, longitude: -122.3965 },
        label: 'Vehicle 1',
      },
    ];

    setVehicleLocation(vehicles[0].startLocation);

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

      setOptimizedRoutes(routes);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🚗 Route Optimizer</h1>
        <div style={{ 
          padding: '15px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ef5350',
        }}>
          <strong>❌ Map Loading Error:</strong> 
          <p>Failed to load Google Maps. Please check your API key.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🚗 Route Optimizer</h1>
      
      {!googleMapsApiKey && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <strong>⚠️ Google Maps API Key Missing:</strong>
          <p style={{ margin: '10px 0 0 0' }}>
            Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your .env file to enable the map.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <p style={{ margin: 0 }}>
          <strong>Test Route:</strong> 3 Bay Area deliveries starting from Berkeley
        </p>
      </div>

      <button
        onClick={optimizeRoutes}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#ccc' : '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
        }}
      >
        {loading ? '⏳ Optimizing...' : '🚀 Optimize Routes'}
      </button>

      {error && (
        <div style={{ 
          padding: '15px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #ef5350',
          marginBottom: '20px',
        }}>
          <strong>❌ Error:</strong> 
          <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
            {error}
          </div>
        </div>
      )}

      {/* Map Section */}
      {optimizedRoutes.length > 0 && googleMapsApiKey && isLoaded && (
        <RouteMap route={optimizedRoutes[0]} vehicleLocation={vehicleLocation} />
      )}

      {/* Map Loading State */}
      {optimizedRoutes.length > 0 && googleMapsApiKey && !isLoaded && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '30px',
        }}>
          <p>Loading map...</p>
        </div>
      )}

      {/* Route Details */}
      <RouteDetails routes={optimizedRoutes} />

      {/* Empty State */}
      {!loading && !error && optimizedRoutes.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <p style={{ fontSize: '18px' }}>
            Click "Optimize Routes" to see the optimized delivery route on the map
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;