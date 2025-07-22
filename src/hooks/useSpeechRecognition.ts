import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export const useSpeechRecognition = (
  language = 'fr-FR',
  continuous = false
): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;
          const confidencePart = result[0].confidence || 0;
          
          if (result.isFinal) {
            finalTranscript += transcriptPart;
            maxConfidence = Math.max(maxConfidence, confidencePart);
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          setConfidence(maxConfidence);
        } else if (interimTranscript) {
          setTranscript(interimTranscript.trim());
          setConfidence(0.5); // Interim confidence estimate
        }
      };
      
      recognition.onerror = (event: any) => {
        setError(`Erreur de reconnaissance vocale: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Reconnaissance vocale non supportée par ce navigateur');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};