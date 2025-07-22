import React from 'react';
import { render, screen } from '@testing-library/react';
import { PackageStatsSection } from '../sections/PackageStatsSection';

describe('PackageStatsSection', () => {
  const mockPackages = [
    {
      id: '1',
      status: 'pending' as const,
      address: { full_address: '123 Test St' },
      location: 'Test Location 1'
    },
    {
      id: '2',
      status: 'delivered' as const,
      address: { full_address: '456 Test Ave' },
      location: 'Test Location 2'
    },
    {
      id: '3',
      status: 'failed' as const,
      address: { full_address: '789 Test Blvd' },
      location: 'Test Location 3'
    }
  ];

  it('renders package statistics correctly', () => {
    render(
      <PackageStatsSection 
        packages={mockPackages}
        deliveredCount={1}
        failedCount={1}
      />
    );
    
    expect(screen.getByText('Colis scannés aujourd\'hui')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Delivered
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Livrés')).toBeInTheDocument();
    expect(screen.getByText('Échecs')).toBeInTheDocument();
  });

  it('displays zero counts when no packages provided', () => {
    render(
      <PackageStatsSection 
        packages={[]}
        deliveredCount={0}
        failedCount={0}
      />
    );
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});