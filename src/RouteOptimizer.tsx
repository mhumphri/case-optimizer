import React, { useState } from 'react';

interface OptimizedRoute {
  vehicleLabel: string;
  visits: Array<{
    shipmentIndex: number;
    shipmentLabel: string;
    startTime: string | { seconds: number };  // Can be either format
  }>;
  metrics: {
    travelDuration: string | { seconds: number };
    travelDistance: number;
  };
}

const RouteOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [error, setError] = useState<string>('');

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
        visits: route.visits?.map((visit: any) => ({
          shipmentIndex: visit.shipmentIndex,
          shipmentLabel: visit.shipmentLabel || `Stop ${visit.shipmentIndex + 1}`,
          startTime: visit.startTime,  // Keep original format
        })) || [],
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

  // ✅ Format duration - handles both string and object formats
  const formatDuration = (duration: string | { seconds: number } | any) => {
    if (duration && typeof duration === 'object' && 'seconds' in duration) {
      const seconds = duration.seconds;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${seconds}s`;
    }
    
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)s/);
      if (match) {
        const seconds = parseInt(match[1]);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
          return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
      }
      return duration;
    }
    
    return '0s';
  };

  // ✅ NEW: Format timestamp - handles both string and object formats
  const formatTime = (timestamp: string | { seconds: number } | any) => {
    try {
      // Handle object format: { seconds: 1234567890 }
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        const date = new Date(timestamp.seconds * 1000);  // Convert seconds to milliseconds
        return date.toLocaleTimeString();
      }
      
      // Handle ISO string format: "2024-01-15T09:00:00Z"
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString();
        }
      }
      
      return '';  // Return empty string instead of "Invalid Date"
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return '';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚗 Route Optimizer</h1>
      
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

      {optimizedRoutes.length > 0 && (
        <div>
          <h2>✅ Optimized Routes</h2>
          {optimizedRoutes.map((route, index) => (
            <div
              key={index}
              style={{
                border: '2px solid #4caf50',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: '#f1f8f4',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#2e7d32' }}>
                🚚 {route.vehicleLabel}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <strong>📏 Total Distance:</strong>
                  <div style={{ fontSize: '20px', color: '#1976d2', marginTop: '5px' }}>
                    {(route.metrics.travelDistance / 1000).toFixed(2)} km
                  </div>
                </div>
                <div>
                  <strong>⏱️ Total Duration:</strong>
                  <div style={{ fontSize: '20px', color: '#1976d2', marginTop: '5px' }}>
                    {formatDuration(route.metrics.travelDuration)}
                  </div>
                </div>
              </div>
              
              <h4>📍 Optimized Stop Sequence:</h4>
              <ol style={{ lineHeight: '1.8', paddingLeft: '24px' }}>
                {route.visits.map((visit, i) => {
                  const formattedTime = formatTime(visit.startTime);
                  return (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      <strong>{visit.shipmentLabel}</strong>
                      {formattedTime && (
                        <span style={{ color: '#666', marginLeft: '10px' }}>
                          🕐 {formattedTime}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && optimizedRoutes.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>
          <p style={{ fontSize: '18px' }}>
            Click "Optimize Routes" to see the optimized delivery route
          </p>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;