import React from 'react';
import { VehicleSection } from '../sections/VehicleSection';
import { RouteSection } from '../sections/RouteSection';
import { QuickActionsSection } from '../sections/QuickActionsSection';
import { AlertsSection } from '../sections/AlertsSection';
import { GPSOptimizationSection } from '../sections/GPSOptimizationSection';

interface TodayViewProps {
  currentVehicle: any;
  todayRoute: any;
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
      <VehicleSection currentVehicle={currentVehicle} />
      <RouteSection todayRoute={todayRoute} />
      <QuickActionsSection onScanClick={onScanClick} onGPSManagerClick={onGPSManagerClick} />
      <GPSOptimizationSection onGPSManagerClick={onGPSManagerClick} />
      <AlertsSection />
    </div>
  );
};