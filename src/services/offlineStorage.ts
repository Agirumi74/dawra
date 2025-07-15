// Service de gestion du stockage hors-ligne avancé
export class OfflineStorageService {
  private dbName = 'TourneeFacileDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store pour les colis
        if (!db.objectStoreNames.contains('packages')) {
          const packageStore = db.createObjectStore('packages', { keyPath: 'id' });
          packageStore.createIndex('status', 'status', { unique: false });
          packageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Store pour les tournées
        if (!db.objectStoreNames.contains('routes')) {
          db.createObjectStore('routes', { keyPath: 'id' });
        }
        
        // Store pour les statistiques
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'date' });
        }
      };
    });
  }

  async savePackages(packages: any[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['packages'], 'readwrite');
    const store = transaction.objectStore('packages');
    
    // Vider le store existant
    await store.clear();
    
    // Ajouter tous les colis
    for (const pkg of packages) {
      await store.add(pkg);
    }
  }

  async loadPackages(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['packages'], 'readonly');
      const store = transaction.objectStore('packages');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveRoute(route: any[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['routes'], 'readwrite');
    const store = transaction.objectStore('routes');
    
    await store.put({
      id: 'current',
      route,
      createdAt: new Date()
    });
  }

  async loadRoute(): Promise<any[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['routes'], 'readonly');
      const store = transaction.objectStore('routes');
      const request = store.get('current');
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.route : []);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['packages', 'routes'], 'readwrite');
    
    await Promise.all([
      transaction.objectStore('packages').clear(),
      transaction.objectStore('routes').clear()
    ]);
  }

  async saveStats(stats: any): Promise<void> {
    if (!this.db) await this.initialize();
    
    const transaction = this.db!.transaction(['stats'], 'readwrite');
    const store = transaction.objectStore('stats');
    
    await store.put({
      date: new Date().toISOString().split('T')[0],
      ...stats
    });
  }
}

export const offlineStorage = new OfflineStorageService();