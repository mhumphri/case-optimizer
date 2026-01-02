import React from 'react';
import type { OptimizedRoute } from '../types/route';
import { formatDuration, formatTime } from '../utils/formatters';

interface RouteDetailsProps {
  routes: OptimizedRoute[];
}

export const RouteDetails: React.FC<RouteDetailsProps> = ({ routes }) => {
  if (routes.length === 0) return null;

  return (
    <div>
      <h2>✅ Route Details</h2>
      {routes.map((route, index) => (
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
  );
};