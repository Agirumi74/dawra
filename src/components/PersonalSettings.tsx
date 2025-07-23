import React, { useState } from 'react';
import { 
  User, 
  Truck, 
  Settings, 
  Plus, 
  X, 
  Palette,
  Star,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { usePersonalSettings } from '../hooks/usePersonalSettings';

export const PersonalSettings: React.FC = () => {
  const {
    personalSettings,
    updatePersonalSettings,
    addTruckLocation,
    removeTruckLocation,
    updateTruckLocation,
    setDefaultLocation,
    setCustomConstant,
    removeCustomConstant,
    resetToDefaults
  } = usePersonalSettings();

  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationColor, setNewLocationColor] = useState('#3b82f6');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newConstantKey, setNewConstantKey] = useState('');
  const [newConstantValue, setNewConstantValue] = useState('');
  const [showAddConstant, setShowAddConstant] = useState(false);

  const handleAddLocation = () => {
    if (newLocationName.trim()) {
      addTruckLocation(newLocationName.trim(), newLocationColor);
      setNewLocationName('');
      setNewLocationColor('#3b82f6');
      setShowAddLocation(false);
    }
  };

  const handleAddConstant = () => {
    if (newConstantKey.trim() && newConstantValue.trim()) {
      const value = isNaN(Number(newConstantValue)) ? newConstantValue : Number(newConstantValue);
      setCustomConstant(newConstantKey.trim(), value);
      setNewConstantKey('');
      setNewConstantValue('');
      setShowAddConstant(false);
    }
  };

  const colorPresets = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User size={24} className="text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">Paramètres Personnels</h2>
      </div>

      {/* Driver Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Informations Chauffeur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du chauffeur
            </label>
            <input
              type="text"
              value={personalSettings.driverName || ''}
              onChange={(e) => updatePersonalSettings({ driverName: e.target.value })}
              placeholder="Votre nom"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de véhicule
            </label>
            <input
              type="text"
              value={personalSettings.vehicleNumber || ''}
              onChange={(e) => updatePersonalSettings({ vehicleNumber: e.target.value })}
              placeholder="Ex: V123, Camion-01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Truck Locations */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Truck size={20} className="text-green-600" />
            <h3 className="font-medium text-gray-900">Emplacements du Camion</h3>
          </div>
          <button
            onClick={() => setShowAddLocation(!showAddLocation)}
            className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus size={16} />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Add Location Form */}
        {showAddLocation && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Nouvel Emplacement</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'emplacement
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Ex: Côté conducteur, Porte arrière..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newLocationColor}
                    onChange={(e) => setNewLocationColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <div className="flex space-x-1">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLocationColor(color)}
                        className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddLocation}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddLocation(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Locations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {personalSettings.truckLocations.map((location) => (
            <div
              key={location.id}
              className={`border rounded-lg p-3 ${
                personalSettings.defaultLocation === location.id
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: location.color }}
                  />
                  <span className="text-sm font-medium">{location.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {personalSettings.defaultLocation === location.id && (
                    <Star size={14} className="text-yellow-500" fill="currentColor" />
                  )}
                  {location.isCustom && (
                    <button
                      onClick={() => removeTruckLocation(location.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Supprimer cet emplacement"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setDefaultLocation(location.id)}
                className="text-xs text-gray-600 hover:text-purple-600"
              >
                {personalSettings.defaultLocation === location.id ? 'Par défaut' : 'Définir par défaut'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Constants */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings size={20} className="text-blue-600" />
            <h3 className="font-medium text-gray-900">Constantes Personnalisées</h3>
          </div>
          <button
            onClick={() => setShowAddConstant(!showAddConstant)}
            className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-700"
          >
            <Plus size={16} />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Add Constant Form */}
        {showAddConstant && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Nouvelle Constante</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={newConstantKey}
                  onChange={(e) => setNewConstantKey(e.target.value)}
                  placeholder="Ex: temps_pause, distance_max..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur
                </label>
                <input
                  type="text"
                  value={newConstantValue}
                  onChange={(e) => setNewConstantValue(e.target.value)}
                  placeholder="Ex: 15, 2.5, texte..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleAddConstant}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddConstant(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Constants List */}
        {Object.keys(personalSettings.customConstants).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(personalSettings.customConstants).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 rounded p-3">
                <div>
                  <span className="font-medium text-gray-900">{key}</span>
                  <span className="ml-2 text-gray-600">= {value}</span>
                </div>
                <button
                  onClick={() => removeCustomConstant(key)}
                  className="text-red-500 hover:text-red-700"
                  title="Supprimer cette constante"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Aucune constante personnalisée définie. 
            Utilisez ce système pour sauvegarder vos paramètres métier personnels.
          </p>
        )}
      </div>

      {/* Reset Button */}
      <div className="flex justify-center">
        <button
          onClick={resetToDefaults}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Réinitialiser tous les paramètres personnels</span>
        </button>
      </div>
    </div>
  );
};