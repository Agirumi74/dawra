import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionsSection } from '../sections/QuickActionsSection';

describe('QuickActionsSection', () => {
  const mockOnScanClick = jest.fn();
  const mockOnGPSManagerClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both action buttons', () => {
    render(
      <QuickActionsSection 
        onScanClick={mockOnScanClick}
        onGPSManagerClick={mockOnGPSManagerClick}
      />
    );
    
    expect(screen.getByText('Scanner un colis')).toBeInTheDocument();
    expect(screen.getByText('GPS Manager')).toBeInTheDocument();
    expect(screen.getByText('Démarrer le scan de codes-barres')).toBeInTheDocument();
    expect(screen.getByText('Optimiser vos tournées')).toBeInTheDocument();
  });

  it('calls onScanClick when scan button is clicked', () => {
    render(
      <QuickActionsSection 
        onScanClick={mockOnScanClick}
        onGPSManagerClick={mockOnGPSManagerClick}
      />
    );
    
    const scanButton = screen.getByText('Scanner un colis');
    fireEvent.click(scanButton);
    
    expect(mockOnScanClick).toHaveBeenCalledTimes(1);
  });

  it('calls onGPSManagerClick when GPS button is clicked', () => {
    render(
      <QuickActionsSection 
        onScanClick={mockOnScanClick}
        onGPSManagerClick={mockOnGPSManagerClick}
      />
    );
    
    const gpsButton = screen.getByText('GPS Manager');
    fireEvent.click(gpsButton);
    
    expect(mockOnGPSManagerClick).toHaveBeenCalledTimes(1);
  });
});