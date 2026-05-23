-- ============================================================
-- MechanicApp — Consolidated Database Setup Script
-- ============================================================
-- This single script creates the full schema, all tables,
-- seeds reference + sample data, resets sequences, and grants
-- permissions. Safe to run on a fresh database.
--
-- Consolidates:
--   init.sql, migration.sql, migrate_users.sql,
--   migrate_settings_photos.sql, migrate_roles.sql,
--   migrate_currency_fk.sql, migrate_cleanup_subscription.sql,
--   add_mechanic_id.sql, seed data
--
-- Dependency order is correct — tables are created before
-- any table that references them via FK.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS mechanic_db;
SET search_path TO mechanic_db;

-- ============================================================
-- 2. Currencies (referenced by many monetary tables)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Currencies"
(
    "Id"           SERIAL PRIMARY KEY,
    "Code"         VARCHAR(3) NOT NULL UNIQUE,
    "Name"         TEXT NOT NULL,
    "Symbol"       VARCHAR(5) NOT NULL,
    "ExchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1.000000,
    "IsDefault"    BOOLEAN DEFAULT FALSE,
    "IsActive"     BOOLEAN DEFAULT TRUE,
    "CreatedAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. CarBrands
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."CarBrands"
(
    "Id"        SERIAL PRIMARY KEY,
    "BrandName" TEXT NOT NULL UNIQUE,
    "Country"   TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. CarModels (FK → CarBrands)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."CarModels"
(
    "Id"        SERIAL PRIMARY KEY,
    "BrandId"   INTEGER NOT NULL REFERENCES mechanic_db."CarBrands"("Id") ON DELETE CASCADE,
    "ModelName" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("BrandId", "ModelName")
);

-- ============================================================
-- 5. Customers
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Customers"
(
    "Id"          SERIAL PRIMARY KEY,
    "FirstName"   TEXT NOT NULL,
    "LastName"    TEXT NOT NULL,
    "Email"       TEXT,
    "PhoneNumber" TEXT NOT NULL,
    "Address"     TEXT,
    "CreatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. Mechanics
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Mechanics"
(
    "Id"        SERIAL PRIMARY KEY,
    "FirstName" TEXT NOT NULL,
    "LastName"  TEXT NOT NULL,
    "Specialty" TEXT,
    "HireDate"  DATE,
    "IsActive"  BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. Parts (FK → Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Parts"
(
    "Id"         SERIAL PRIMARY KEY,
    "Name"       TEXT NOT NULL,
    "PartNumber" TEXT,
    "Category"   TEXT NOT NULL DEFAULT 'General',
    "Quantity"   INTEGER NOT NULL DEFAULT 0,
    "MinStock"   INTEGER NOT NULL DEFAULT 5,
    "UnitCost"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "SellPrice"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Supplier"   TEXT,
    "Location"   TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. Products (FK → Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Products"
(
    "Id"          SERIAL PRIMARY KEY,
    "Name"        TEXT NOT NULL,
    "SKU"         TEXT,
    "Category"    TEXT NOT NULL DEFAULT 'General',
    "Description" TEXT,
    "Quantity"    INTEGER NOT NULL DEFAULT 0,
    "MinStock"    INTEGER NOT NULL DEFAULT 5,
    "UnitCost"    DECIMAL(10,2) NOT NULL DEFAULT 0,
    "SellPrice"   DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Brand"       TEXT,
    "CurrencyId"  INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 9. Services (FK → Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Services"
(
    "Id"             SERIAL PRIMARY KEY,
    "Name"           TEXT NOT NULL,
    "Category"       TEXT NOT NULL DEFAULT 'General',
    "Description"    TEXT,
    "BasePrice"      DECIMAL(10,2) NOT NULL DEFAULT 0,
    "EstimatedHours" DECIMAL(4,2),
    "IsActive"       BOOLEAN DEFAULT TRUE,
    "CurrencyId"     INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. DetailsCars (FK → CarModels, Customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."DetailsCars"
(
    "Id"               SERIAL PRIMARY KEY,
    "CarModelId"       INTEGER NOT NULL REFERENCES mechanic_db."CarModels"("Id") ON DELETE CASCADE,
    "CustomerId"       INTEGER REFERENCES mechanic_db."Customers"("Id") ON DELETE SET NULL,
    "VIN"              TEXT UNIQUE,
    "Fuel"             TEXT NOT NULL DEFAULT 'Gasoline',
    "Year"             INTEGER NOT NULL,
    "TypeCar"          TEXT NOT NULL DEFAULT 'Sedan',
    "TransmissionType" TEXT NOT NULL DEFAULT 'Automatic',
    "CreatedAt"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. RepairOrders (FK → DetailsCars, Mechanics, Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrders"
(
    "Id"          SERIAL PRIMARY KEY,
    "DetailCarId" INTEGER REFERENCES mechanic_db."DetailsCars"("Id") ON DELETE SET NULL,
    "MechanicId"  INTEGER REFERENCES mechanic_db."Mechanics"("Id") ON DELETE SET NULL,
    "OrderDate"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status"      TEXT CHECK ("Status" IN ('Pending', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    "TotalCost"   DECIMAL(10,2) DEFAULT 0,
    "Notes"       TEXT,
    "CurrencyId"  INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. RepairOrderServices (FK → RepairOrders, Services, Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderServices"
(
    "Id"            SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "ServiceId"     INTEGER NOT NULL REFERENCES mechanic_db."Services"("Id") ON DELETE CASCADE,
    "Quantity"      INTEGER NOT NULL DEFAULT 1,
    "UnitPrice"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Notes"         TEXT,
    "CurrencyId"    INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 13. RepairOrderParts (FK → RepairOrders, Parts, Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderParts"
(
    "Id"            SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "PartId"        INTEGER NOT NULL REFERENCES mechanic_db."Parts"("Id") ON DELETE CASCADE,
    "Quantity"      INTEGER NOT NULL DEFAULT 1,
    "UnitPrice"     DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Notes"         TEXT,
    "CurrencyId"    INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. RepairOrderPhotos (FK → RepairOrders)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderPhotos"
(
    "Id"            SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "FileName"      TEXT NOT NULL,
    "FilePath"      TEXT NOT NULL,
    "Description"   TEXT,
    "CreatedAt"     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. Payments (FK → Customers, Currencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Payments"
(
    "Id"                 SERIAL PRIMARY KEY,
    "CustomerId"         INTEGER REFERENCES mechanic_db."Customers"("Id") ON DELETE SET NULL,
    "Amount"             DECIMAL(10,2) NOT NULL DEFAULT 0,
    "PaymentMethod"      TEXT NOT NULL CHECK ("PaymentMethod" IN ('Cash', 'Credit Card', 'Debit Card', 'Transfer', 'Check', 'Other')) DEFAULT 'Cash',
    "ReferenceNumber"    TEXT,
    "PaymentDate"        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Notes"              TEXT,
    "CurrencyId"         INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "OriginalAmount"     DECIMAL(18,2),
    "OriginalCurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt"          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 16. PaymentRepairOrders (FK → Payments, RepairOrders)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."PaymentRepairOrders"
(
    "Id"            SERIAL PRIMARY KEY,
    "PaymentId"     INTEGER NOT NULL REFERENCES mechanic_db."Payments"("Id") ON DELETE CASCADE,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "Amount"        DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE("PaymentId", "RepairOrderId")
);

-- ============================================================
-- 17. AppSettings (single-row branding / shop configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."AppSettings"
(
    "Id"                   SERIAL PRIMARY KEY,
    "AppName"              TEXT NOT NULL DEFAULT 'MechanicApp',
    "LogoUrl"              TEXT DEFAULT '/assets/logo.svg',
    "FaviconUrl"           TEXT DEFAULT '/assets/favicon.svg',
    "Address"              TEXT,
    "Phone"                TEXT,
    "WhatsAppPhone"        TEXT,
    "Email"                TEXT,
    "PhotoCleanupDays"     INTEGER NOT NULL DEFAULT 0,
    "PhotoCleanupLastRun"  TIMESTAMP,
    "PhotoCleanupLastUser" TEXT,
    "UpdatedAt"            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 18. Subscriptions (Stripe payment gateway)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Subscriptions"
(
    "Id"                    SERIAL PRIMARY KEY,
    "Email"                 TEXT NOT NULL,
    "StripeSessionId"       TEXT,
    "StripeSubscriptionId"  TEXT,
    "Status"                TEXT NOT NULL DEFAULT 'inactive',
    "PlanName"              TEXT,
    "StartDate"             TIMESTAMP,
    "ExpiresAt"             TIMESTAMP,
    "StripePayload"         JSONB,
    "CreatedAt"             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 19. Users (JWT authentication, FK → Mechanics)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Users"
(
    "Id"           SERIAL PRIMARY KEY,
    "Username"     TEXT NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    "FullName"     TEXT NOT NULL DEFAULT '',
    "Email"        TEXT NOT NULL DEFAULT '',
    "Role"         TEXT NOT NULL DEFAULT 'mechanic',
    "Active"       BOOLEAN NOT NULL DEFAULT TRUE,
    "MechanicId"   INTEGER REFERENCES mechanic_db."Mechanics"("Id") ON DELETE SET NULL,
    "CreatedAt"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ============================================================
--                    SEED DATA
-- ============================================================
-- ============================================================

-- ============================================================
-- Seed: Default admin user (password: admin)
-- ============================================================
INSERT INTO mechanic_db."Users" ("Username", "PasswordHash", "FullName", "Email", "Role")
VALUES ('administrador', '$2a$11$FA8N6epiO9yDUGdZ91TD.epZp8XiJkjv.3IEV6C9a.XSN/pOS4VrW', 'Administrator', 'admin@mechanicapp.local', 'admin')
ON CONFLICT ("Username") DO NOTHING;

-- ============================================================
-- Seed: Currencies (Colones default, Dollars, Euros)
-- ============================================================
INSERT INTO mechanic_db."Currencies" ("Code", "Name", "Symbol", "ExchangeRate", "IsDefault", "IsActive") VALUES
('CRC', 'Costa Rican Colón', '₡', 1.000000, TRUE, TRUE),
('USD', 'US Dollar', '$', 0.001927, FALSE, TRUE),
('EUR', 'Euro', '€', 0.001758, FALSE, TRUE)
ON CONFLICT ("Code") DO NOTHING;

-- ============================================================
-- Seed: CarBrands (72 brands worldwide)
-- ============================================================
INSERT INTO mechanic_db."CarBrands" ("BrandName", "Country") VALUES
('Toyota', 'Japan'), ('Honda', 'Japan'), ('Nissan', 'Japan'), ('Mazda', 'Japan'),
('Subaru', 'Japan'), ('Mitsubishi', 'Japan'), ('Suzuki', 'Japan'), ('Lexus', 'Japan'),
('Infiniti', 'Japan'), ('Acura', 'Japan'), ('Isuzu', 'Japan'), ('Daihatsu', 'Japan'),
('Ford', 'USA'), ('Chevrolet', 'USA'), ('Dodge', 'USA'), ('Jeep', 'USA'),
('Ram', 'USA'), ('GMC', 'USA'), ('Cadillac', 'USA'), ('Buick', 'USA'),
('Lincoln', 'USA'), ('Chrysler', 'USA'), ('Tesla', 'USA'), ('Rivian', 'USA'), ('Lucid', 'USA'),
('BMW', 'Germany'), ('Mercedes-Benz', 'Germany'), ('Volkswagen', 'Germany'),
('Audi', 'Germany'), ('Porsche', 'Germany'), ('Opel', 'Germany'), ('Smart', 'Germany'),
('Hyundai', 'South Korea'), ('Kia', 'South Korea'), ('Genesis', 'South Korea'), ('SsangYong', 'South Korea'),
('Fiat', 'Italy'), ('Alfa Romeo', 'Italy'), ('Ferrari', 'Italy'), ('Lamborghini', 'Italy'),
('Maserati', 'Italy'), ('Pagani', 'Italy'),
('Land Rover', 'UK'), ('Jaguar', 'UK'), ('Mini', 'UK'), ('Bentley', 'UK'),
('Rolls-Royce', 'UK'), ('Aston Martin', 'UK'), ('McLaren', 'UK'), ('Lotus', 'UK'),
('Peugeot', 'France'), ('Renault', 'France'), ('Citroën', 'France'),
('DS Automobiles', 'France'), ('Bugatti', 'France'),
('Volvo', 'Sweden'), ('Koenigsegg', 'Sweden'), ('Polestar', 'Sweden'),
('Škoda', 'Czech Republic'), ('Dacia', 'Romania'),
('SEAT', 'Spain'), ('CUPRA', 'Spain'),
('BYD', 'China'), ('Geely', 'China'), ('Chery', 'China'), ('NIO', 'China'),
('XPeng', 'China'), ('Li Auto', 'China'), ('Great Wall', 'China'), ('MG', 'China'),
('Tata', 'India'), ('Mahindra', 'India'),
('Proton', 'Malaysia'), ('Perodua', 'Malaysia')
ON CONFLICT ("BrandName") DO NOTHING;

-- ============================================================
-- Seed: CarModels (~100 models linked to brands)
-- ============================================================
INSERT INTO mechanic_db."CarModels" ("BrandId", "ModelName")
SELECT b."Id", m."ModelName"
FROM (VALUES
('Toyota', 'Camry'), ('Toyota', 'Corolla'), ('Toyota', 'RAV4'),
('Honda', 'Civic'), ('Honda', 'CR-V'), ('Honda', 'Accord'),
('Nissan', 'Altima'), ('Nissan', 'Sentra'), ('Nissan', 'Rogue'),
('Mazda', 'CX-5'), ('Mazda', 'Mazda3'),
('Subaru', 'Outback'), ('Subaru', 'Forester'),
('Mitsubishi', 'Outlander'), ('Mitsubishi', 'Eclipse Cross'),
('Suzuki', 'Vitara'), ('Lexus', 'RX 350'), ('Lexus', 'ES 350'),
('Infiniti', 'QX60'), ('Acura', 'MDX'),
('Isuzu', 'D-Max'), ('Daihatsu', 'Terios'),
('Ford', 'F-150'), ('Ford', 'Mustang'), ('Ford', 'Explorer'),
('Chevrolet', 'Silverado'), ('Chevrolet', 'Camaro'), ('Chevrolet', 'Equinox'),
('Dodge', 'Charger'), ('Dodge', 'Durango'),
('Jeep', 'Wrangler'), ('Jeep', 'Grand Cherokee'),
('Ram', '1500'), ('GMC', 'Sierra'),
('Cadillac', 'Escalade'), ('Buick', 'Enclave'),
('Lincoln', 'Navigator'), ('Chrysler', 'Pacifica'),
('Tesla', 'Model 3'), ('Tesla', 'Model Y'),
('Rivian', 'R1T'), ('Lucid', 'Air'),
('BMW', 'X5'), ('BMW', '330i'), ('BMW', 'X3'),
('Mercedes-Benz', 'C-Class'), ('Mercedes-Benz', 'GLE'), ('Mercedes-Benz', 'E-Class'),
('Volkswagen', 'Jetta'), ('Volkswagen', 'Tiguan'), ('Volkswagen', 'Golf'),
('Audi', 'Q5'), ('Audi', 'A4'),
('Porsche', 'Cayenne'), ('Porsche', '911'),
('Opel', 'Corsa'), ('Smart', 'ForTwo'),
('Hyundai', 'Tucson'), ('Hyundai', 'Elantra'), ('Hyundai', 'Santa Fe'),
('Kia', 'Sportage'), ('Kia', 'Forte'), ('Kia', 'Sorento'),
('Genesis', 'GV70'), ('SsangYong', 'Tivoli'),
('Fiat', '500'), ('Fiat', 'Pulse'),
('Alfa Romeo', 'Giulia'), ('Ferrari', '296 GTB'),
('Lamborghini', 'Huracan'), ('Maserati', 'Ghibli'), ('Pagani', 'Huayra'),
('Land Rover', 'Defender'), ('Land Rover', 'Range Rover'),
('Jaguar', 'F-Pace'), ('Mini', 'Cooper'),
('Bentley', 'Bentayga'), ('Rolls-Royce', 'Ghost'),
('Aston Martin', 'DB12'), ('McLaren', '720S'), ('Lotus', 'Emira'),
('Peugeot', '208'), ('Peugeot', '3008'),
('Renault', 'Duster'), ('Renault', 'Koleos'),
('Citroen', 'C3'), ('DS Automobiles', 'DS 7'), ('Bugatti', 'Chiron'),
('Volvo', 'XC60'), ('Volvo', 'XC90'),
('Koenigsegg', 'Jesko'), ('Polestar', 'Polestar 2'),
('Skoda', 'Octavia'), ('Dacia', 'Sandero'),
('SEAT', 'Leon'), ('CUPRA', 'Formentor'),
('BYD', 'Atto 3'), ('Geely', 'Coolray'), ('Chery', 'Tiggo 7 Pro'),
('NIO', 'ET5'), ('XPeng', 'P7'), ('Li Auto', 'L9'),
('Great Wall', 'Haval H6'), ('MG', 'ZS EV'),
('Tata', 'Nexon'), ('Mahindra', 'XUV700'),
('Proton', 'X50'), ('Perodua', 'Ativa')
) AS m("BrandName", "ModelName")
JOIN mechanic_db."CarBrands" b ON b."BrandName" = m."BrandName"
ON CONFLICT ("BrandId", "ModelName") DO NOTHING;

-- ============================================================
-- Seed: Customers (10 sample customers)
-- ============================================================
/*INSERT INTO mechanic_db."Customers" ("FirstName", "LastName", "Email", "PhoneNumber", "Address") VALUES
('Carlos', 'Garcia', 'carlos.garcia@mail.com', '555-0101', 'Calle Principal 123'),
('Maria', 'Lopez', 'maria.lopez@mail.com', '555-0102', 'Av. Reforma 456'),
('Juan', 'Perez', 'juan.perez@mail.com', '555-0103', 'Blvd. Norte 789'),
('Ana', 'Martinez', 'ana.martinez@mail.com', '555-0104', 'Col. Centro 321'),
('Pedro', 'Sanchez', 'pedro.sanchez@mail.com', '555-0105', 'Calle Sur 654'),
('Laura', 'Rodriguez', 'laura.rodriguez@mail.com', '555-0106', 'Av. Juarez 987'),
('Roberto', 'Hernandez', 'roberto.h@mail.com', '555-0107', 'Calle Oriente 147'),
('Sofia', 'Ramirez', 'sofia.ramirez@mail.com', '555-0108', 'Blvd. Poniente 258'),
('Diego', 'Torres', 'diego.torres@mail.com', '555-0109', 'Col. Industrial 369'),
('Valentina', 'Flores', 'valentina.f@mail.com', '555-0110', 'Av. Universidad 741')
ON CONFLICT DO NOTHING;*/

-- ============================================================
-- Seed: Mechanics (8 mechanics)
-- ============================================================
/*INSERT INTO mechanic_db."Mechanics" ("FirstName", "LastName", "Specialty", "HireDate", "IsActive") VALUES
('Miguel', 'Santos', 'Engine Repair', '2020-03-15', TRUE),
('Jose', 'Rivera', 'Brakes & Suspension', '2019-07-01', TRUE),
('Fernando', 'Vargas', 'Electrical Systems', '2021-01-10', TRUE),
('Andres', 'Morales', 'Transmission', '2018-11-20', TRUE),
('Ricardo', 'Castillo', 'Body & Paint', '2022-05-05', TRUE),
('Luis', 'Mendez', 'A/C & Heating', '2023-02-14', TRUE),
('Oscar', 'Delgado', 'General Mechanic', '2017-09-01', FALSE),
('Javier', 'Rojas', 'Diagnostics', '2024-01-08', TRUE)
ON CONFLICT DO NOTHING;*/

-- ============================================================
-- Seed: DetailsCars (20 vehicles linked to models + customers)
-- ============================================================
/*INSERT INTO mechanic_db."DetailsCars" ("CarModelId", "CustomerId", "VIN", "Fuel", "Year", "TypeCar", "TransmissionType") VALUES
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Toyota' AND cm."ModelName"='Camry'), 1, 'JTD12345678901001', 'Gasoline', 2024, 'Sedan', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Toyota' AND cm."ModelName"='Corolla'), 2, 'JTD12345678901002', 'Gasoline', 2023, 'Sedan', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Toyota' AND cm."ModelName"='RAV4'), 3, 'JTD12345678901003', 'Hybrid', 2025, 'SUV', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Honda' AND cm."ModelName"='Civic'), 4, 'HND12345678901001', 'Gasoline', 2024, 'Sedan', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Honda' AND cm."ModelName"='CR-V'), 5, 'HND12345678901002', 'Gasoline', 2023, 'SUV', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Honda' AND cm."ModelName"='Accord'), 6, 'HND12345678901003', 'Hybrid', 2025, 'Sedan', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Nissan' AND cm."ModelName"='Altima'), 7, 'NSN12345678901001', 'Gasoline', 2024, 'Sedan', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Nissan' AND cm."ModelName"='Sentra'), 8, 'NSN12345678901002', 'Gasoline', 2023, 'Sedan', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Nissan' AND cm."ModelName"='Rogue'), 9, 'NSN12345678901003', 'Gasoline', 2025, 'SUV', 'CVT'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Ford' AND cm."ModelName"='F-150'), 10, 'FRD12345678901001', 'Gasoline', 2025, 'Truck', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Ford' AND cm."ModelName"='Mustang'), 1, 'FRD12345678901002', 'Gasoline', 2024, 'Coupe', 'Manual'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Chevrolet' AND cm."ModelName"='Silverado'), 2, 'CHV12345678901001', 'Diesel', 2025, 'Truck', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Tesla' AND cm."ModelName"='Model 3'), 3, 'TSL12345678901001', 'Electric', 2025, 'Sedan', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Tesla' AND cm."ModelName"='Model Y'), 4, 'TSL12345678901002', 'Electric', 2024, 'SUV', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='BMW' AND cm."ModelName"='X5'), 5, 'BMW12345678901001', 'Gasoline', 2025, 'SUV', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Mercedes-Benz' AND cm."ModelName"='C-Class'), 6, 'MBZ12345678901001', 'Gasoline', 2025, 'Sedan', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Volkswagen' AND cm."ModelName"='Jetta'), 7, 'VWG12345678901001', 'Gasoline', 2024, 'Sedan', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Audi' AND cm."ModelName"='Q5'), 8, 'AUD12345678901001', 'Gasoline', 2025, 'SUV', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Hyundai' AND cm."ModelName"='Tucson'), 9, 'HYN12345678901001', 'Hybrid', 2025, 'SUV', 'Automatic'),
((SELECT cm."Id" FROM mechanic_db."CarModels" cm JOIN mechanic_db."CarBrands" cb ON cm."BrandId"=cb."Id" WHERE cb."BrandName"='Kia' AND cm."ModelName"='Sportage'), 10, 'KIA12345678901001', 'Gasoline', 2025, 'SUV', 'Automatic')
ON CONFLICT ("VIN") DO NOTHING;*/

-- ============================================================
-- Seed: Parts (12 inventory parts)
-- ============================================================
/*INSERT INTO mechanic_db."Parts" ("Name", "PartNumber", "Category", "Quantity", "MinStock", "UnitCost", "SellPrice", "Supplier", "Location") VALUES
('Oil Filter', 'PRT-OF-001', 'Filters', 50, 10, 3.50, 8.99, 'AutoParts Inc.', 'A-1'),
('Air Filter', 'PRT-AF-002', 'Filters', 35, 8, 5.00, 12.99, 'AutoParts Inc.', 'A-2'),
('Brake Pad Set (Front)', 'PRT-BP-003', 'Brakes', 20, 5, 18.00, 45.00, 'BrakeMaster', 'B-1'),
('Brake Pad Set (Rear)', 'PRT-BP-004', 'Brakes', 18, 5, 16.00, 40.00, 'BrakeMaster', 'B-2'),
('Spark Plug (4-pack)', 'PRT-SP-005', 'Ignition', 40, 10, 8.00, 22.00, 'SparkTech', 'C-1'),
('Battery 12V 60Ah', 'PRT-BT-006', 'Electrical', 12, 3, 55.00, 120.00, 'PowerCell', 'D-1'),
('Serpentine Belt', 'PRT-SB-007', 'Belts', 15, 4, 12.00, 30.00, 'BeltPro', 'C-2'),
('Coolant 1 Gallon', 'PRT-CL-008', 'Fluids', 25, 8, 7.00, 18.00, 'FluidMax', 'E-1'),
('Transmission Fluid 1Qt', 'PRT-TF-009', 'Fluids', 30, 10, 5.50, 14.00, 'FluidMax', 'E-2'),
('Wiper Blades (Pair)', 'PRT-WB-010', 'Accessories', 22, 6, 6.00, 16.00, 'ClearView', 'F-1'),
('Alternator', 'PRT-AL-011', 'Electrical', 5, 2, 85.00, 180.00, 'PowerCell', 'D-2'),
('Radiator Hose', 'PRT-RH-012', 'Cooling', 10, 3, 9.00, 24.00, 'CoolSys', 'E-3')
ON CONFLICT DO NOTHING;*/

-- ============================================================
-- Seed: Products (8 products)
-- ============================================================
/*INSERT INTO mechanic_db."Products" ("Name", "SKU", "Category", "Description", "Quantity", "MinStock", "UnitCost", "SellPrice", "Brand") VALUES
('Synthetic Motor Oil 5W-30 (5Qt)', 'PRD-MO-001', 'Oils', 'Full synthetic motor oil, 5-quart jug', 40, 10, 18.00, 38.00, 'Mobil 1'),
('Conventional Motor Oil 10W-40 (5Qt)', 'PRD-MO-002', 'Oils', 'Conventional motor oil, 5-quart jug', 30, 10, 12.00, 26.00, 'Castrol'),
('Brake Fluid DOT 4 (12oz)', 'PRD-BF-003', 'Fluids', 'High-performance brake fluid', 20, 5, 4.50, 12.00, 'Bosch'),
('Power Steering Fluid (12oz)', 'PRD-PS-004', 'Fluids', 'Universal power steering fluid', 15, 5, 3.80, 10.00, 'Prestone'),
('Fuel Injector Cleaner', 'PRD-FI-005', 'Additives', 'Cleans fuel injectors for better performance', 25, 8, 3.00, 8.50, 'STP'),
('Engine Degreaser 15oz', 'PRD-ED-006', 'Cleaning', 'Heavy-duty engine degreaser spray', 18, 5, 4.00, 10.00, 'Gunk'),
('Car Wash Shampoo 1Gal', 'PRD-CW-007', 'Cleaning', 'pH-balanced car wash shampoo', 12, 4, 6.00, 15.00, 'Meguiars'),
('Tire Shine Spray', 'PRD-TS-008', 'Detailing', 'Long-lasting tire shine', 20, 6, 3.50, 9.00, 'Armor All')
ON CONFLICT DO NOTHING;*/

-- ============================================================
-- Seed: Services (15 services)
-- ============================================================
/*INSERT INTO mechanic_db."Services" ("Name", "Category", "Description", "BasePrice", "EstimatedHours", "IsActive") VALUES
('Oil Change', 'Maintenance', 'Standard oil and filter change', 45.00, 0.5, TRUE),
('Brake Inspection', 'Brakes', 'Visual and functional brake system check', 30.00, 0.5, TRUE),
('Brake Pad Replacement', 'Brakes', 'Replace front or rear brake pads', 120.00, 1.5, TRUE),
('Tire Rotation', 'Tires', 'Rotate all four tires', 35.00, 0.5, TRUE),
('Wheel Alignment', 'Tires', 'Four-wheel alignment', 80.00, 1.0, TRUE),
('Engine Diagnostics', 'Diagnostics', 'OBD-II scan and diagnosis', 60.00, 1.0, TRUE),
('Battery Replacement', 'Electrical', 'Remove old battery and install new one', 40.00, 0.5, TRUE),
('Coolant Flush', 'Cooling', 'Drain and refill cooling system', 90.00, 1.0, TRUE),
('Transmission Service', 'Transmission', 'Fluid change and filter replacement', 150.00, 2.0, TRUE),
('A/C Recharge', 'A/C', 'Evacuate and recharge A/C system', 110.00, 1.5, TRUE),
('Spark Plug Replacement', 'Ignition', 'Replace all spark plugs', 80.00, 1.0, TRUE),
('Full Detail', 'Detailing', 'Complete interior and exterior detail', 200.00, 4.0, TRUE),
('Pre-Purchase Inspection', 'Diagnostics', 'Complete vehicle inspection for buyers', 100.00, 1.5, TRUE),
('Serpentine Belt Replacement', 'Belts', 'Replace serpentine/drive belt', 70.00, 1.0, TRUE),
('Headlight Restoration', 'Body', 'Restore cloudy headlight lenses', 50.00, 1.0, FALSE)
ON CONFLICT DO NOTHING;*/

-- ============================================================
-- Seed: RepairOrders (10 orders)
-- ============================================================
/*INSERT INTO mechanic_db."RepairOrders" ("DetailCarId", "MechanicId", "Status", "TotalCost", "Notes") VALUES
(1, 1, 'Completed', 83.00, 'Oil change and tire rotation completed'),
(2, 2, 'Completed', 165.00, 'Front brake pad replacement'),
(3, 3, 'In Progress', 60.00, 'Running engine diagnostics, check engine light'),
(4, 1, 'Pending', 0.00, 'Scheduled for oil change and brake inspection'),
(5, 4, 'In Progress', 150.00, 'Transmission fluid service in progress'),
(6, 6, 'Pending', 110.00, 'A/C not blowing cold, scheduled recharge'),
(7, 3, 'Completed', 160.00, 'Battery replacement and electrical diagnosis'),
(8, 5, 'Cancelled', 0.00, 'Customer cancelled appointment'),
(9, 1, 'Completed', 170.00, 'Coolant flush and serpentine belt replacement'),
(10, 2, 'In Progress', 80.00, 'Wheel alignment service');*/

-- ============================================================
-- Seed: RepairOrderServices (link services to orders)
-- ============================================================
/*INSERT INTO mechanic_db."RepairOrderServices" ("RepairOrderId", "ServiceId", "Quantity", "UnitPrice") VALUES
-- Order 1: Oil Change + Tire Rotation
(1, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Oil Change'), 1, 45.00),
(1, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Tire Rotation'), 1, 35.00),
-- Order 2: Brake Pad Replacement + Brake Inspection
(2, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Brake Pad Replacement'), 1, 120.00),
(2, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Brake Inspection'), 1, 30.00),
-- Order 3: Engine Diagnostics
(3, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Engine Diagnostics'), 1, 60.00),
-- Order 5: Transmission Service
(5, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Transmission Service'), 1, 150.00),
-- Order 6: A/C Recharge
(6, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='A/C Recharge'), 1, 110.00),
-- Order 7: Battery Replacement + Engine Diagnostics
(7, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Battery Replacement'), 1, 40.00),
(7, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Engine Diagnostics'), 1, 60.00),
-- Order 9: Coolant Flush + Serpentine Belt Replacement
(9, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Coolant Flush'), 1, 90.00),
(9, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Serpentine Belt Replacement'), 1, 70.00),
-- Order 10: Wheel Alignment
(10, (SELECT "Id" FROM mechanic_db."Services" WHERE "Name"='Wheel Alignment'), 1, 80.00);*/

-- ============================================================
-- Seed: RepairOrderParts (link parts to orders)
-- ============================================================
/*INSERT INTO mechanic_db."RepairOrderParts" ("RepairOrderId", "PartId", "Quantity", "UnitPrice") VALUES
-- Order 1: Oil filter
(1, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-OF-001'), 1, 8.99),
-- Order 2: Front brake pads
(2, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-BP-003'), 1, 45.00),
-- Order 5: Transmission fluid
(5, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-TF-009'), 4, 14.00),
-- Order 7: Battery
(7, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-BT-006'), 1, 120.00),
-- Order 9: Coolant + Serpentine belt
(9, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-CL-008'), 2, 18.00),
(9, (SELECT "Id" FROM mechanic_db."Parts" WHERE "PartNumber"='PRT-SB-007'), 1, 30.00);*/

-- ============================================================
-- Seed: Payments (6 payments)
-- ============================================================
/*INSERT INTO mechanic_db."Payments" ("CustomerId", "Amount", "PaymentMethod", "ReferenceNumber", "Notes") VALUES
(1, 83.00, 'Cash', NULL, 'Paid in full'),
(2, 100.00, 'Credit Card', 'CC-20250115-001', 'Partial payment'),
(2, 65.00, 'Credit Card', 'CC-20250116-002', 'Remaining balance'),
(7, 160.00, 'Transfer', 'TRF-20250120-001', 'Bank transfer payment'),
(9, 170.00, 'Debit Card', 'DC-20250122-001', 'Paid in full'),
(10, 40.00, 'Cash', NULL, 'Partial payment - alignment in progress');*/

-- ============================================================
-- Seed: PaymentRepairOrders (link payments to orders)
-- ============================================================
/*INSERT INTO mechanic_db."PaymentRepairOrders" ("PaymentId", "RepairOrderId", "Amount") VALUES
(1, 1, 83.00),
(2, 2, 100.00),
(3, 2, 65.00),
(4, 7, 160.00),
(5, 9, 170.00),
(6, 10, 40.00);*/

-- ============================================================
-- Seed: AppSettings (single row defaults)
-- ============================================================
INSERT INTO mechanic_db."AppSettings" ("AppName", "LogoUrl", "FaviconUrl")
VALUES ('Mechanic App', '/assets/logo.svg', '/assets/favicon.svg')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Default trial subscription
-- ============================================================
INSERT INTO mechanic_db."Subscriptions" ("Email", "Status", "PlanName", "ExpiresAt")
SELECT 'admin@mechanicapp.local', 'active', 'Trial', (CURRENT_TIMESTAMP + INTERVAL '30 days')
WHERE NOT EXISTS (SELECT 1 FROM mechanic_db."Subscriptions");

-- ============================================================
-- ============================================================
--              RESET SEQUENCES AFTER SEEDING
-- ============================================================
-- ============================================================
SELECT setval(pg_get_serial_sequence('mechanic_db."Currencies"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Currencies") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."CarBrands"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."CarBrands") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."CarModels"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."CarModels") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Customers"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Customers") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Mechanics"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Mechanics") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."DetailsCars"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."DetailsCars") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Parts"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Parts") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Products"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Products") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Services"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Services") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrders"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."RepairOrders") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderServices"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."RepairOrderServices") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderParts"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."RepairOrderParts") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderPhotos"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."RepairOrderPhotos") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Payments"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Payments") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."PaymentRepairOrders"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."PaymentRepairOrders") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."AppSettings"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."AppSettings") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Subscriptions"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Subscriptions") + 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Users"', 'Id'),
    (SELECT COALESCE(MAX("Id"), 0) FROM mechanic_db."Users") + 1, false);

-- ============================================================
-- GRANTS (full access for postgres user)
-- ============================================================
ALTER USER postgres WITH SUPERUSER CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
GRANT ALL PRIVILEGES ON DATABASE mechanic_db TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA mechanic_db TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA mechanic_db TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA mechanic_db TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA mechanic_db
GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA mechanic_db
GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;

COMMIT;
