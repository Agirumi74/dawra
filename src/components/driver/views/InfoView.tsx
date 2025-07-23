import React from 'react';
import { 
  Truck, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Route,
  Settings,
  Target,
  Navigation
} from 'lucide-react';
import type { Vehicle } from '../../context/AppContext';

interface InfoViewProps {
  currentVehicle: Vehicle | null;
}

export const InfoView: React.FC<InfoViewProps> = ({ currentVehicle }) => {
  return (
    <div className="space-y-6">
      {/* Véhicule Section - Moved from main dashboard */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center space-x-2">
            <Truck size={24} className="text-blue-600" />
            <span>Mon véhicule</span>
          </h2>
          <span className="text-sm text-gray-500">Aujourd'hui</span>
        </div>
        
        {currentVehicle ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-lg">{currentVehicle.licensePlate}</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Assigné
              </span>
            </div>
            <p className="text-gray-600">{currentVehicle.brand} {currentVehicle.model}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kilométrage:</span>
                <span className="ml-2 font-medium">{currentVehicle.mileage?.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-gray-500">Carburant:</span>
                <span className="ml-2 font-medium">{currentVehicle.fuelType}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Truck size={48} className="mx-auto mb-4 opacity-50" />
            <p>Aucun véhicule assigné</p>
            <p className="text-sm">Contactez votre responsable</p>
          </div>
        )}
      </div>

      {/* Guide d'utilisation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Info size={24} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">Guide d'utilisation</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Clock size={20} className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Aujourd'hui</h3>
              <p className="text-sm text-blue-700">Consultez votre tournée du jour et les actions prioritaires</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Settings size={20} className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Scanner</h3>
              <p className="text-sm text-blue-700">Scannez les codes-barres des colis ou saisissez manuellement les informations</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Navigation size={20} className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">GPS</h3>
              <p className="text-sm text-blue-700">Optimisez vos tournées et naviguez avec le GPS intégré</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conseils et bonnes pratiques */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle size={24} className="text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">Bonnes pratiques</h2>
        </div>
        
        <ul className="space-y-2 text-sm text-green-700">
          <li className="flex items-start space-x-2">
            <span className="text-green-600">•</span>
            <span>Vérifiez l'état de votre véhicule avant le départ</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">•</span>
            <span>Scannez tous les colis en début de tournée pour optimiser votre itinéraire</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">•</span>
            <span>Utilisez la fonction GPS pour calculer le trajet le plus efficace</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">•</span>
            <span>Mettez à jour le statut des livraisons en temps réel</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-600">•</span>
            <span>Contactez le support en cas de problème technique</span>
          </li>
        </ul>
      </div>

      {/* Fonctionnalités avancées */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target size={24} className="text-purple-600" />
          <h2 className="text-lg font-semibold text-purple-900">Fonctionnalités avancées</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-purple-900">Scanner intelligent</h3>
            <p className="text-sm text-purple-700">
              Reconnaissance automatique des codes-barres avec détection d'erreurs et suggestions d'adresses
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-purple-900">Optimisation GPS</h3>
            <p className="text-sm text-purple-700">
              Calcul automatique du meilleur itinéraire en fonction du trafic et des contraintes de livraison
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-purple-900">Navigation vocale</h3>
            <p className="text-sm text-purple-700">
              Instructions vocales pour vous guider sans quitter la route des yeux
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-purple-900">Synchronisation cloud</h3>
            <p className="text-sm text-purple-700">
              Sauvegarde automatique de vos données et synchronisation multi-appareils
            </p>
          </div>
        </div>
      </div>

      {/* Support et contact */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle size={24} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Support et contact</h2>
        </div>
        
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Assistance technique :</strong> Disponible 24h/24 pour vous aider</p>
          <p><strong>Mises à jour :</strong> L'application se met à jour automatiquement</p>
          <p><strong>Problème technique :</strong> Redémarrez l'application ou contactez le support</p>
          <p><strong>Suggestions :</strong> Vos retours nous aident à améliorer l'application</p>
        </div>
      </div>
    </div>
  );
};