import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AddressSearchDemo } from './components/AddressSearchDemo';
import { AuthService, type AuthUser } from './lib/auth/auth';
import { Loader2, LogOut, TestTube } from 'lucide-react';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      AuthService.verifyToken(savedToken)
        .then((userData) => {
          if (userData) {
            setUser(userData);
            setToken(savedToken);
          } else {
            localStorage.removeItem('auth_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setError('');
    localStorage.setItem('auth_token', authToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await AuthService.logout(token);
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!user) {
    return (
      <div>
        {/* Bouton de démo pour tester sans authentification */}
        {!showDemo && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setShowDemo(true)}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center space-x-2"
              title="Tester la recherche d'adresses"
            >
              <TestTube size={20} />
              <span>Demo</span>
            </button>
          </div>
        )}
        
        {showDemo ? (
          <>
            <button
              onClick={() => setShowDemo(false)}
              className="fixed top-4 right-4 bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg z-50"
              title="Retour à l'authentification"
            >
              <LogOut size={20} />
            </button>
            <AddressSearchDemo />
          </>
        ) : (
          <>
            <LoginForm onLogin={handleLogin} onError={handleError} />
            {error && (
              <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
                <p className="font-medium">Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Bouton de déconnexion (affiché sur tous les dashboards)
  const LogoutButton = () => (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-4 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg z-50"
      title="Se déconnecter"
    >
      <LogOut size={20} />
    </button>
  );

  // Rendu selon le rôle de l'utilisateur
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'manager':
        return <AdminDashboard user={user} />; // Pour l'instant, même interface
      case 'driver':
        return <DriverDashboard user={user} />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl text-gray-600 mb-4">Rôle non reconnu</p>
              <button
                onClick={handleLogout}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <LogoutButton />
      {renderDashboard()}
    </div>
  );
}

export default App;