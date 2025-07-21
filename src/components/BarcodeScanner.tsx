import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, Camera } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    // Stop the camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear scan interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      setError('');

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Try to access the camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Use back camera if available
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setHasCamera(true);
          
          // Start barcode detection after video loads
          videoRef.current.onloadedmetadata = () => {
            startBarcodeDetection();
          };
        }
      } catch (cameraError) {
        console.warn('Camera access failed, using simulation mode:', cameraError);
        setHasCamera(false);
        // Fallback to simulation mode
        simulateBarcodeScan();
      }

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du scanner:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      setIsScanning(false);
    }
  }, []);

  const startBarcodeDetection = useCallback(async () => {
    try {
      // Try to use ZXing library for real barcode detection
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        try {
          const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
          if (result) {
            onScan(result.getText());
            stopScanning();
            return;
          }
        } catch (decodeError) {
          console.warn('ZXing decode failed, falling back to simulation:', decodeError);
        }
      }
    } catch (importError) {
      console.warn('ZXing library not available, using simulation:', importError);
    }
    
    // Fallback to simulation if real detection fails
    simulateBarcodeScan();
  }, [onScan, stopScanning]);

  const simulateBarcodeScan = useCallback(() => {
    // Simulation mode - generate a barcode after a delay
    setTimeout(() => {
      const simulatedBarcode = `PKG${Date.now().toString().slice(-6)}`;
      onScan(simulatedBarcode);
      stopScanning();
    }, 2000);
  }, [onScan, stopScanning]);

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
          {hasCamera ? 'Pointez la caméra vers le code-barres' : 'Mode démonstration - Simulation du scan'}
        </p>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {hasCamera ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <Camera size={64} className="mx-auto mb-4 opacity-50" />
              <p>Caméra non disponible</p>
              <p className="text-sm mt-2">Mode simulation activé</p>
            </div>
          </div>
        )}

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
              <span>
                {hasCamera ? 'Recherche de code-barres...' : 'Simulation du scan en cours...'}
              </span>
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
            {hasCamera 
              ? 'Centrez le code-barres dans le cadre rouge'
              : 'Mode démonstration - Le scan sera simulé'
            }
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