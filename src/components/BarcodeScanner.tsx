import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, AlertCircle, Settings } from 'lucide-react';
import type { BrowserMultiFormatReader } from '@zxing/browser';
import { settingsService } from '../services/settingsService';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  isActive: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onCancel,
  onOpenSettings,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasCamera, setHasCamera] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

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

    // Stop ZXing reader
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (error) {
        console.warn('Erreur lors de l\'arrêt du lecteur de codes-barres:', error);
      }
    }
  }, []);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('L\'accès à la caméra n\'est pas supporté par ce navigateur');
      }

      // First, check current permission state if the API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permissionStatus.state === 'granted') {
            // Permission already granted, no need to request again
            return true;
          } else if (permissionStatus.state === 'denied') {
            setError('Permission d\'accès à la caméra refusée. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
            return false;
          }
          // If 'prompt', continue to request permission
        } catch (permissionError) {
          // Permission API not supported or failed, continue with getUserMedia
          console.log('API Permissions non supportée, utilisation de getUserMedia direct');
        }
      }

      // Request camera permission with iOS-specific constraints
      const constraints = {
        ...settingsService.getCameraConstraints(),
        video: {
          ...settingsService.getCameraConstraints().video,
          // iOS-specific settings to avoid black screen
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Test successful, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Permission d\'accès à la caméra refusée. Sur iOS: Allez dans Réglages > Safari > Caméra et autorisez l\'accès.');
        } else if (error.name === 'NotFoundError') {
          setError('Aucune caméra détectée sur cet appareil.');
        } else if (error.name === 'NotReadableError') {
          setError('La caméra est déjà utilisée par une autre application. Fermez les autres onglets utilisant la caméra.');
        } else if (error.name === 'OverconstrainedError') {
          setError('Configuration caméra non supportée. Essayez avec des paramètres différents.');
        } else {
          setError(`Erreur caméra: ${error.message}. Sur iOS, assurez-vous d'utiliser Safari et d'autoriser la caméra.`);
        }
      } else {
        setError('Erreur inconnue lors de l\'accès à la caméra');
      }
      
      return false;
    }
  }, []);

  const startBarcodeDetection = useCallback(async () => {
    try {
      setIsScanning(true);
      
      // Load ZXing library for barcode detection
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      if (videoRef.current && hasCamera) {
        try {
          // Start continuous scanning
          const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
          
          if (result && result.getText()) {
            const barcode = result.getText();
            console.log('Code-barres détecté:', barcode);
            onScan(barcode);
            stopScanning();
            return;
          }
        } catch (decodeError) {
          console.warn('Erreur de décodage:', decodeError);
          // Continue scanning if decode fails
        }
      }
      
      // Set up continuous scanning
      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && codeReaderRef.current && hasCamera) {
          try {
            const result = await codeReaderRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
            if (result && result.getText()) {
              const barcode = result.getText();
              console.log('Code-barres détecté:', barcode);
              onScan(barcode);
              stopScanning();
            }
          } catch {
            // Continue scanning on error
          }
        }
      }, 1000); // Scan every second
      
    } catch (importError) {
      console.error('Impossible de charger la bibliothèque ZXing:', importError);
      setError('Erreur lors du chargement du scanner de codes-barres. Veuillez rafraîchir la page.');
      setIsScanning(false);
    }
  }, [onScan, stopScanning, hasCamera]);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsInitializing(true);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsInitializing(false);
        return;
      }

      // Start the actual camera stream with iOS-optimized constraints
      const constraints = {
        ...settingsService.getCameraConstraints(),
        video: {
          ...settingsService.getCameraConstraints().video,
          // iOS-specific optimizations
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 30 },
          // Additional iOS fixes
          aspectRatio: 16/9,
          resizeMode: 'crop-and-scale'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // iOS-specific video element settings
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        setHasCamera(true);
        
        // Start barcode detection after video loads
        videoRef.current.onloadedmetadata = () => {
          setIsInitializing(false);
          // Small delay to ensure video is actually playing on iOS
          setTimeout(() => {
            startBarcodeDetection();
          }, 500);
        };
        
        // Additional event for iOS compatibility
        videoRef.current.onloadeddata = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            setIsInitializing(false);
          }
        };
      }
    } catch (error) {
      console.error('Erreur de démarrage caméra:', error);
      setError('Impossible de démarrer la caméra. Sur iOS, utilisez Safari et vérifiez les permissions dans Réglages > Safari > Caméra.');
      setIsInitializing(false);
      setHasCamera(false);
    }
  }, [requestCameraPermission, startBarcodeDetection]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopScanning();
    }

    return () => stopScanning();
  }, [isActive, startCamera, stopScanning]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 safe-area-top text-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Scanner le code-barres</h2>
        <p className="text-gray-600 text-sm mt-1">
          Pointez la caméra vers le code-barres du colis
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
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="border-2 border-red-500 rounded-lg w-full max-w-sm h-32 md:h-40">
                {/* Corner indicators */}
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

            {/* Animated scan line */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-sm h-32 md:h-40 relative overflow-hidden">
                <div 
                  className="absolute w-full h-0.5 bg-red-500"
                  style={{
                    animation: 'scanLine 2s ease-in-out infinite',
                    boxShadow: '0 0 10px red'
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            {isInitializing ? (
              <div className="text-center text-white">
                <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
                <p className="text-lg">Initialisation de la caméra...</p>
                <p className="text-sm mt-2 opacity-75">Veuillez autoriser l'accès à la caméra</p>
              </div>
            ) : (
              <div className="text-center text-white max-w-sm mx-auto px-4">
                <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium mb-2">Caméra indisponible</p>
                <p className="text-sm opacity-75 mb-4">
                  Impossible d'accéder à la caméra. Vérifiez les permissions et la disponibilité de la caméra.
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {isScanning && hasCamera && (
          <div className="absolute bottom-32 left-4 right-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg">
              <Loader2 size={20} className="animate-spin" />
              <span>Recherche de code-barres...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-32 left-4 right-4 text-center">
            <div className="inline-block bg-red-600 text-white px-4 py-3 rounded-lg max-w-sm mx-auto">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 safe-area-bottom">
        <div className="flex items-center justify-center space-x-4">
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors touch-manipulation"
            style={{ minWidth: '60px', minHeight: '60px' }}
          >
            <Settings size={24} className="text-gray-700" />
          </button>

          {/* Cancel */}
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
              : 'Accès caméra requis pour le scan'
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