import React from 'react';

interface Package {
  id: string;
  status: 'pending' | 'delivered' | 'failed';
  address: {
    full_address: string;
  };
  location: string;
}

interface PackageStatsSectionProps {
  packages: Package[];
  deliveredCount: number;
  failedCount: number;
}

export const PackageStatsSection: React.FC<PackageStatsSectionProps> = ({
  packages,
  deliveredCount,
  failedCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">Colis scannés aujourd'hui</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">{packages.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
          <div className="text-sm text-gray-600">Livrés</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          <div className="text-sm text-gray-600">Échecs</div>
        </div>
      </div>
    </div>
  );
};