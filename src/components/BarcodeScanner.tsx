import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';
import { X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
  isActive: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onCancel,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const handleStartScanning = async () => {
      try {
        setIsScanning(true);
        setError('');

        // Initialiser le lecteur de code-barres
        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
        }

        const reader = readerRef.current;

        // Obtenir la liste des caméras disponibles
        const videoInputDevices = await reader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          throw new Error('Aucune caméra disponible');
        }

        // Utiliser la caméra arrière par défaut, ou la première disponible
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId;

        // Commencer le scan
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result: Result | null, error?: Error) => {
            if (result) {
              const barcodeText = result.getText();
              if (barcodeText) {
                onScan(barcodeText);
                handleStopScanning();
              }
            }
            if (error && error.name !== 'NotFoundException') {
              console.warn('Erreur de scan:', error);
            }
          }
        );

      } catch (error) {
        console.error('Erreur lors de l\'initialisation du scanner:', error);
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
        setIsScanning(false);
      }
    };

    const handleStopScanning = () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsScanning(false);
    };

    if (isActive) {
      handleStartScanning();
    } else {
      handleStopScanning();
    }

    return () => handleStopScanning();
  }, [isActive, onScan]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">Scanner le code-barres</h2>
        <p className="text-gray-600 text-sm mt-1">
          Pointez la caméra vers le code-barres du colis
        </p>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Overlay pour guider le scan */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-red-500 rounded-lg w-80 h-32">
            <div className="absolute inset-0 border-2 border-transparent rounded-lg"
                 style={{
                   background: `
                     linear-gradient(90deg, red 50%, transparent 50%),
                     linear-gradient(90deg, red 50%, transparent 50%),
                     linear-gradient(0deg, red 50%, transparent 50%),
                     linear-gradient(0deg, red 50%, transparent 50%)
                   `,
                   backgroundSize: '20px 2px, 20px 2px, 2px 20px, 2px 20px',
                   backgroundPosition: '0 0, 0 100%, 0 0, 100% 0',
                   backgroundRepeat: 'no-repeat'
                 }}>
            </div>
          </div>
        </div>

        {/* Ligne de scan animée */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-32 relative overflow-hidden">
            <div 
              className="absolute w-full h-0.5 bg-red-500 animate-pulse"
              style={{
                animation: 'scanLine 2s ease-in-out infinite',
                boxShadow: '0 0 10px red'
              }}
            />
          </div>
        </div>

        {/* Messages d'état */}
        {isScanning && (
          <div className="absolute bottom-24 left-0 right-0 text-center">
            <div className="inline-flex items-center space-x-2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
              <Loader2 size={20} className="animate-spin" />
              <span>Recherche de code-barres...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-24 left-0 right-0 text-center">
            <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-center">
          <button
            onClick={onCancel}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Centrez le code-barres dans le cadre rouge
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};