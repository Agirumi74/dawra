import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  CheckCircle, 
  ArrowRight, 
  Navigation, 
  X,
  Clock,
  Package as PackageIcon,
  Home,
  Building,
  Map
} from 'lucide-react';
import { DeliveryPoint, UserPosition, DeliverySummary } from '../types';
import { NavigationModeSelector } from './NavigationModeSelector';
import { EnhancedDeliveryMap } from './EnhancedDeliveryMap';
import { TourSummary } from './TourSummary';
import { FullRouteMapView } from './FullRouteMapView';

interface TourProgressViewProps {
  deliveryPoints: DeliveryPoint[];
  currentPointIndex: number;
  userPosition: UserPosition | null;
  onDeliveryComplete: (pointId: string, status: 'delivered' | 'failed', deliveryStatus?: string, reason?: string) => void;
  onDeliveryFailed: (pointId: string) => void;
  onNext: () => void;
  onBack: () => void;
  setCurrentPointIndex?: (index: number) => void;
  packages: any[];
}

export const TourProgressView: React.FC<TourProgressViewProps> = ({
  deliveryPoints,
  currentPointIndex,
  userPosition,
  onDeliveryComplete,
  onDeliveryFailed,
  onNext,
  onBack,
  setCurrentPointIndex,
  packages
}) => {
  const [showNavigationSelector, setShowNavigationSelector] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMap, setShowMap] = useState(false);
  const [showFullRoute, setShowFullRoute] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [tourSummary, setTourSummary] = useState<DeliverySummary | null>(null);

  const currentPoint = deliveryPoints[currentPointIndex];
  const totalPoints = deliveryPoints.length;
  const completedPoints = currentPointIndex;
  const remainingPoints = totalPoints - currentPointIndex;

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Generate tour summary when tour is completed
  useEffect(() => {
    if (currentPointIndex >= totalPoints && !showSummary) {
      generateTourSummary();
    }
  }, [currentPointIndex, totalPoints]);

  const generateTourSummary = () => {
    const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered');
    const failedPackages = packages.filter(pkg => pkg.status === 'failed');
    
    const failureReasons = {
      absent: packages.filter(pkg => pkg.deliveryStatus === 'absent').length,
      refused: packages.filter(pkg => pkg.deliveryStatus === 'refused').length,
      ups_relay: packages.filter(pkg => pkg.deliveryStatus === 'ups_relay').length,
      address_incorrect: packages.filter(pkg => pkg.deliveryStatus === 'address_incorrect').length,
      access_denied: packages.filter(pkg => pkg.deliveryStatus === 'access_denied').length,
      damaged: packages.filter(pkg => pkg.deliveryStatus === 'damaged').length,
      other: packages.filter(pkg => pkg.deliveryStatus === 'other').length,
    };

    const summary: DeliverySummary = {
      totalPackages: packages.length,
      deliveredPackages: deliveredPackages.length,
      failedPackages: failedPackages.length,
      failureReasons,
      tourDuration: calculateTourDuration(),
      totalDistance: calculateTotalDistance(),
      endTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setTourSummary(summary);
    setShowSummary(true);
  };

  const calculateTourDuration = () => {
    // This would typically use actual start time from route settings
    // For now, using a placeholder calculation
    const hours = Math.floor(totalPoints * 0.5);
    const minutes = (totalPoints * 0.5 % 1) * 60;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  const calculateTotalDistance = () => {
    return deliveryPoints.reduce((total, point) => total + (point.distance || 0), 0);
  };

  const handleDeliveryStatusChange = (pointId: string, status: 'delivered' | 'failed', deliveryStatus?: string, reason?: string) => {
    onDeliveryComplete(pointId, status, deliveryStatus, reason);
  };

  const handleCompleteDelivery = () => {
    if (currentPoint) {
      handleDeliveryStatusChange(currentPoint.id, 'delivered', 'delivered');
      if (currentPointIndex < totalPoints - 1) {
        onNext();
      }
    }
  };

  const handleFailedDelivery = () => {
    if (currentPoint) {
      handleDeliveryStatusChange(currentPoint.id, 'failed', 'absent');
      if (currentPointIndex < totalPoints - 1) {
        onNext();
      }
    }
  };

  const handleNavigationModeSelect = (mode: 'dawra' | 'google' | 'waze') => {
    setShowNavigationSelector(false);
    
    if (mode === 'dawra') {
      // Use internal enhanced map navigation
      setShowMap(true);
      return;
    }
    
    // For external apps, we've already launched them in the selector
    // Optionally show a confirmation or instruction
  };

  const jumpToPoint = (index: number) => {
    if (setCurrentPointIndex && index >= 0 && index < totalPoints) {
      setCurrentPointIndex(index);
    }
  };

  const getProgressPercentage = () => {
    return (completedPoints / totalPoints) * 100;
  };

  // Show tour summary when all deliveries are complete
  if (showSummary && tourSummary) {
    return (
      <TourSummary
        summary={tourSummary}
        packages={packages}
        onBack={() => {
          setShowSummary(false);
          onBack();
        }}
        onExportReport={() => {
          // Handle export functionality
          console.log('Export tour summary');
        }}
      />
    );
  }

  // Show full route overview
  if (showFullRoute) {
    return (
      <FullRouteMapView
        points={deliveryPoints}
        userPosition={userPosition}
        onBack={() => setShowFullRoute(false)}
        onStartNavigation={() => {
          setShowFullRoute(false);
          setShowMap(true);
        }}
      />
    );
  }

  // Show enhanced map navigation
  if (showMap) {
    return (
      <EnhancedDeliveryMap
        points={deliveryPoints}
        currentPointIndex={currentPointIndex}
        userPosition={userPosition}
        onPointComplete={handleDeliveryStatusChange}
        onNext={onNext}
        onBack={() => setShowMap(false)}
        showFullRoute={false}
      />
    );
  }

  if (!currentPoint) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournée terminée !</h2>
          <p className="text-gray-600 mb-6">Toutes les livraisons ont été effectuées</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navigation Mode Selector Modal */}
      {showNavigationSelector && (
        <NavigationModeSelector
          deliveryPoints={deliveryPoints}
          onModeSelect={handleNavigationModeSelect}
          onCancel={() => setShowNavigationSelector(false)}
        />
      )}

      {/* Header with progress */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Tournée en cours</h1>
              <p className="text-sm text-gray-600">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {completedPoints + 1} / {totalPoints}
            </div>
            <div className="text-xs text-gray-500">arrêts</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>{completedPoints} terminés</span>
          <span>{remainingPoints} restants</span>
        </div>
      </div>

      {/* Current delivery info */}
      <div className="bg-white border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {currentPoint.order}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Arrêt actuel</div>
              <div className="text-sm text-gray-600">
                {currentPoint.estimatedTime && (
                  <span className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>Arrivée prévue: {currentPoint.estimatedTime}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowNavigationSelector(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Navigation size={16} />
              <span>Y aller</span>
            </button>
            <button
              onClick={() => setShowMap(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Map size={16} />
              <span>Carte</span>
            </button>
            <button
              onClick={() => setShowFullRoute(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <MapPin size={16} />
              <span>Vue d'ensemble</span>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin size={16} className="text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-blue-900">
                {currentPoint.address.full_address}
              </div>
              {currentPoint.distance && (
                <div className="text-sm text-blue-700 mt-1">
                  Distance: {currentPoint.distance.toFixed(1)} km
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Packages to deliver */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <PackageIcon size={20} />
            <span>Colis à livrer ({currentPoint.packages.length})</span>
          </h3>
          
          <div className="space-y-2">
            {currentPoint.packages.map((pkg) => (
              <div key={pkg.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {pkg.type === 'entreprise' ? 
                      <Building size={16} className="text-gray-500" /> : 
                      <Home size={16} className="text-gray-500" />
                    }
                    <div>
                      <div className="font-medium text-sm">
                        {pkg.barcode ? `Code: ${pkg.barcode}` : 'Saisie manuelle'}
                      </div>
                      <div className="text-xs text-gray-600">{pkg.location}</div>
                      {pkg.notes && (
                        <div className="text-xs text-gray-500 mt-1">{pkg.notes}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {pkg.priority !== 'standard' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pkg.priority === 'premier' ? 'bg-red-100 text-red-800' :
                        pkg.priority === 'express_midi' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.priority === 'premier' ? 'Prioritaire' :
                         pkg.priority === 'express_midi' ? 'Express' : 'Standard'}
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {pkg.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white border-t p-4 flex-shrink-0">
        <div className="space-y-3">
          {/* Primary action - Complete delivery */}
          <button
            onClick={handleCompleteDelivery}
            className="w-full bg-green-600 text-white py-4 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-lg font-semibold"
          >
            <CheckCircle size={24} />
            <span>Livraison terminée</span>
          </button>

          <div className="flex space-x-3">
            {/* Failed delivery */}
            <button
              onClick={handleFailedDelivery}
              className="flex-1 bg-red-100 text-red-700 py-3 px-4 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center space-x-2"
            >
              <X size={20} />
              <span>Échec livraison</span>
            </button>
            
            {/* Skip to next */}
            {currentPointIndex < totalPoints - 1 && (
              <button
                onClick={onNext}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowRight size={20} />
                <span>Passer au suivant</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick jump to other stops */}
        {totalPoints > 1 && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs text-gray-600 mb-2">Aller à l'arrêt:</div>
            <div className="flex space-x-2 overflow-x-auto">
              {deliveryPoints.map((point, index) => (
                <button
                  key={point.id}
                  onClick={() => jumpToPoint(index)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full text-sm font-medium ${
                    index === currentPointIndex
                      ? 'bg-blue-600 text-white'
                      : index < currentPointIndex
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {point.order}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};