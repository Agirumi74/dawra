const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Demo accounts for client-side authentication
const DEMO_USERS = [
  {
    id: 'admin-1',
    email: 'admin@tournee.fr',
    password: 'admin123',
    firstName: 'Jean',
    lastName: 'Administrateur',
    role: 'admin' as const,
  },
  {
    id: 'manager-1', 
    email: 'manager@tournee.fr',
    password: 'manager123',
    firstName: 'Marie',
    lastName: 'Responsable',
    role: 'manager' as const,
  },
  {
    id: 'driver-1',
    email: 'chauffeur@tournee.fr', 
    password: 'chauffeur123',
    firstName: 'Pierre',
    lastName: 'Chauffeur',
    role: 'driver' as const,
  },
];

// Fonction pour générer un token simple
function generateSimpleToken(userId: string): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2);
  return btoa(`${userId}:${timestamp}:${randomPart}`);
}

// Fonction pour décoder le token simple
function decodeSimpleToken(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    
    return {
      userId: parts[0],
      timestamp: parseInt(parts[1]),
    };
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'driver';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'driver';
  licenseNumber?: string;
  phoneNumber?: string;
}

export class AuthService {
  // Connexion avec validation client-side
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    // Chercher l'utilisateur dans les comptes de démonstration
    const user = DEMO_USERS.find(u => u.email === credentials.email);
    
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe (simple comparaison pour les comptes de demo)
    if (user.password !== credentials.password) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Créer un token simple
    const token = generateSimpleToken(user.id);

    // Stocker la session localement
    const sessionData = {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
      deviceInfo: navigator.userAgent,
    };
    
    localStorage.setItem(`session_${user.id}`, JSON.stringify(sessionData));

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  // Vérification du token
  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = decodeSimpleToken(token);
      if (!decoded) return null;
      
      // Vérifier que la session existe et n'est pas expirée
      const sessionData = localStorage.getItem(`session_${decoded.userId}`);
      if (!sessionData) {
        return null;
      }

      const session = JSON.parse(sessionData);
      if (session.token !== token || new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(`session_${decoded.userId}`);
        return null;
      }

      // Trouver l'utilisateur dans les comptes de démo
      const user = DEMO_USERS.find(u => u.id === decoded.userId);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    } catch {
      return null;
    }
  }

  // Déconnexion
  static async logout(token: string): Promise<void> {
    try {
      const decoded = decodeSimpleToken(token);
      if (decoded) {
        localStorage.removeItem(`session_${decoded.userId}`);
      }
    } catch {
      // Ignorer les erreurs de décodage lors de la déconnexion
    }
  }

  // Inscription (non implémentée pour les comptes de démo)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async register(data: RegisterData): Promise<AuthUser> {
    throw new Error('L\'inscription n\'est pas disponible pour les comptes de démonstration');
  }

  // Changer le mot de passe (non implémenté pour les comptes de démo)  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    throw new Error('Le changement de mot de passe n\'est pas disponible pour les comptes de démonstration');
  }

  // Nettoyer les sessions expirées
  static async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    DEMO_USERS.forEach(user => {
      const sessionData = localStorage.getItem(`session_${user.id}`);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (new Date(session.expiresAt) < now) {
            localStorage.removeItem(`session_${user.id}`);
          }
        } catch {
          localStorage.removeItem(`session_${user.id}`);
        }
      }
    });
  }
}