import React from 'react';

interface Package {
  id: string;
  status: 'pending' | 'delivered' | 'failed';
  address: {
    full_address: string;
  };
  location: string;
}

interface RecentPackagesSectionProps {
  packages: Package[];
}

export const RecentPackagesSection: React.FC<RecentPackagesSectionProps> = ({ packages }) => {
  if (packages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-lg font-semibold mb-4">Colis récents</h3>
      <div className="space-y-3">
        {packages.slice(-5).reverse().map((pkg) => (
          <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{pkg.address.full_address}</p>
              <p className="text-xs text-gray-600 truncate">{pkg.location}</p>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ml-2 whitespace-nowrap ${
              pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              pkg.status === 'delivered' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {pkg.status === 'pending' ? 'En attente' :
               pkg.status === 'delivered' ? 'Livré' : 'Échec'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};