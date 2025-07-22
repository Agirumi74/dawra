import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// Mock the speech recognition API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'fr-FR',
  maxAlternatives: 1,
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
};

// @ts-expect-error - Mocking global SpeechRecognition
global.window.SpeechRecognition = jest.fn(() => mockSpeechRecognition);
// @ts-expect-error - Mocking global webkitSpeechRecognition
global.window.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.isSupported).toBe(true);
  });

  test('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition.start).toHaveBeenCalled();
  });

  test('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // Start listening first
    act(() => {
      result.current.startListening();
      // Simulate recognition start
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    expect(result.current.isListening).toBe(true);

    // Now stop listening
    act(() => {
      result.current.stopListening();
    });

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  test('should auto-stop after timeout', () => {
    const { result } = renderHook(() => useSpeechRecognition('fr-FR', false, 5000));

    act(() => {
      result.current.startListening();
      // Simulate recognition start
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    expect(result.current.isListening).toBe(true);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  test('should handle speech result with high confidence', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
      // Simulate recognition start
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    // Simulate speech result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: {
            transcript: '38 Clos du nant',
            confidence: 0.9
          },
          isFinal: true
        }
      ]
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.transcript).toBe('38 Clos du nant');
    expect(result.current.confidence).toBe(0.9);
  });

  test('should handle interim results', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    // Simulate interim result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: {
            transcript: '38 Clos',
            confidence: 0.5
          },
          isFinal: false
        }
      ]
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.transcript).toBe('38 Clos');
    expect(result.current.confidence).toBe(0.5);
  });

  test('should reset transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    // Set some transcript first
    act(() => {
      result.current.startListening();
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
      
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            0: {
              transcript: 'test transcript',
              confidence: 0.8
            },
            isFinal: true
          }
        ]
      };
      
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.transcript).toBe('test transcript');

    // Reset transcript
    act(() => {
      result.current.resetTranscript();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBe(null);
  });
});