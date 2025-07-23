import React from 'react';
import { Package, CheckCircle, XCircle } from 'lucide-react';

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
  const stats = [
    {
      icon: Package,
      value: packages.length,
      label: 'Total',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600'
    },
    {
      icon: CheckCircle,
      value: deliveredCount,
      label: 'Livrés',
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-600'
    },
    {
      icon: XCircle,
      value: failedCount,
      label: 'Échecs',
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Colis scannés aujourd'hui</h3>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-4 text-center`}>
            <div className="flex justify-center mb-2">
              <stat.icon size={24} className={stat.iconColor} />
            </div>
            <div className={`text-2xl font-bold ${stat.textColor} mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};