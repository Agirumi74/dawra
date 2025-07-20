-- Initialisation de la base de données avec des données de démonstration

-- Insertion des dépôts
INSERT INTO depots (id, name, address, city, postal_code, contact_phone, contact_email, latitude, longitude) VALUES
('depot-annecy', 'Dépôt Annecy Centre', '15 Avenue de la Gare', 'Annecy', '74000', '04.50.12.34.56', 'annecy@tournee.fr', 45.8992, 6.1294),
('depot-chambery', 'Dépôt Chambéry', '25 Rue de la République', 'Chambéry', '73000', '04.79.12.34.56', 'chambery@tournee.fr', 45.5646, 5.9178);

-- Insertion des utilisateurs (mots de passe hashés avec bcrypt)
INSERT INTO users (id, email, password, first_name, last_name, role, phone_number, license_number) VALUES
('admin-1', 'admin@tournee.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.vKzFm', 'Jean', 'Administrateur', 'admin', '06.12.34.56.78', NULL),
('manager-1', 'manager@tournee.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.vKzFm', 'Marie', 'Responsable', 'manager', '06.23.45.67.89', NULL),
('driver-1', 'chauffeur@tournee.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.vKzFm', 'Pierre', 'Chauffeur', 'driver', '06.34.56.78.90', 'B123456789');

-- Insertion des véhicules
INSERT INTO vehicles (id, license_plate, brand, model, year, fuel_type, max_weight, max_volume, depot_id, current_driver_id, mileage) VALUES
('vehicle-1', 'AB-123-CD', 'Renault', 'Master', 2022, 'diesel', 3500.0, 12.0, 'depot-annecy', 'driver-1', 45000),
('vehicle-2', 'EF-456-GH', 'Mercedes', 'Sprinter', 2021, 'diesel', 3000.0, 10.5, 'depot-annecy', NULL, 38000),
('vehicle-3', 'IJ-789-KL', 'Iveco', 'Daily', 2023, 'diesel', 4000.0, 15.0, 'depot-chambery', NULL, 12000);

-- Insertion des emplacements par défaut pour le véhicule 1
INSERT INTO vehicle_locations (id, vehicle_id, name, description, color, position, is_default) VALUES
('loc-1-1', 'vehicle-1', 'Avant Gauche', 'Emplacement avant gauche du véhicule', '#ef4444', '{"x":0,"y":0,"z":0}', 1),
('loc-1-2', 'vehicle-1', 'Avant Droite', 'Emplacement avant droite du véhicule', '#f97316', '{"x":1,"y":0,"z":0}', 1),
('loc-1-3', 'vehicle-1', 'Milieu Gauche', 'Emplacement milieu gauche du véhicule', '#eab308', '{"x":0,"y":1,"z":0}', 1),
('loc-1-4', 'vehicle-1', 'Milieu Droite', 'Emplacement milieu droite du véhicule', '#22c55e', '{"x":1,"y":1,"z":0}', 1),
('loc-1-5', 'vehicle-1', 'Arrière Gauche', 'Emplacement arrière gauche du véhicule', '#06b6d4', '{"x":0,"y":2,"z":0}', 1),
('loc-1-6', 'vehicle-1', 'Arrière Droite', 'Emplacement arrière droite du véhicule', '#8b5cf6', '{"x":1,"y":2,"z":0}', 1),
('loc-1-7', 'vehicle-1', 'Sol', 'Emplacement au sol du véhicule', '#64748b', '{"x":0.5,"y":1,"z":-1}', 1),
('loc-1-8', 'vehicle-1', 'Cabine', 'Emplacement dans la cabine', '#f59e0b', '{"x":0.5,"y":-0.5,"z":0}', 1);

-- Insertion des paramètres système
INSERT INTO system_settings (id, key, value, description, category, updated_by) VALUES
('setting-1', 'company_name', 'Tournée Facile SARL', 'Nom de l\'entreprise', 'general', 'admin-1'),
('setting-2', 'default_optimization_mode', 'simple', 'Mode d\'optimisation par défaut', 'routing', 'admin-1'),
('setting-3', 'max_packages_per_route', '200', 'Nombre maximum de colis par tournée', 'routing', 'admin-1'),
('setting-4', 'working_hours_start', '08:00', 'Heure de début de travail', 'general', 'admin-1'),
('setting-5', 'working_hours_end', '18:00', 'Heure de fin de travail', 'general', 'admin-1'),
('setting-6', 'break_duration', '60', 'Durée de pause en minutes', 'general', 'admin-1'),
('setting-7', 'fuel_cost_per_liter', '1.65', 'Coût du carburant par litre en euros', 'costs', 'admin-1'),
('setting-8', 'driver_hourly_rate', '15.50', 'Taux horaire chauffeur en euros', 'costs', 'admin-1');

-- Insertion d'adresses de test
INSERT INTO addresses (id, street_number, street_name, postal_code, city, full_address, latitude, longitude, is_verified, contact_name, contact_phone) VALUES
('addr-1', '12', 'Rue de la Paix', '74000', 'Annecy', '12 Rue de la Paix, 74000 Annecy', 45.8992, 6.1294, 1, 'Dupont Jean', '04.50.11.22.33'),
('addr-2', '45', 'Avenue de France', '74000', 'Annecy', '45 Avenue de France, 74000 Annecy', 45.9056, 6.1294, 1, 'Martin Marie', '04.50.22.33.44'),
('addr-3', '78', 'Boulevard du Fier', '74000', 'Annecy', '78 Boulevard du Fier, 74000 Annecy', 45.8928, 6.1350, 0, NULL, NULL);

-- Insertion de notes d'adresses
INSERT INTO address_notes (id, address_id, author_id, content, is_global) VALUES
('note-1', 'addr-1', 'driver-1', 'Code portail: 1234A - Sonner à l\'interphone', 1),
('note-2', 'addr-2', 'driver-1', 'Livraison uniquement le matin - Entreprise fermée l\'après-midi', 1),
('note-3', 'addr-3', 'driver-1', 'Attention: chien dans la cour', 1);