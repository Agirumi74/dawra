import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
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

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      setError('');

      // Pour cette démonstration, simuler un scan de code-barres
      // En production, cela utiliserait la vraie caméra
      setTimeout(() => {
        const simulatedBarcode = `PKG${Date.now().toString().slice(-6)}`;
        onScan(simulatedBarcode);
        stopScanning();
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du scanner:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setIsScanning(false);
    }
  }, [onScan]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isActive, startScanning, stopScanning]);



  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 safe-area-top text-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Scanner le code-barres</h2>
        <p className="text-gray-600 text-sm mt-1">
          Mode démonstration - Simulation du scan
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
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="border-2 border-red-500 rounded-lg w-full max-w-sm h-32 md:h-40">
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
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm h-32 md:h-40 relative overflow-hidden">
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
          <div className="absolute bottom-32 left-4 right-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg">
              <Loader2 size={20} className="animate-spin" />
              <span>Simulation du scan en cours...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-32 left-4 right-4 text-center">
            <div className="inline-block bg-red-600 text-white px-4 py-3 rounded-lg max-w-sm mx-auto">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 safe-area-bottom">
        <div className="flex items-center justify-center">
          <button
            onClick={onCancel}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation"
            style={{ minWidth: '60px', minHeight: '60px' }}
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
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 1rem);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1.5rem);
        }
      `}</style>
    </div>
  );
};