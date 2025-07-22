import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RotateCcw, X, Loader2, AlertCircle, Settings } from 'lucide-react';
import { settingsService } from '../services/settingsService';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  isProcessing?: boolean;
  title: string;
  subtitle: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  onOpenSettings,
  isProcessing = false,
  title,
  subtitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsReady(false);
  }, [stream]);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
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

      // Get constraints from settings
      const constraints = settingsService.getCameraConstraints();
      // Override facing mode with current selection
      constraints.video = {
        ...constraints.video,
        facingMode
      };

      const testStream = await navigator.mediaDevices.getUserMedia(constraints);
      testStream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Permission d\'accès à la caméra refusée. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
        } else if (error.name === 'NotFoundError') {
          setError('Aucune caméra détectée sur cet appareil.');
        } else if (error.name === 'NotReadableError') {
          setError('La caméra est déjà utilisée par une autre application.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Erreur inconnue lors de l\'accès à la caméra');
      }
      
      return false;
    }
  }, [facingMode]);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsInitializing(true);
      setIsReady(false);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsInitializing(false);
        return;
      }

      // Get constraints from settings
      const constraints = settingsService.getCameraConstraints();
      // Override facing mode with current selection
      constraints.video = {
        ...constraints.video,
        facingMode
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
          setIsInitializing(false);
        };
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de la caméra:', error);
      setError('Impossible de démarrer la caméra. Vérifiez les permissions et réessayez.');
      setIsInitializing(false);
    }
  }, [facingMode, requestCameraPermission]);

  useEffect(() => {
    // Initialize with settings default
    setFacingMode(settingsService.getSetting('cameraFacing'));
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (stream) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !isReady || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Adjust canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capture the image
    context.drawImage(video, 0, 0);

    // Convert to base64 with high quality for OCR
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(imageData);
  };

  const switchCamera = () => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {isReady ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay for capture guidance */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera size={32} className="mx-auto mb-2 opacity-75" />
                  <p className="text-sm opacity-75">Cadrez l'adresse ici</p>
                </div>
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
                <p className="text-sm opacity-75 mb-4">{error}</p>
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

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
              <p className="text-lg font-semibold">Analyse en cours...</p>
              <p className="text-sm opacity-75">Extraction automatique de l'adresse</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            disabled={isProcessing}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Settings size={24} className="text-gray-700" />
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-gray-700" />
          </button>

          {/* Capture */}
          <button
            onClick={captureImage}
            disabled={!isReady || isProcessing}
            className="p-6 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={32} className="text-white" />
          </button>

          {/* Switch Camera */}
          <button
            onClick={switchCamera}
            disabled={isProcessing || isInitializing}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            title={`Basculer vers caméra ${facingMode === 'user' ? 'arrière' : 'avant'}`}
          >
            <RotateCcw size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isReady 
              ? 'Appuyez sur le bouton bleu pour capturer l\'adresse'
              : 'Caméra requise pour capturer l\'adresse'
            }
          </p>
        </div>
      </div>
    </div>
  );
};