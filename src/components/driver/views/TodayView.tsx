import React from 'react';
import { RouteSection } from '../sections/RouteSection';
import { QuickActionsSection } from '../sections/QuickActionsSection';
import type { Vehicle } from '../../context/AppContext';

interface TodayViewProps {
  currentVehicle: Vehicle | null;
  todayRoute: unknown;
  onScanClick: () => void;
  onGPSManagerClick: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  currentVehicle,
  todayRoute,
  onScanClick,
  onGPSManagerClick
}) => {
  return (
    <div className="space-y-6">
      <RouteSection todayRoute={todayRoute} />
      <QuickActionsSection onScanClick={onScanClick} onGPSManagerClick={onGPSManagerClick} />
    </div>
  );
};