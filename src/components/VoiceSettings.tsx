import React from 'react';
import { 
  Mic, 
  Volume2, 
  Settings, 
  AlertTriangle, 
  Info,
  RotateCcw 
} from 'lucide-react';
import { useVoiceSettings } from '../hooks/useVoiceSettings';

interface VoiceSettingsProps {
  className?: string;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({ className = "" }) => {
  const {
    voiceSettings,
    toggleVoiceEnabled,
    toggleSpeechRecognition,
    toggleTextToSpeech,
    resetToDefaults,
  } = useVoiceSettings();

  const isSpeechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTextToSpeechSupported = !!window.speechSynthesis;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Settings size={18} className="text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">Configuration Vocale</h3>
      </div>

      {/* Information notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Fonctionnalités vocales désactivées par défaut</p>
            <p>
              Les fonctionnalités vocales utilisent les APIs natives du navigateur. 
              Elles sont désactivées par défaut pour garantir une expérience plus fiable et robuste.
              Vous pouvez les activer ci-dessous si vous souhaitez les utiliser.
            </p>
          </div>
        </div>
      </div>

      {/* Master toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${voiceSettings.voiceEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Volume2 size={20} className={voiceSettings.voiceEnabled ? 'text-green-600' : 'text-gray-400'} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Activer les fonctionnalités vocales</p>
              <p className="text-sm text-gray-600">Activation globale de toutes les fonctionnalités vocales</p>
            </div>
          </div>
          <button
            onClick={toggleVoiceEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              voiceSettings.voiceEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              voiceSettings.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Individual voice feature controls */}
      {voiceSettings.voiceEnabled && (
        <div className="space-y-3">
          {/* Speech Recognition */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${voiceSettings.speechRecognitionEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Mic size={20} className={voiceSettings.speechRecognitionEnabled ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Reconnaissance vocale</p>
                  <p className="text-sm text-gray-600">Permet de dicter les adresses dans les formulaires</p>
                  {!isSpeechRecognitionSupported && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle size={14} className="text-orange-500" />
                      <span className="text-xs text-orange-600">Non supporté par ce navigateur</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={toggleSpeechRecognition}
                disabled={!isSpeechRecognitionSupported}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  voiceSettings.speechRecognitionEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  voiceSettings.speechRecognitionEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Text to Speech */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${voiceSettings.textToSpeechEnabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <Volume2 size={20} className={voiceSettings.textToSpeechEnabled ? 'text-purple-600' : 'text-gray-400'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Synthèse vocale</p>
                  <p className="text-sm text-gray-600">Permet d'écouter les instructions de navigation</p>
                  {!isTextToSpeechSupported && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle size={14} className="text-orange-500" />
                      <span className="text-xs text-orange-600">Non supporté par ce navigateur</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={toggleTextToSpeech}
                disabled={!isTextToSpeechSupported}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  voiceSettings.textToSpeechEnabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  voiceSettings.textToSpeechEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <div className="flex justify-center">
        <button
          onClick={resetToDefaults}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RotateCcw size={14} />
          <span>Réinitialiser aux valeurs par défaut</span>
        </button>
      </div>

      {/* Technical explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Choix technique</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>Solution choisie :</strong> Fonctionnalités vocales désactivées par défaut avec option d'activation.
          </p>
          <p>
            <strong>Raison :</strong> Les APIs vocales natives du navigateur, bien qu'efficaces, 
            peuvent nécessiter une connexion internet et leur qualité varie selon le navigateur. 
            La désactivation par défaut garantit une expérience utilisateur plus robuste et prévisible.
          </p>
          <p>
            <strong>Avantages :</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Expérience par défaut fiable sans dépendances externes</li>
            <li>Pas de données sensibles envoyées à des services externes</li>
            <li>Fonctionnalités optionnelles pour les utilisateurs qui les souhaitent</li>
            <li>Code maintenu pour flexibilité future</li>
          </ul>
        </div>
      </div>
    </div>
  );
};