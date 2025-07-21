# Enhanced Scanning Features Setup

This document explains how to set up and use the enhanced scanning features of the Dawra delivery application.

## Features

### 1. Enhanced Barcode Scanning
- **Real Camera Support**: Automatically detects and uses device camera when available
- **ZXing Integration**: Uses @zxing/browser library for real barcode detection
- **Graceful Fallback**: Falls back to simulation mode when camera is unavailable
- **Better User Feedback**: Clear status messages and visual indicators

### 2. Enhanced OCR Address Scanning  
- **Gemini AI Integration**: Uses Google's Gemini API for accurate address extraction
- **Smart Fallback**: Falls back to simulation when API key is not configured
- **Confidence Scoring**: Provides confidence levels for OCR results
- **Error Handling**: Robust error handling with user-friendly messages

## Setup Instructions

### 1. Gemini API Configuration (Optional)

To enable real OCR functionality with Google's Gemini API:

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Restart the development server

### 2. Camera Permissions

For real barcode scanning, ensure your browser has camera permissions:
- **Chrome/Edge**: Allow camera access when prompted
- **Firefox**: Allow camera access when prompted  
- **Mobile**: Enable camera permissions in browser settings

## Usage

### Barcode Scanning
1. Click "Scanner" tab in the main navigation
2. Click "Démarrer le scan" button
3. If camera is available: Point camera at barcode
4. If camera is unavailable: Simulation mode will generate a test barcode

### Address Scanning (OCR)
1. After scanning a barcode, the package form opens
2. Click the "Scanner" button next to "Adresse de livraison"
3. If camera is available: Point camera at address label
4. If camera is unavailable or API key not configured: Simulation mode will generate a test address

## Technical Details

### Barcode Scanner
- Uses `@zxing/browser` for real barcode detection
- Supports multiple barcode formats (QR codes, EAN, Code 128, etc.)
- Automatically handles camera selection (front/back camera)
- Graceful degradation when camera is not available

### OCR Service
- Uses Google Gemini 1.5 Flash model for vision tasks
- Optimized prompts for address extraction from package labels
- Confidence scoring based on address patterns
- Simulation mode provides realistic test addresses

### Error Handling
- Camera access errors are handled gracefully
- API errors fall back to simulation mode
- User-friendly error messages in French
- Visual feedback for all states (loading, success, error)

## Development

### Environment Variables
- `VITE_GEMINI_API_KEY`: Google Gemini API key for OCR functionality
- Variables prefixed with `VITE_` are exposed to the client-side

### Testing
- Simulation modes allow testing without real camera or API keys
- Test addresses are realistic French addresses
- Test barcodes follow PKG + timestamp format

## Security Notes
- Keep your Gemini API key secure
- Don't commit `.env` files to version control
- API keys are client-side exposed (consider server-side proxy for production)
- Camera permissions are requested on-demand