import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  RotateCcw,
  MapPin,
  Clock,
  Route as RouteIcon,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';
import { DeliveryPoint, UserPosition } from '../types';
import { RouteDirectionsService, RouteDirections, RouteStep } from '../services/routeDirections';

interface StepByStepNavigationProps {
  destination: DeliveryPoint;
  userPosition: UserPosition;
  onArrived: () => void;
  onCancel: () => void;
}

export const StepByStepNavigation: React.FC<StepByStepNavigationProps> = ({
  destination,
  userPosition,
  onArrived,
  onCancel
}) => {
  const [directions, setDirections] = useState<RouteDirections | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');

  useEffect(() => {
    loadDirections();
  }, [destination, userPosition]);

  useEffect(() => {
    if (directions) {
      calculateEstimatedArrival();
    }
  }, [directions]);

  const loadDirections = async () => {
    if (!destination.address.coordinates) return;

    setIsLoading(true);
    try {
      const routeDirections = await RouteDirectionsService.getDirections(
        userPosition,
        destination.address.coordinates
      );
      setDirections(routeDirections);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('Erreur de chargement des directions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedArrival = () => {
    if (!directions) return;

    const now = new Date();
    const arrivalTime = new Date(now.getTime() + directions.totalDuration * 1000);
    setEstimatedArrival(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const getCurrentStep = (): RouteStep | null => {
    if (!directions || currentStepIndex >= directions.steps.length) return null;
    return directions.steps[currentStepIndex];
  };

  const getNextStep = (): RouteStep | null => {
    if (!directions || currentStepIndex + 1 >= directions.steps.length) return null;
    return directions.steps[currentStepIndex + 1];
  };

  const handleNextStep = () => {
    if (directions && currentStepIndex < directions.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const speakInstruction = (step: RouteStep) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    const instruction = RouteDirectionsService.getVoiceInstruction(step);
    const utterance = new SpeechSynthesisUtterance(instruction);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn':
        return <ArrowRight size={24} />;
      case 'left':
        return <ArrowLeft size={24} />;
      case 'right':
        return <ArrowRight size={24} />;
      case 'roundabout':
        return <RotateCcw size={24} />;
      case 'continue':
        return <ArrowUp size={24} />;
      default:
        return <Compass size={24} />;
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address.full_address)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <Navigation size={48} className="mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-lg font-medium">Calcul de l'itinéraire...</p>
          <p className="text-gray-600">Vers {destination.address.full_address}</p>
        </div>
      </div>
    );
  }

  if (!directions) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin size={48} className="mx-auto text-red-600 mb-4" />
          <p className="text-lg font-medium mb-4">Impossible de calculer l'itinéraire</p>
          <div className="space-y-2">
            <button
              onClick={openInMaps}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 w-full"
            >
              Ouvrir dans Google Maps
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 w-full"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStep();
  const nextStep = getNextStep();

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* En-tête avec destination */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm opacity-90">Navigation vers:</div>
            <div className="font-medium text-lg">{destination.address.full_address}</div>
            <div className="text-sm opacity-90 mt-1">
              Arrivée prévue: {estimatedArrival} • {RouteDirectionsService.formatDistance(directions.totalDistance)} • {RouteDirectionsService.formatDuration(directions.totalDuration)}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg ml-4"
          >
            ×
          </button>
        </div>
      </div>

      {/* Instruction principale */}
      {currentStep && (
        <div className="bg-gray-900 text-white p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="text-blue-400">
              {getManeuverIcon(currentStep.maneuver)}
            </div>
          </div>
          <div className="text-2xl font-bold mb-2">
            {currentStep.instruction}
          </div>
          <div className="text-lg text-gray-300">
            dans {RouteDirectionsService.formatDistance(currentStep.distance)}
          </div>
          
          {/* Bouton vocal */}
          <button
            onClick={() => speakInstruction(currentStep)}
            className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
          >
            <Volume2 size={20} />
          </button>
        </div>
      )}

      {/* Prochaine instruction */}
      {nextStep && (
        <div className="bg-gray-100 p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600">
              {getManeuverIcon(nextStep.maneuver)}
            </div>
            <div>
              <div className="font-medium">Ensuite: {nextStep.instruction}</div>
              <div className="text-sm text-gray-600">
                dans {RouteDirectionsService.formatDistance(nextStep.distance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste complète des étapes */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold mb-4 flex items-center">
          <RouteIcon size={20} className="mr-2" />
          Toutes les étapes ({directions.steps.length})
        </h3>
        
        <div className="space-y-2">
          {directions.steps.map((step, index) => (
            <div
              key={index}
              onClick={() => setCurrentStepIndex(index)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                index === currentStepIndex
                  ? 'border-blue-500 bg-blue-50'
                  : index < currentStepIndex
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 ${
                  index === currentStepIndex ? 'text-blue-600' :
                  index < currentStepIndex ? 'text-green-600' :
                  'text-gray-400'
                }`}>
                  {getManeuverIcon(step.maneuver)}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {step.instruction}
                  </div>
                  <div className="text-xs text-gray-600">
                    {RouteDirectionsService.formatDistance(step.distance)} • {RouteDirectionsService.formatDuration(step.duration)}
                  </div>
                </div>
                
                {index === currentStepIndex && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contrôles de navigation */}
      <div className="bg-white border-t p-4">
        <div className="flex space-x-4">
          <button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Étape Précédente
          </button>
          
          <button
            onClick={toggleVoice}
            className={`px-4 py-3 rounded-lg ${
              voiceEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={currentStepIndex >= directions.steps.length - 1}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStepIndex >= directions.steps.length - 1 ? 'Arrivé!' : 'Étape Suivante'}
          </button>
        </div>
        
        {/* Boutons d'action */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={openInMaps}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Ouvrir dans Maps
          </button>
          
          <button
            onClick={onArrived}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Je suis arrivé
          </button>
        </div>
      </div>
    </div>
  );
};