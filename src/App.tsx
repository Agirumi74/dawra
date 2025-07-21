import React from 'react';
import { DriverDashboard } from './components/driver/DriverDashboard';

function App() {
  // Directly render the delivery dashboard without authentication
  return (
    <div className="relative">
      <DriverDashboard />
    </div>
  );
}

export default App;