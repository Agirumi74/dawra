import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  BarChart3, 
  Plus,
  Shield,
  Building2
} from 'lucide-react';
import { DepotService } from '../../lib/services/depotService';
import { VehicleService } from '../../lib/services/vehicleService';
import type { Depot, Vehicle } from '../../lib/database';

interface AdminDashboardProps {
  user: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'depots' | 'vehicles'>('overview');
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showDepotForm, setShowDepotForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [depotsData, vehiclesData] = await Promise.all([
        DepotService.getActiveDepots(),
        VehicleService.getActiveVehicles(),
      ]);
      setDepots(depotsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const DepotForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      contactPhone: '',
      contactEmail: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await DepotService.createDepot(formData);
        setShowDepotForm(false);
        loadData();
        alert('Dépôt créé avec succès !');
      } catch (error) {
        alert('Erreur lors de la création du dépôt');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Nouveau dépôt</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nom du dépôt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Adresse"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Code postal"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Ville"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <input
              type="tel"
              placeholder="Téléphone"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowDepotForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const VehicleForm = () => {
    const [formData, setFormData] = useState({
      licensePlate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      fuelType: 'diesel' as const,
      maxWeight: 0,
      maxVolume: 0,
      depotId: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await VehicleService.createVehicle(formData);
        setShowVehicleForm(false);
        loadData();
        alert('Véhicule créé avec succès !');
      } catch (error) {
        alert('Erreur lors de la création du véhicule');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Nouveau véhicule</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Immatriculation"
              value={formData.licensePlate}
              onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Marque"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Modèle"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Année"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="p-3 border border-gray-300 rounded-lg"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                className="p-3 border border-gray-300 rounded-lg"
              >
                <option value="diesel">Diesel</option>
                <option value="gasoline">Essence</option>
                <option value="electric">Électrique</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Poids max (kg)"
                value={formData.maxWeight}
                onChange={(e) => setFormData({ ...formData, maxWeight: parseFloat(e.target.value) })}
                className="p-3 border border-gray-300 rounded-lg"
                step="0.1"
              />
              <input
                type="number"
                placeholder="Volume max (m³)"
                value={formData.maxVolume}
                onChange={(e) => setFormData({ ...formData, maxVolume: parseFloat(e.target.value) })}
                className="p-3 border border-gray-300 rounded-lg"
                step="0.1"
              />
            </div>
            <select
              value={formData.depotId}
              onChange={(e) => setFormData({ ...formData, depotId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Sélectionner un dépôt</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.name} - {depot.city}
                </option>
              ))}
            </select>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowVehicleForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Dépôts</p>
                    <p className="text-2xl font-bold text-blue-600">{depots.length}</p>
                  </div>
                  <Building2 size={32} className="text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Véhicules</p>
                    <p className="text-2xl font-bold text-green-600">{vehicles.length}</p>
                  </div>
                  <Truck size={32} className="text-green-600" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'depots':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des dépôts</h2>
              <button
                onClick={() => setShowDepotForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nouveau dépôt</span>
              </button>
            </div>
            
            <div className="grid gap-4">
              {depots.map((depot) => (
                <div key={depot.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{depot.name}</h3>
                      <p className="text-gray-600">{depot.address}</p>
                      <p className="text-gray-600">{depot.postalCode} {depot.city}</p>
                      {depot.contactPhone && (
                        <p className="text-sm text-blue-600 mt-2">📞 {depot.contactPhone}</p>
                      )}
                      {depot.contactEmail && (
                        <p className="text-sm text-blue-600">✉️ {depot.contactEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des véhicules</h2>
              <button
                onClick={() => setShowVehicleForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nouveau véhicule</span>
              </button>
            </div>
            
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{vehicle.licensePlate}</h3>
                      <p className="text-gray-600">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                      <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                        <span>🛢️ {vehicle.fuelType}</span>
                        {vehicle.maxWeight && <span>⚖️ {vehicle.maxWeight} kg</span>}
                        {vehicle.maxVolume && <span>📦 {vehicle.maxVolume} m³</span>}
                      </div>
                      {vehicle.mileage && (
                        <p className="text-sm text-blue-600 mt-2">🛣️ {vehicle.mileage.toLocaleString()} km</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Fonctionnalité en développement</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield size={24} className="text-red-600" />
              <h1 className="text-xl font-semibold">Administration</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {user.firstName} {user.lastName}
              </span>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Shield size={16} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'depots', label: 'Dépôts', icon: Building2 },
              { id: 'vehicles', label: 'Véhicules', icon: Truck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Modals */}
      {showDepotForm && <DepotForm />}
      {showVehicleForm && <VehicleForm />}
    </div>
  );
};