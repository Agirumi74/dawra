import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Configuration de la base de données
const client = createClient({
  url: 'file:./tournee-facile.db',
});

export const db = drizzle(client, { schema });

// Types dérivés du schéma
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Depot = typeof schema.depots.$inferSelect;
export type NewDepot = typeof schema.depots.$inferInsert;
export type Vehicle = typeof schema.vehicles.$inferSelect;
export type NewVehicle = typeof schema.vehicles.$inferInsert;
export type VehicleLocation = typeof schema.vehicleLocations.$inferSelect;
export type NewVehicleLocation = typeof schema.vehicleLocations.$inferInsert;
export type Route = typeof schema.routes.$inferSelect;
export type NewRoute = typeof schema.routes.$inferInsert;
export type Address = typeof schema.addresses.$inferSelect;
export type NewAddress = typeof schema.addresses.$inferInsert;
export type Package = typeof schema.packages.$inferSelect;
export type NewPackage = typeof schema.packages.$inferInsert;
export type DeliveryPoint = typeof schema.deliveryPoints.$inferSelect;
export type NewDeliveryPoint = typeof schema.deliveryPoints.$inferInsert;
export type AddressNote = typeof schema.addressNotes.$inferSelect;
export type NewAddressNote = typeof schema.addressNotes.$inferInsert;
export type DeliveryHistory = typeof schema.deliveryHistory.$inferSelect;
export type NewDeliveryHistory = typeof schema.deliveryHistory.$inferInsert;
export type UserSession = typeof schema.userSessions.$inferSelect;
export type NewUserSession = typeof schema.userSessions.$inferInsert;
export type SystemSetting = typeof schema.systemSettings.$inferSelect;
export type NewSystemSetting = typeof schema.systemSettings.$inferInsert;

export { schema };