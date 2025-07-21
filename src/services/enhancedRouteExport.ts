import { DeliveryPoint } from '../types';

export interface ExternalGPSOptions {
  includeWaypoints: boolean;
  optimizeOrder: boolean;
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit';
}

export class EnhancedRouteExportService {
  /**
   * Export complet vers Google Maps avec waypoints optimisés
   */
  static exportToGoogleMaps(deliveryPoints: DeliveryPoint[], options: ExternalGPSOptions = {
    includeWaypoints: true,
    optimizeOrder: true,
    travelMode: 'driving'
  }): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    let url = 'https://www.google.com/maps/dir/?api=1';
    
    // Point de départ (origine)
    const origin = validPoints[0];
    url += `&origin=${origin.address.coordinates!.lat},${origin.address.coordinates!.lng}`;
    
    // Point de destination (dernier point)
    const destination = validPoints[validPoints.length - 1];
    url += `&destination=${destination.address.coordinates!.lat},${destination.address.coordinates!.lng}`;
    
    // Waypoints intermédiaires (maximum 23 pour Google Maps)
    if (options.includeWaypoints && validPoints.length > 2) {
      const waypoints = validPoints.slice(1, -1).slice(0, 23).map(point => {
        const { lat, lng } = point.address.coordinates!;
        return `${lat},${lng}`;
      }).join('|');
      
      if (waypoints.length > 0) {
        url += `&waypoints=${waypoints}`;
        if (options.optimizeOrder) {
          url += '&waypoint_opt=true';
        }
      }
    }
    
    // Mode de transport
    url += `&travelmode=${options.travelMode}`;
    
