# Dawra - Delivery Route Assistant

## 🚀 Overview

Dawra is a comprehensive delivery route management application designed for delivery drivers. It provides barcode scanning, address capture, route optimization, and package tracking capabilities.

## ✅ Current Features Working

### 📱 **Scanning & Photo Functionality**
- **Barcode Scanner**: ZXing-powered barcode scanning with camera access
- **Address OCR**: OCR address capture from package labels using Gemini AI
- **Photo Documentation**: Package photo capture for delivery proof
- **Simulation Modes**: Test functionality without physical camera access
- **Cross-Browser Support**: Works on desktop and mobile browsers
- **iOS Safari Optimized**: Special handling for iOS camera permissions

### 🎯 **Core Application Features**
- **Package Management**: Add, track, and manage delivery packages
- **Route Planning**: GPS-enabled route optimization 
- **Driver Dashboard**: Comprehensive dashboard with statistics
- **Settings Configuration**: Customizable camera, OCR, and personal settings
- **Offline Support**: Local storage with CSV address fallback
- **Touch-Optimized UI**: Mobile-first responsive design

## 🔧 Setup Instructions

### Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- Modern web browser with camera support

### Installation

```bash
# Clone the repository
git clone https://github.com/Agirumi74/dawra.git
cd dawra

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Optional Configuration

#### Gemini AI OCR (Optional)
For enhanced address recognition:

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Go to Settings in the app
3. Enter your API key in "API Gemini 2.0 Flash" section
4. Click "Tester" to verify

**Note**: The app works fully without Gemini API - basic OCR is available.

## 🎮 Usage Guide

### Scanning Packages

#### Method 1: Barcode Scanning
1. Click **Scanner** tab
2. Click **"Démarrer le scan"**
3. Allow camera permissions when prompted
4. Point camera at barcode OR click **"Mode Simulation"** for testing
5. Package form opens automatically with scanned code

#### Method 2: Manual Entry  
1. Click **Scanner** tab
2. Click **"Saisie manuelle"**
3. Fill in package details manually

### Address Capture
1. In package form, click **"Scanner"** next to address field
2. Point camera at address label OR click **"Mode Simulation OCR"**
3. Address auto-fills in form fields
4. Verify and adjust as needed

### Package Management
1. Complete package form with:
   - Address details (auto-filled or manual)
   - Truck location (8 predefined positions)
   - Delivery type (Particulier/Entreprise)
   - Priority level
   - Optional notes and photos
2. Click **"Enregistrer et continuer"**
3. Choose to add more packages or finish

## 🎯 Testing & Simulation

### No Camera? No Problem!
When camera access is unavailable, the app provides simulation modes:

- **Barcode Simulation**: Generates realistic package codes (PKG + timestamp)
- **OCR Simulation**: Provides realistic French addresses for testing
- **Photo Simulation**: Allows testing photo workflows

This enables full functionality testing in development environments.

## ⚙️ Configuration

### Camera Settings
- **Resolution**: 480p/720p/1080p (720p recommended)
- **Camera Facing**: Environment (back) or User (front)
- **iOS Compatibility**: Optimized constraints for Safari

### OCR Settings  
- **Gemini API**: Optional for enhanced accuracy
- **Timeout**: 10-60 seconds (30s default)
- **Fallback**: Basic browser OCR always available

### Personal Settings
- **Driver Information**: Name and vehicle number
- **Truck Locations**: Customize storage positions
- **Default Settings**: Personalize frequently used options

## 🛠️ Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Camera**: Native MediaDevices API
- **Barcode**: @zxing/browser library
- **OCR**: Google Gemini AI + basic browser OCR
- **Storage**: localStorage with IndexedDB fallback
- **Maps**: Leaflet + OpenStreetMap
- **Address Data**: BAN API + local CSV fallback

### Browser Support
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile, Samsung Internet
- **iOS**: Safari (optimized for camera permissions)
- **Android**: Chrome Mobile (native camera support)

### Performance
- **Bundle Size**: ~475KB (gzipped ~135KB)
- **Load Time**: <2s on modern devices
- **Camera Init**: <1s on most devices
- **Offline**: Full functionality with cached data

## 🔍 Troubleshooting

### Camera Issues
1. **"Camera not found"**: Enable camera permissions in browser settings
2. **iOS black screen**: Use Safari, ensure camera permissions enabled
3. **Permission denied**: Check browser settings → Site permissions → Camera

### OCR Issues  
1. **Address not detected**: Use simulation mode or manual entry
2. **Gemini errors**: Check API key, try basic OCR fallback
3. **Slow processing**: Reduce timeout in settings

### General Issues
1. **App not loading**: Clear browser cache, check console errors
2. **Data not saving**: Check localStorage availability
3. **GPS not working**: Enable location permissions

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Hosting
- Static hosting (Netlify, Vercel, GitHub Pages)
- CDN recommended for global delivery
- HTTPS required for camera access

## 📱 Mobile Installation

### PWA Support
1. Open app in mobile browser
2. Browser will prompt "Add to Home Screen"
3. App installs like native application
4. Works offline with cached data

### Features
- Native camera integration
- Offline functionality  
- Background sync (when available)
- Push notifications (future feature)

## 🔐 Security & Privacy

### Data Handling
- **Local Storage**: All data stored locally on device
- **No Backend**: No user data transmitted to servers
- **Camera**: Images processed locally, not uploaded
- **Gemini API**: Only image data sent (when configured)

### Permissions
- **Camera**: Required for scanning functionality
- **Location**: Optional for GPS features
- **Storage**: Required for package data persistence

## 🎨 Development

### Scripts
```bash
npm run dev        # Development server
npm run build      # Production build  
npm run preview    # Preview production build
npm run lint       # ESLint checking
npm run test       # Jest test suite
```

### Project Structure
```
src/
├── components/           # React components
│   ├── BarcodeScanner.tsx   # Barcode scanning
│   ├── CameraCapture.tsx    # Photo/OCR capture
│   └── driver/              # Driver dashboard
├── services/            # Business logic
│   ├── unifiedOCR.ts       # OCR service
│   └── settingsService.ts   # Configuration
├── hooks/               # React hooks
└── types/               # TypeScript definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check this documentation
2. Review troubleshooting section
3. Open an issue on GitHub
4. Contact the development team

---

**Built with ❤️ for delivery drivers**