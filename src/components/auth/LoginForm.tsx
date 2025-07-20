import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, Truck, User, Shield } from 'lucide-react';
import { AuthService, type LoginCredentials } from '../../lib/auth/auth';

interface LoginFormProps {
  onLogin: (user: any, token: string) => void;
  onError: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onError }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user, token } = await AuthService.login(credentials);
      onLogin(user, token);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-red-600" />;
      case 'manager':
        return <User size={16} className="text-blue-600" />;
      case 'driver':
        return <Truck size={16} className="text-green-600" />;
      default:
        return <User size={16} className="text-gray-600" />;
    }
  };

  // Comptes de démonstration
  const demoAccounts = [
    { email: 'admin@tournee.fr', password: 'admin123', role: 'admin', name: 'Administrateur' },
    { email: 'manager@tournee.fr', password: 'manager123', role: 'manager', name: 'Responsable' },
    { email: 'chauffeur@tournee.fr', password: 'chauffeur123', role: 'driver', name: 'Chauffeur' },
  ];

  const loginWithDemo = (account: typeof demoAccounts[0]) => {
    setCredentials({
      email: account.email,
      password: account.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Truck size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Tournée Facile</h2>
          <p className="mt-2 text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {/* Comptes de démonstration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">Comptes de démonstration</h3>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => loginWithDemo(account)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {getRoleIcon(account.role)}
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                  </div>
                </div>
                <LogIn size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>© 2024 Tournée Facile - Gestion professionnelle de livraisons</p>
        </div>
      </div>
    </div>
  );
};