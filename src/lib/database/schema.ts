import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Table des utilisateurs
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role', { enum: ['admin', 'manager', 'driver'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  // Informations spécifiques au chauffeur
  licenseNumber: text('license_number'),
  phoneNumber: text('phone_number'),
  emergencyContact: text('emergency_contact'),
});

// Table des dépôts
export const depots = sqliteTable('depots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  country: text('country').default('France'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  openingHours: text('opening_hours'), // JSON string
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des véhicules
export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  licensePlate: text('license_plate').notNull().unique(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  fuelType: text('fuel_type', { enum: ['diesel', 'gasoline', 'electric', 'hybrid'] }),
  maxWeight: real('max_weight'), // en kg
  maxVolume: real('max_volume'), // en m³
  depotId: text('depot_id').references(() => depots.id),
  currentDriverId: text('current_driver_id').references(() => users.id),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastMaintenanceDate: text('last_maintenance_date'),
  nextMaintenanceDate: text('next_maintenance_date'),
  mileage: integer('mileage').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des emplacements dans les véhicules
export const vehicleLocations = sqliteTable('vehicle_locations', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3b82f6'),
  position: text('position'), // JSON: {x, y, z} pour position 3D
  maxWeight: real('max_weight'),
  maxVolume: real('max_volume'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des tournées
export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  driverId: text('driver_id').references(() => users.id),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  depotId: text('depot_id').references(() => depots.id),
  status: text('status', { 
    enum: ['planned', 'in_progress', 'completed', 'cancelled'] 
  }).default('planned'),
  plannedDate: text('planned_date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  totalDistance: real('total_distance'),
  totalDuration: integer('total_duration'), // en minutes
  optimizationMode: text('optimization_mode').default('simple'),
  constraints: text('constraints'), // JSON
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des adresses
export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey(),
  streetNumber: text('street_number'),
  streetName: text('street_name').notNull(),
  postalCode: text('postal_code').notNull(),
  city: text('city').notNull(),
  country: text('country').default('France'),
  fullAddress: text('full_address').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: text('verified_at'),
  deliveryInstructions: text('delivery_instructions'),
  accessCode: text('access_code'),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  businessHours: text('business_hours'), // JSON
  isBusinessAddress: integer('is_business_address', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des colis
export const packages = sqliteTable('packages', {
  id: text('id').primaryKey(),
  barcode: text('barcode'),
  trackingNumber: text('tracking_number'),
  routeId: text('route_id').references(() => routes.id),
  addressId: text('address_id').references(() => addresses.id),
  vehicleLocationId: text('vehicle_location_id').references(() => vehicleLocations.id),
  recipientName: text('recipient_name'),
  recipientPhone: text('recipient_phone'),
  weight: real('weight'),
  dimensions: text('dimensions'), // JSON: {length, width, height}
  value: real('value'),
  priority: text('priority', { 
    enum: ['standard', 'express_midi', 'premier', 'urgent'] 
  }).default('standard'),
  deliveryType: text('delivery_type', { 
    enum: ['particulier', 'entreprise'] 
  }).default('particulier'),
  status: text('status', { 
    enum: ['pending', 'in_transit', 'delivered', 'failed', 'returned'] 
  }).default('pending'),
  timeWindow: text('time_window'), // JSON: {start, end}
  specialInstructions: text('special_instructions'),
  photo: blob('photo'),
  signature: blob('signature'),
  deliveredAt: text('delivered_at'),
  deliveredBy: text('delivered_by').references(() => users.id),
  failureReason: text('failure_reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des points de livraison (groupement de colis par adresse)
export const deliveryPoints = sqliteTable('delivery_points', {
  id: text('id').primaryKey(),
  routeId: text('route_id').references(() => routes.id),
  addressId: text('address_id').references(() => addresses.id),
  orderIndex: integer('order_index').notNull(),
  status: text('status', { 
    enum: ['pending', 'completed', 'partial', 'failed'] 
  }).default('pending'),
  estimatedArrival: text('estimated_arrival'),
  actualArrival: text('actual_arrival'),
  departureTime: text('departure_time'),
  distanceFromPrevious: real('distance_from_previous'),
  durationFromPrevious: integer('duration_from_previous'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des notes d'adresses
export const addressNotes = sqliteTable('address_notes', {
  id: text('id').primaryKey(),
  addressId: text('address_id').references(() => addresses.id),
  authorId: text('author_id').references(() => users.id),
  content: text('content').notNull(),
  isGlobal: integer('is_global', { mode: 'boolean' }).default(true),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table de l'historique des livraisons
export const deliveryHistory = sqliteTable('delivery_history', {
  id: text('id').primaryKey(),
  packageId: text('package_id').references(() => packages.id),
  addressId: text('address_id').references(() => addresses.id),
  driverId: text('driver_id').references(() => users.id),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  status: text('status').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
  location: text('location'), // JSON: {lat, lng}
  notes: text('notes'),
  photo: blob('photo'),
  signature: blob('signature'),
});

// Table des sessions utilisateur
export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  deviceInfo: text('device_info'),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table des paramètres système
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  category: text('category'),
  isEditable: integer('is_editable', { mode: 'boolean' }).default(true),
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});