import React, { useRef, useEffect, useState } from 'react';
import { Camera, RotateCcw, Check, X, Loader2 } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  title: string;
  subtitle: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  isProcessing = false,
  title,
  subtitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsReady(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capturer l'image
    context.drawImage(video, 0, 0);

    // Convertir en base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
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
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay pour guider la capture */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center">
            <div className="text-white text-center">
              <Camera size={32} className="mx-auto mb-2 opacity-75" />
              <p className="text-sm opacity-75">Cadrez l'adresse ici</p>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
              <p className="text-lg font-semibold">Analyse en cours...</p>
              <p className="text-sm opacity-75">Extraction de l'adresse</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
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
            disabled={isProcessing}
            className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={24} className="text-gray-700" />
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Appuyez sur le bouton bleu pour capturer l'adresse
          </p>
        </div>
      </div>
    </div>
  );
};