import React from 'react';
import { Truck } from 'lucide-react';

interface Vehicle {
  licensePlate: string;
  brand: string;
  model: string;
  mileage: number;
  fuelType: string;
}

interface VehicleSectionProps {
  currentVehicle: Vehicle | null;
}

export const VehicleSection: React.FC<VehicleSectionProps> = ({ currentVehicle }) => {
  return (
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
  );
};