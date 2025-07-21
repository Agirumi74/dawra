import { DeliveryPoint } from '../types';
import { RouteSettings } from '../hooks/useRouteSettings';

export interface RouteExportData {
  tourDate: string;
  driverName?: string;
  vehicleInfo?: string;
  startTime: string;
  settings: RouteSettings;
  deliveryPoints: DeliveryPoint[];
  totalDistance: number;
  totalTime: string;
  endTime: string;
}

export class RouteExportService {
  /**
   * Générer un PDF de la feuille de route
   */
  static async exportToPDF(data: RouteExportData): Promise<void> {
    // Créer le contenu HTML pour l'impression
    const htmlContent = this.generateHTMLContent(data);
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print();
      // Fermer la fenêtre après impression (optionnel)
      // printWindow.close();
    };
  }

  /**
   * Exporter vers CSV
   */
  static exportToCSV(data: RouteExportData): void {
    const headers = [
      'Ordre',
      'Heure Prévue',
      'Adresse',
      'Type',
      'Priorité',
      'Nombre de Colis',
      'Codes-barres',
      'Emplacements',
      'Notes',
      'Distance (km)',
      'Statut'
    ];

    const rows = data.deliveryPoints.map(point => [
      point.order.toString(),
      point.estimatedTime || '',
      point.address.full_address,
      point.packages[0]?.type || '',
      point.priority,
      point.packages.length.toString(),
      point.packages.map(p => p.barcode || p.id).join('; '),
      point.packages.map(p => p.location).join('; '),
      point.packages.map(p => p.notes).filter(n => n).join('; '),
      (point.distance || 0).toFixed(1),
      point.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    this.downloadFile(csvContent, `tournee-${data.tourDate}.csv`, 'text/csv');
  }

  /**
   * Exporter la liste des colis
   */
  static exportPackageList(data: RouteExportData): void {
    const headers = [
      'Code-barres',
      'Adresse',
      'Emplacement Camion',
      'Type Livraison',
      'Priorité',
      'Notes',
      'Ordre Tournée',
      'Heure Prévue',
      'Statut'
    ];

    const rows: string[][] = [];
    data.deliveryPoints.forEach(point => {
      point.packages.forEach(pkg => {
        rows.push([
          pkg.barcode || pkg.id,
          point.address.full_address,
          pkg.location,
          pkg.type,
          pkg.priority || 'standard',
          pkg.notes,
          point.order.toString(),
          point.estimatedTime || '',
          pkg.status
        ]);
      });
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    this.downloadFile(csvContent, `colis-${data.tourDate}.csv`, 'text/csv');
  }

  /**
   * Générer le contenu HTML pour l'impression
   */
  private static generateHTMLContent(data: RouteExportData): string {
    const totalPackages = data.deliveryPoints.reduce((sum, point) => sum + point.packages.length, 0);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Feuille de Route - ${data.tourDate}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #2563eb;
        }
        
        .header .date {
            font-size: 16px;
            color: #666;
            margin: 5px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-section {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
        }
        
        .info-section h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #2563eb;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .info-item {
            margin: 5px 0;
        }
        
        .info-item strong {
            color: #333;
        }
        
        .route-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .route-table th,
        .route-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            vertical-align: top;
        }
        
        .route-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 11px;
        }
        
        .route-table td {
            font-size: 10px;
        }
        
        .priority-premier {
            background-color: #fee2e2;
            color: #dc2626;
            font-weight: bold;
        }
        
        .priority-express {
            background-color: #fed7aa;
            color: #ea580c;
            font-weight: bold;
        }
        
        .status-completed {
            background-color: #dcfce7;
            color: #16a34a;
        }
        
        .status-partial {
            background-color: #fef3c7;
            color: #d97706;
        }
        
        .package-details {
            font-size: 9px;
            color: #666;
            margin-top: 3px;
        }
        
        .summary {
            margin-top: 20px;
            padding: 15px;
            border: 2px solid #2563eb;
            border-radius: 4px;
            background-color: #eff6ff;
        }
        
        .summary h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
        }
        
        .summary-item .label {
            font-size: 11px;
            color: #666;
        }
        
        @media print {
            .page-break {
                page-break-before: always;
            }
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚛 Feuille de Route</h1>
        <div class="date">${data.tourDate}</div>
    </div>
    
    <div class="info-grid">
        <div class="info-section">
            <h3>📋 Informations Générales</h3>
            <div class="info-item"><strong>Date:</strong> ${data.tourDate}</div>
            <div class="info-item"><strong>Chauffeur:</strong> ${data.driverName || 'Non renseigné'}</div>
            <div class="info-item"><strong>Véhicule:</strong> ${data.vehicleInfo || 'Non renseigné'}</div>
            <div class="info-item"><strong>Départ:</strong> ${data.startTime}</div>
            <div class="info-item"><strong>Fin prévue:</strong> ${data.endTime}</div>
        </div>
        
        <div class="info-section">
            <h3>📊 Résumé de la Tournée</h3>
            <div class="info-item"><strong>Arrêts:</strong> ${data.deliveryPoints.length}</div>
            <div class="info-item"><strong>Colis:</strong> ${totalPackages}</div>
            <div class="info-item"><strong>Distance:</strong> ${data.totalDistance} km</div>
            <div class="info-item"><strong>Temps total:</strong> ${data.totalTime}</div>
            <div class="info-item"><strong>Temps d'arrêt:</strong> ${data.settings.stopTimeMinutes} min/arrêt</div>
        </div>
    </div>
    
    <table class="route-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Heure</th>
                <th>Adresse</th>
                <th>Type</th>
                <th>Priorité</th>
                <th>Colis</th>
                <th>Distance</th>
                <th>✓</th>
            </tr>
        </thead>
        <tbody>
            ${data.deliveryPoints.map(point => `
                <tr class="${point.priority === 'premier' ? 'priority-premier' : point.priority === 'express_midi' ? 'priority-express' : ''}">
                    <td><strong>${point.order}</strong></td>
                    <td><strong>${point.estimatedTime || ''}</strong></td>
                    <td>
                        <div>${point.address.full_address}</div>
                        <div class="package-details">
                            ${point.packages.map(pkg => 
                                `📦 ${pkg.barcode || pkg.id} (${pkg.location}) ${pkg.notes ? '- ' + pkg.notes : ''}`
                            ).join('<br/>')}
                        </div>
                    </td>
                    <td>${point.packages[0]?.type === 'entreprise' ? '🏢' : '🏠'}</td>
                    <td>${point.priority === 'premier' ? '🔴 Premier' : point.priority === 'express_midi' ? '🟠 Express' : '⚪ Standard'}</td>
                    <td>${point.packages.length}</td>
                    <td>${(point.distance || 0).toFixed(1)} km</td>
                    <td style="width: 30px;">☐</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="summary">
        <h3>📈 Résumé Final</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="value">${data.deliveryPoints.length}</div>
                <div class="label">Arrêts</div>
            </div>
            <div class="summary-item">
                <div class="value">${totalPackages}</div>
                <div class="label">Colis</div>
            </div>
            <div class="summary-item">
                <div class="value">${data.totalDistance} km</div>
                <div class="label">Distance</div>
            </div>
            <div class="summary-item">
                <div class="value">${data.totalTime}</div>
                <div class="label">Temps Total</div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        📱 Généré par Tournée Facile - ${new Date().toLocaleString('fr-FR')}
        <br/>
        🏠 Dépôt: 10 rue du pré paillard, Annecy-le-Vieux
    </div>
</body>
</html>`;
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

  /**
   * Créer un résumé textuel simple
   */
  static generateTextSummary(data: RouteExportData): string {
    const totalPackages = data.deliveryPoints.reduce((sum, point) => sum + point.packages.length, 0);
    
    let summary = `📋 TOURNÉE DU ${data.tourDate}\n`;
    summary += `=================================\n\n`;
    summary += `⏰ Départ: ${data.startTime} - Fin prévue: ${data.endTime}\n`;
    summary += `📦 ${totalPackages} colis sur ${data.deliveryPoints.length} arrêts\n`;
    summary += `🛣️  Distance totale: ${data.totalDistance} km\n`;
    summary += `⏱️  Temps total: ${data.totalTime}\n\n`;
    
    summary += `🚚 ITINÉRAIRE:\n`;
    summary += `=============\n`;
    
    data.deliveryPoints.forEach((point) => {
      summary += `\n${point.order}. ${point.estimatedTime || ''} - ${point.address.full_address}\n`;
      summary += `   📍 ${(point.distance || 0).toFixed(1)} km`;
      if (point.priority !== 'standard') {
        summary += ` - 🔥 ${point.priority.toUpperCase()}`;
      }
      summary += `\n`;
      
      point.packages.forEach(pkg => {
        summary += `   📦 ${pkg.barcode || pkg.id} (${pkg.location})`;
        if (pkg.notes) summary += ` - ${pkg.notes}`;
        summary += `\n`;
      });
    });
    
    return summary;
  }
}