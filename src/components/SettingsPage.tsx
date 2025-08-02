import React, { useState, useEffect } from 'react';
import { Save, Key, Camera, ArrowLeft, AlertCircle, CheckCircle, Route, Clock, Plus, Minus } from 'lucide-react';
import { VoiceSettings } from './VoiceSettings';
import { PersonalSettings } from './PersonalSettings';
import { useRouteSettings } from '../hooks/useRouteSettings';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [cameraResolution, setCameraResolution] = useState('720p');
  const [ocrTimeout, setOcrTimeout] = useState(30);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Route optimization settings
  const { settings: routeSettings, updateSetting: updateRouteSetting } = useRouteSettings();
  
  useEffect(() => {
    // Load saved settings from localStorage
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedApiKey = localStorage.getItem('gemini_api_key') || '';
      const savedResolution = localStorage.getItem('camera_resolution') || '720p';
      const savedTimeout = parseInt(localStorage.getItem('ocr_timeout') || '30');
      const savedFacing = localStorage.getItem('camera_facing') as 'environment' | 'user' || 'environment';
      
      setGeminiApiKey(savedApiKey);
      setCameraResolution(savedResolution);
      setOcrTimeout(savedTimeout);
      setCameraFacing(savedFacing);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // Save to localStorage
      localStorage.setItem('gemini_api_key', geminiApiKey);
      localStorage.setItem('camera_resolution', cameraResolution);
      localStorage.setItem('ocr_timeout', ocrTimeout.toString());
      localStorage.setItem('camera_facing', cameraFacing);
      
      // Trigger a custom event to notify other components of settings change
      window.dispatchEvent(new CustomEvent('settingsUpdated', {
        detail: {
          geminiApiKey,
          cameraResolution,
          ocrTimeout,
          cameraFacing
        }
      }));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const testApiKey = async () => {
    if (!geminiApiKey.trim()) {
      alert('Veuillez saisir une clé API avant de tester.');
      return;
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Test with a simple prompt
      const result = await model.generateContent("Test de connexion API");
      const response = await result.response;
      
      if (response.text()) {
        alert('✅ Clé API valide ! Connexion réussie à Gemini 2.0 Flash.');
      } else {
        alert('❌ Clé API invalide ou service indisponible.');
      }
    } catch (error) {
      console.error('Erreur test API:', error);
      alert('❌ Erreur lors du test de la clé API. Vérifiez qu\'elle est correcte.');
    }
  };

  const resolutionOptions = [
    { value: '480p', label: '480p (640x480)', description: 'Qualité faible, performance élevée' },
    { value: '720p', label: '720p (1280x720)', description: 'Qualité moyenne, recommandée' },
    { value: '1080p', label: '1080p (1920x1080)', description: 'Haute qualité, performance plus lente' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <p className="text-gray-600">
            Configuration de l'OCR, caméra, fonctionnalités vocales et intégration Gemini 2.0 Flash
          </p>
        </div>

        {/* Gemini API Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Key size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">API Gemini 2.0 Flash (Optionnel)</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé API Gemini (pour OCR avancé)
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Optionnel - Pour OCR avancé uniquement"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tester
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Obtenez votre clé API sur{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout OCR (secondes)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={ocrTimeout}
                onChange={(e) => setOcrTimeout(parseInt(e.target.value) || 30)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Temps maximum d'attente pour l'analyse OCR
              </p>
            </div>
          </div>
        </div>

        {/* Voice Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <VoiceSettings />
        </div>

        {/* Route Optimization Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Route size={24} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Optimisation de Tournée</h2>
          </div>
          
          <div className="space-y-6">
            {/* Temps d'arrêt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps d'arrêt par point (minutes)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => updateRouteSetting('stopTimeMinutes', Math.max(1, routeSettings.stopTimeMinutes - 1))}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-2 bg-gray-50 border rounded-lg font-medium min-w-[60px] text-center">
                  {routeSettings.stopTimeMinutes}
                </span>
                <button
                  onClick={() => updateRouteSetting('stopTimeMinutes', routeSettings.stopTimeMinutes + 1)}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Temps moyen nécessaire pour chaque livraison/enlèvement
              </p>
            </div>

            {/* Heure de départ par défaut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure de départ par défaut
              </label>
              <div className="flex items-center space-x-3">
                <Clock size={16} className="text-gray-500" />
                <input
                  type="time"
                  value={routeSettings.startTime}
                  onChange={(e) => updateRouteSetting('startTime', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Cette heure sera mise à jour automatiquement lors du lancement d'optimisation
              </p>
            </div>

            {/* Vitesse moyenne */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vitesse moyenne en ville (km/h)
              </label>
              <input
                type="number"
                value={routeSettings.averageSpeedKmh}
                onChange={(e) => updateRouteSetting('averageSpeedKmh', Number(e.target.value))}
                min="10"
                max="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                Utilisée pour calculer les temps de trajet entre les points
              </p>
            </div>

            {/* Retour au dépôt */}
            <div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="returnToDepot"
                  checked={routeSettings.returnToDepot}
                  onChange={(e) => updateRouteSetting('returnToDepot', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="returnToDepot" className="text-sm font-medium text-gray-700">
                  Retour au dépôt en fin de tournée
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-1 ml-7">
                Inclut automatiquement le trajet de retour dans le calcul de la tournée
              </p>
            </div>
          </div>
        </div>

        {/* Personal Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PersonalSettings />
        </div>

        {/* Camera Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Camera size={24} className="text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuration Caméra</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Résolution de capture
              </label>
              <select
                value={cameraResolution}
                onChange={(e) => setCameraResolution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {resolutionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {resolutionOptions.find(opt => opt.value === cameraResolution)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caméra par défaut
              </label>
              <select
                value={cameraFacing}
                onChange={(e) => setCameraFacing(e.target.value as 'environment' | 'user')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="environment">Caméra arrière (recommandée)</option>
                <option value="user">Caméra avant</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Caméra utilisée par défaut pour le scan
              </p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Information OCR :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Gemini AI OCR est optionnel pour une meilleure précision</li>
                <li>L'application fonctionne sans clé API (OCR basique disponible)</li>
                <li>Les permissions caméra sont requises pour scanner</li>
                <li>Configurez Gemini pour une détection d'adresse améliorée</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle size={20} />
                <span>Paramètres sauvegardés</span>
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle size={20} />
                <span>Erreur de sauvegarde</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>Sauvegarder les paramètres</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};