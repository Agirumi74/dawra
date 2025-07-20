import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, type User, type NewUser } from '../database';
import { users, userSessions } from '../database/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Demo accounts for browser environment
const DEMO_ACCOUNTS = [
  {
    id: 'demo-admin-001',
    email: 'admin@tournee.fr',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'Système',
    role: 'admin' as const,
  },
  {
    id: 'demo-manager-001',
    email: 'manager@tournee.fr',
    password: 'manager123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'manager' as const,
  },
  {
    id: 'demo-driver-001',
    email: 'chauffeur@tournee.fr',
    password: 'chauffeur123',
    firstName: 'Pierre',
    lastName: 'Martin',
    role: 'driver' as const,
  },
];

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

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
  // Inscription d'un nouvel utilisateur
  static async register(data: RegisterData): Promise<AuthUser> {
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const newUser: NewUser = {
      id: crypto.randomUUID(),
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      licenseNumber: data.licenseNumber,
      phoneNumber: data.phoneNumber,
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();
    
    return {
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      role: createdUser.role,
    };
  }

  // Connexion
  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    // Browser environment - check demo accounts first
    if (isBrowser) {
      const demoUser = DEMO_ACCOUNTS.find(account => 
        account.email === credentials.email && account.password === credentials.password
      );

      if (demoUser) {
        // Create a token for demo user
        const token = jwt.sign(
          { userId: demoUser.id, email: demoUser.email, role: demoUser.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          user: {
            id: demoUser.id,
            email: demoUser.email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
          },
          token,
        };
      } else {
        throw new Error('Email ou mot de passe incorrect');
      }
    }

    // Server environment - use database
    const [user] = await db.select()
      .from(users)
      .where(and(
        eq(users.email, credentials.email),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Enregistrer la session
    await db.insert(userSessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
      deviceInfo: navigator.userAgent,
      ipAddress: 'unknown', // À implémenter côté serveur
    });

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
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Browser environment - check if it's a demo account
      if (isBrowser) {
        const demoUser = DEMO_ACCOUNTS.find(account => account.id === decoded.userId);
        if (demoUser) {
          return {
            id: demoUser.id,
            email: demoUser.email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
          };
        }
        return null;
      }

      // Server environment - verify against database
      // Vérifier que la session existe et n'est pas expirée
      const [session] = await db.select()
        .from(userSessions)
        .where(and(
          eq(userSessions.token, token),
          eq(userSessions.userId, decoded.userId)
        ))
        .limit(1);

      if (!session || new Date(session.expiresAt) < new Date()) {
        return null;
      }

      const [user] = await db.select()
        .from(users)
        .where(and(
          eq(users.id, decoded.userId),
          eq(users.isActive, true)
        ))
        .limit(1);

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
    } catch (error) {
      return null;
    }
  }

  // Déconnexion
  static async logout(token: string): Promise<void> {
    // In browser environment, just ignore logout for demo accounts
    if (isBrowser) {
      return;
    }

    // Server environment - remove session from database
    await db.delete(userSessions)
      .where(eq(userSessions.token, token));
  }

  // Changer le mot de passe
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('Ancien mot de passe incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    await db.update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId));
  }

  // Nettoyer les sessions expirées
  static async cleanExpiredSessions(): Promise<void> {
    await db.delete(userSessions)
      .where(eq(userSessions.expiresAt, new Date().toISOString()));
  }
}