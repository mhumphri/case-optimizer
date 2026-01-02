import React, { useState } from 'react';
import type { OptimizedRoute } from '../types/route';
import { formatDuration, formatTime } from '../utils/formatters';

interface RouteDetailsProps {
  routes: OptimizedRoute[];
}

interface RouteCardProps {
  route: OptimizedRoute;
  index: number;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div
      style={{
        border: '2px solid #4caf50',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px',
        backgroundColor: '#f1f8f4',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#2e7d32' }}>
          🚚 {route.vehicleLabel}
        </h3>
        <span style={{ 
          padding: '4px 12px', 
          backgroundColor: '#4caf50', 
          color: 'white', 
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          {route.visits.length} stops
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <strong>📏 Distance:</strong>
          <div style={{ fontSize: '20px', color: '#1976d2', marginTop: '5px' }}>
            {(route.metrics.travelDistance / 1000).toFixed(2)} km
          </div>
        </div>
        <div>
          <strong>⏱️ Duration:</strong>
          <div style={{ fontSize: '20px', color: '#1976d2', marginTop: '5px' }}>
            {formatDuration(route.metrics.travelDuration)}
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        {isExpanded ? '▼ Hide' : '▶ Show'} Stop Sequence ({route.visits.length} stops)
      </button>
      
      {isExpanded && (
        <>
          <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>📍 Stop Sequence:</h4>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            border: '1px solid #c8e6c9',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: 'white',
          }}>
            <ol style={{ lineHeight: '1.6', paddingLeft: '24px', margin: 0 }}>
              {route.visits.map((visit, i) => {
                const formattedTime = formatTime(visit.startTime);
                return (
                  <li key={i} style={{ marginBottom: '6px', fontSize: '14px' }}>
                    <strong>{visit.shipmentLabel}</strong>
                    {formattedTime && (
                      <span style={{ color: '#666', marginLeft: '10px', fontSize: '13px' }}>
                        🕐 {formattedTime}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export const RouteDetails: React.FC<RouteDetailsProps> = ({ routes }) => {
  if (routes.length === 0) return null;

  // Calculate overall statistics
  const totalDistance = routes.reduce((sum, route) => sum + route.metrics.travelDistance, 0);
  const totalDeliveries = routes.reduce((sum, route) => sum + route.visits.length, 0);
  
  // Parse duration from the metrics
  const getTotalSeconds = (duration: string | { seconds: number }): number => {
    if (typeof duration === 'object' && 'seconds' in duration) {
      return duration.seconds;
    }
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)s/);
      if (match) return parseInt(match[1]);
    }
    return 0;
  };
  
  const totalDurationSeconds = routes.reduce((sum, route) => 
    sum + getTotalSeconds(route.metrics.travelDuration), 0
  );
  const avgDurationPerVehicle = totalDurationSeconds / routes.length;

  return (
    <div>
      <h2>✅ Route Details</h2>
      
      {/* Overall Statistics */}
      <div style={{
        border: '2px solid #2196f3',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#e3f2fd',
      }}>
        <h3 style={{ marginTop: 0, color: '#1565c0' }}>📊 Overall Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Total Vehicles:</strong>
            <div style={{ fontSize: '24px', color: '#1976d2', marginTop: '5px' }}>
              {routes.length}
            </div>
          </div>
          <div>
            <strong>Total Deliveries:</strong>
            <div style={{ fontSize: '24px', color: '#1976d2', marginTop: '5px' }}>
              {totalDeliveries}
            </div>
          </div>
          <div>
            <strong>Total Distance:</strong>
            <div style={{ fontSize: '24px', color: '#1976d2', marginTop: '5px' }}>
              {(totalDistance / 1000).toFixed(2)} km
            </div>
          </div>
          <div>
            <strong>Avg Time/Vehicle:</strong>
            <div style={{ fontSize: '24px', color: '#1976d2', marginTop: '5px' }}>
              {formatDuration({ seconds: Math.round(avgDurationPerVehicle) })}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Vehicle Routes */}
      <h3>🚚 Individual Vehicle Routes</h3>
      {/* Individual Vehicle Routes */}
      <h3>🚚 Individual Vehicle Routes</h3>
      {routes.map((route, index) => (
        <RouteCard key={index} route={route} index={index} />
      ))}
    </div>
  );
};