import React, { useState, useEffect } from 'react';
import { SearchDemo } from './components/SearchDemo';
import { Loader2 } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement de la démonstration...</p>
        </div>
      </div>
    );
  }

  // Show search demo directly
  return <SearchDemo />;
}

export default App;