    // Ouvrir dans une nouvelle fenêtre
    window.open(url, '_blank');
  }

  /**
   * Export vers Waze avec support pour points multiples
   */
  static exportToWaze(deliveryPoints: DeliveryPoint[]): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    // Waze ne supporte qu'une destination à la fois
    // On ouvre le premier point et affiche un message pour les suivants
    const firstPoint = validPoints[0];
    const { lat, lng } = firstPoint.address.coordinates!;
    
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`;
    window.open(url, '_blank');

    // Si plusieurs points, afficher une notification
    if (validPoints.length > 1) {
      const message = `Waze ne supporte qu'une destination à la fois.\n\nProchains arrêts:\n${
        validPoints.slice(1, 4).map((point, index) => 
          `${index + 2}. ${point.address.full_address}`
        ).join('\n')
      }${validPoints.length > 4 ? '\n...' : ''}`;
      
      alert(message);
    }
  }

  /**
   * Export vers Apple Maps (iOS)
   */
  static exportToAppleMaps(deliveryPoints: DeliveryPoint[], options: ExternalGPSOptions = {
    includeWaypoints: true,
    optimizeOrder: false,
    travelMode: 'driving'
  }): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    // Apple Maps supporte les waypoints mais de façon limitée
    const firstPoint = validPoints[0];
    const { lat, lng } = firstPoint.address.coordinates!;
    
    let url = `maps://maps.apple.com/?daddr=${lat},${lng}`;
    
    // Mode de transport
    const transportMode = options.travelMode === 'driving' ? 'd' : 
                         options.travelMode === 'walking' ? 'w' : 
                         options.travelMode === 'transit' ? 'r' : 'd';
    url += `&dirflg=${transportMode}`;
    
    // Nom de la destination
    url += `&t=m&z=16`;
    
    window.open(url, '_blank');

    // Afficher les points suivants si plusieurs
    if (validPoints.length > 1) {
      const message = `Première destination ouverte dans Plans.\n\nProchains arrêts:\n${
        validPoints.slice(1, 4).map((point, index) => 
          `${index + 2}. ${point.address.full_address}`
        ).join('\n')
      }${validPoints.length > 4 ? '\n...' : ''}`;
      
      alert(message);
    }
  }

  /**
   * Export de la tournée complète sous forme de GPX
   */
  static exportToGPX(deliveryPoints: DeliveryPoint[], tourName: string = 'Tournée de livraison'): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    const gpxContent = this.generateGPXContent(validPoints, tourName);
    this.downloadFile(gpxContent, `tournee-${new Date().toISOString().split('T')[0]}.gpx`, 'application/gpx+xml');
  }

  /**
   * Export de la tournée complète sous forme de KML (Google Earth)
   */
  static exportToKML(deliveryPoints: DeliveryPoint[], tourName: string = 'Tournée de livraison'): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    const kmlContent = this.generateKMLContent(validPoints, tourName);
    this.downloadFile(kmlContent, `tournee-${new Date().toISOString().split('T')[0]}.kml`, 'application/vnd.google-earth.kml+xml');
  }

  /**
   * Export vers Here Maps
   */
  static exportToHereMaps(deliveryPoints: DeliveryPoint[]): void {
    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    if (validPoints.length === 0) {
      throw new Error('Aucun point avec coordonnées valides');
    }

    const firstPoint = validPoints[0];
    const lastPoint = validPoints[validPoints.length - 1];
    
    let url = `https://wego.here.com/directions/drive/`;
    
    // Point de départ
    url += `${firstPoint.address.coordinates!.lat},${firstPoint.address.coordinates!.lng}`;
    
    // Point d'arrivée
    url += `/${lastPoint.address.coordinates!.lat},${lastPoint.address.coordinates!.lng}`;
    
    // Waypoints (Here Maps supporte jusqu'à 16 waypoints)
    if (validPoints.length > 2) {
      const waypoints = validPoints.slice(1, -1).slice(0, 16).map(point => {
        const { lat, lng } = point.address.coordinates!;
        return `${lat},${lng}`;
      }).join('/');
      
      if (waypoints.length > 0) {
        url = `https://wego.here.com/directions/drive/${firstPoint.address.coordinates!.lat},${firstPoint.address.coordinates!.lng}/${waypoints}/${lastPoint.address.coordinates!.lat},${lastPoint.address.coordinates!.lng}`;
      }
    }
    
    window.open(url, '_blank');
  }

  /**
   * Détection automatique du meilleur GPS selon la plateforme
   */
  static exportToNativeGPS(deliveryPoints: DeliveryPoint[], options?: ExternalGPSOptions): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      this.exportToAppleMaps(deliveryPoints, options);
    } else if (isAndroid) {
      this.exportToGoogleMaps(deliveryPoints, options);
    } else {
      // Desktop - proposer plusieurs options
      const choice = confirm('Choisir Google Maps ? (Annuler pour Here Maps)');
      if (choice) {
        this.exportToGoogleMaps(deliveryPoints, options);
      } else {
        this.exportToHereMaps(deliveryPoints);
      }
    }
  }

  /**
   * Export vers app GPS avec deep linking intelligent
   */
  static exportWithDeepLinking(deliveryPoints: DeliveryPoint[], appPreference: 'auto' | 'google' | 'waze' | 'apple' | 'here' = 'auto'): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (appPreference === 'auto') {
      if (isIOS) {
        appPreference = 'apple';
      } else if (isAndroid) {
        appPreference = 'google';
      } else {
        appPreference = 'google';
      }
    }

    const options: ExternalGPSOptions = {
      includeWaypoints: true,
      optimizeOrder: false, // On garde notre optimisation
      travelMode: 'driving'
    };

    try {
      switch (appPreference) {
        case 'google':
          this.exportToGoogleMaps(deliveryPoints, options);
          break;
        case 'waze':
          this.exportToWaze(deliveryPoints);
          break;
        case 'apple':
          this.exportToAppleMaps(deliveryPoints, options);
          break;
        case 'here':
          this.exportToHereMaps(deliveryPoints);
          break;
        default:
          this.exportToNativeGPS(deliveryPoints, options);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export GPS:', error);
      // Fallback vers Google Maps web
      this.exportToGoogleMaps(deliveryPoints, options);
    }
  }

  /**
   * Partage de la tournée via Web Share API
   */
  static async shareTour(deliveryPoints: DeliveryPoint[], tourName: string = 'Ma tournée'): Promise<void> {
    if (!navigator.share) {
      throw new Error('Web Share API non supportée');
    }

    const validPoints = deliveryPoints
      .filter(point => point.address.coordinates)
      .sort((a, b) => a.order - b.order);

    const tourText = this.generateTourShareText(validPoints, tourName);
    
    try {
      await navigator.share({
        title: tourName,
        text: tourText,
        url: window.location.href
      });
    } catch (error) {
      // Fallback - copier dans le presse-papier
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(tourText);
        alert('Tournée copiée dans le presse-papier');
      } else {
        throw error;
      }
    }
  }

  /**
   * Génération du contenu GPX
   */
  private static generateGPXContent(deliveryPoints: DeliveryPoint[], tourName: string): string {
    const now = new Date().toISOString();
    
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Dawra GPS Manager" 
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${tourName}</name>
    <desc>Tournée de livraison générée par Dawra</desc>
    <time>${now}</time>
  </metadata>
`;

    // Ajouter les waypoints
    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.address.coordinates!;
      gpx += `
  <wpt lat="${lat}" lon="${lng}">
    <name>Arrêt ${point.order}</name>
    <desc>${point.address.full_address} - ${point.packages.length} colis</desc>
    <type>delivery</type>
  </wpt>`;
    });

    // Ajouter la route
    gpx += `
  <rte>
    <name>${tourName} - Route</name>
    <desc>Itinéraire optimisé de livraison</desc>`;

    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.address.coordinates!;
      gpx += `
    <rtept lat="${lat}" lon="${lng}">
      <name>Arrêt ${point.order}</name>
      <desc>${point.address.full_address}</desc>
    </rtept>`;
    });

    gpx += `
  </rte>
</gpx>`;

    return gpx;
  }

  /**
   * Génération du contenu KML
   */
  private static generateKMLContent(deliveryPoints: DeliveryPoint[], tourName: string): string {
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${tourName}</name>
    <description>Tournée de livraison générée par Dawra</description>
    
    <Style id="deliveryPoint">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    
    <Style id="routeLine">
      <LineStyle>
        <color>ff0000ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    
    <Folder>
      <name>Points de livraison</name>`;

    // Ajouter les points
    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.address.coordinates!;
      kml += `
      <Placemark>
        <name>Arrêt ${point.order}</name>
        <description><![CDATA[
          <b>Adresse:</b> ${point.address.full_address}<br/>
          <b>Colis:</b> ${point.packages.length}<br/>
          <b>Priorité:</b> ${point.priority}<br/>
          <b>Heure prévue:</b> ${point.estimatedTime || 'Non calculée'}
        ]]></description>
        <styleUrl>#deliveryPoint</styleUrl>
        <Point>
          <coordinates>${lng},${lat},0</coordinates>
        </Point>
      </Placemark>`;
    });

    kml += `
    </Folder>
    
    <Placemark>
      <name>Itinéraire</name>
      <description>Route optimisée de livraison</description>
      <styleUrl>#routeLine</styleUrl>
      <LineString>
        <coordinates>`;

    // Ajouter les coordonnées de la route
    deliveryPoints.forEach((point) => {
      const { lat, lng } = point.address.coordinates!;
      kml += `${lng},${lat},0 `;
    });

    kml += `
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    return kml;
  }

  /**
   * Génération du texte de partage
   */
  private static generateTourShareText(deliveryPoints: DeliveryPoint[], tourName: string): string {
    let text = `📍 ${tourName}\n\n`;
    text += `🚚 ${deliveryPoints.length} arrêts - ${deliveryPoints.reduce((sum, p) => sum + p.packages.length, 0)} colis\n\n`;
    
    text += `📋 ITINÉRAIRE:\n`;
    deliveryPoints.forEach((point) => {
      text += `${point.order}. ${point.estimatedTime || ''} - ${point.address.full_address}\n`;
    });
    
    text += `\n📱 Généré par Dawra GPS Manager`;
    
    return text;
  }

  /**
   * Télécharger un fichier
   */
  private static downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}