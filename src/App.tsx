import React from 'react';
import RouteOptimizer from './RouteOptimizer';

function App() {
  return (
    <div className="App">
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>🚗 Route Optimization Demo</h1>
        <p>Optimize delivery routes using Google Maps Platform</p>
      </header>
      
      <main>
        <RouteOptimizer />
      </main>

      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
        borderTop: '1px solid #ddd'
      }}>
        <p>
          <strong>Note:</strong> Make sure your backend server is running on port 3001
        </p>
      </footer>
    </div>
  );
}

export default App;
