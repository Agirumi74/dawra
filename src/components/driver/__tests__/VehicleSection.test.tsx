import React from 'react';
import { render, screen } from '@testing-library/react';
import { VehicleSection } from '../sections/VehicleSection';

describe('VehicleSection', () => {
  const mockVehicle = {
    licensePlate: 'ABC-123',
    brand: 'Mercedes',
    model: 'Sprinter',
    mileage: 45000,
    fuelType: 'Diesel'
  };

  it('renders vehicle information when vehicle is provided', () => {
    render(<VehicleSection currentVehicle={mockVehicle} />);
    
    expect(screen.getByText('Mon véhicule')).toBeInTheDocument();
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
    expect(screen.getByText('Mercedes Sprinter')).toBeInTheDocument();
    expect(screen.getByText('45 000 km')).toBeInTheDocument();
    expect(screen.getByText('Diesel')).toBeInTheDocument();
    expect(screen.getByText('Assigné')).toBeInTheDocument();
  });

  it('renders empty state when no vehicle is provided', () => {
    render(<VehicleSection currentVehicle={null} />);
    
    expect(screen.getByText('Mon véhicule')).toBeInTheDocument();
    expect(screen.getByText('Aucun véhicule assigné')).toBeInTheDocument();
    expect(screen.getByText('Contactez votre responsable')).toBeInTheDocument();
  });

  it('displays today label', () => {
    render(<VehicleSection currentVehicle={mockVehicle} />);
    
    expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument();
  });
});