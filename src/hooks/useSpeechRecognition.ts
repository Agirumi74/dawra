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
  continuous = false,
  autoStopTimeout = 10000 // Auto-stop after 10 seconds by default
): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalResultReceived = useRef(false);

  // Auto-stop function
  const autoStop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setError('Écoute arrêtée automatiquement après délai dépassé');
    }
  }, [isListening]);

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
        finalResultReceived.current = false;
        
        // Set auto-stop timeout
        if (autoStopTimeout > 0) {
          timeoutRef.current = setTimeout(autoStop, autoStopTimeout);
        }
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
            finalResultReceived.current = true;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          setConfidence(maxConfidence);
          
          // Auto-stop after receiving final result if confidence is good
          if (maxConfidence > 0.7 && !continuous) {
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
              }
            }, 1000); // Small delay to allow for more speech
          }
        } else if (interimTranscript) {
          setTranscript(interimTranscript.trim());
          setConfidence(0.5); // Interim confidence estimate
        }
      };
      
      recognition.onerror = (event: any) => {
        setError(`Erreur de reconnaissance vocale: ${event.error}`);
        setIsListening(false);
        
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        
        // Clear timeout when recognition ends
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [language, continuous, autoStopTimeout, autoStop]);

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
    
    // Clear timeout when manually stopping
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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