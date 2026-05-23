-- ============================================================
-- MechanicApp Template Database Setup
-- 
-- This script prepares the 'mechanic_template' database which
-- is cloned for each new tenant. It contains the full schema
-- plus shared reference data (CarBrands, CarModels, Currencies)
-- but NO business data (no customers, orders, etc.)
--
-- Usage:
--   1. CREATE DATABASE mechanic_template;
--   2. \c mechanic_template
--   3. \i init_template.sql
--   4. Mark as template: UPDATE pg_database SET datistemplate = true WHERE datname = 'mechanic_template';
-- ============================================================

BEGIN;

-- Use same schema as production
CREATE SCHEMA IF NOT EXISTS mechanic_db;
SET search_path TO mechanic_db;

-- ============================================================
-- Currencies reference table
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Currencies"
(
    "Id" SERIAL PRIMARY KEY,
    "Code" VARCHAR(3) NOT NULL UNIQUE,
    "Name" TEXT NOT NULL,
    "Symbol" VARCHAR(5) NOT NULL,
    "ExchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1.000000,
    "IsDefault" BOOLEAN DEFAULT FALSE,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CarBrands reference table
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."CarBrands"
(
    "Id" SERIAL PRIMARY KEY,
    "BrandName" TEXT NOT NULL UNIQUE,
    "Country" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CarModels table
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."CarModels"
(
    "Id" SERIAL PRIMARY KEY,
    "BrandId" INTEGER NOT NULL REFERENCES mechanic_db."CarBrands"("Id") ON DELETE CASCADE,
    "ModelName" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("BrandId", "ModelName")
);

-- ============================================================
-- Business Tables (empty for new tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_db."Parts"
(
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "PartNumber" TEXT,
    "Category" TEXT NOT NULL DEFAULT 'General',
    "Quantity" INTEGER NOT NULL DEFAULT 0,
    "MinStock" INTEGER NOT NULL DEFAULT 5,
    "UnitCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "SellPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Supplier" TEXT,
    "Location" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Products"
(
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "SKU" TEXT,
    "Category" TEXT NOT NULL DEFAULT 'General',
    "Description" TEXT,
    "Quantity" INTEGER NOT NULL DEFAULT 0,
    "MinStock" INTEGER NOT NULL DEFAULT 5,
    "UnitCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "SellPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Brand" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Services"
(
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Category" TEXT NOT NULL DEFAULT 'General',
    "Description" TEXT,
    "BasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "EstimatedHours" DECIMAL(4,2),
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Customers"
(
    "Id" SERIAL PRIMARY KEY,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT,
    "PhoneNumber" TEXT NOT NULL,
    "Address" TEXT,
    "IdClient" TEXT,
    "EconomicActivityCode" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."DetailsCars"
(
    "Id" SERIAL PRIMARY KEY,
    "CarModelId" INTEGER NOT NULL REFERENCES mechanic_db."CarModels"("Id") ON DELETE CASCADE,
    "CustomerId" INTEGER REFERENCES mechanic_db."Customers"("Id") ON DELETE SET NULL,
    "VIN" TEXT UNIQUE,
    "Fuel" TEXT NOT NULL DEFAULT 'Gasoline',
    "Year" INTEGER NOT NULL,
    "TypeCar" TEXT NOT NULL DEFAULT 'Sedan',
    "TransmissionType" TEXT NOT NULL DEFAULT 'Automatic',
    "LicensePlate" VARCHAR(20),
    "Mileage" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Mechanics"
(
    "Id" SERIAL PRIMARY KEY,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Specialty" TEXT,
    "HireDate" DATE,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrders"
(
    "Id" SERIAL PRIMARY KEY,
    "DetailCarId" INTEGER REFERENCES mechanic_db."DetailsCars"("Id") ON DELETE SET NULL,
    "MechanicId" INTEGER REFERENCES mechanic_db."Mechanics"("Id") ON DELETE SET NULL,
    "OrderDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" TEXT CHECK ("Status" IN ('Pending', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    "TotalCost" DECIMAL(10,2) DEFAULT 0,
    "Notes" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderServices"
(
    "Id" SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "ServiceId" INTEGER NOT NULL REFERENCES mechanic_db."Services"("Id") ON DELETE CASCADE,
    "Quantity" INTEGER NOT NULL DEFAULT 1,
    "UnitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Notes" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderParts"
(
    "Id" SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "PartId" INTEGER NOT NULL REFERENCES mechanic_db."Parts"("Id") ON DELETE CASCADE,
    "Quantity" INTEGER NOT NULL DEFAULT 1,
    "UnitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Notes" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderProducts"
(
    "Id" SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "ProductId" INTEGER NOT NULL REFERENCES mechanic_db."Products"("Id") ON DELETE CASCADE,
    "Quantity" INTEGER NOT NULL DEFAULT 1,
    "UnitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "Notes" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Payments"
(
    "Id" SERIAL PRIMARY KEY,
    "CustomerId" INTEGER REFERENCES mechanic_db."Customers"("Id") ON DELETE SET NULL,
    "Amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "PaymentMethod" TEXT NOT NULL CHECK ("PaymentMethod" IN ('Cash', 'Credit Card', 'Debit Card', 'Transfer', 'Check', 'Other')) DEFAULT 'Cash',
    "ReferenceNumber" TEXT,
    "PaymentDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Notes" TEXT,
    "CurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "OriginalAmount" DECIMAL(18,2),
    "OriginalCurrencyId" INTEGER REFERENCES mechanic_db."Currencies"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."PaymentRepairOrders"
(
    "Id" SERIAL PRIMARY KEY,
    "PaymentId" INTEGER NOT NULL REFERENCES mechanic_db."Payments"("Id") ON DELETE CASCADE,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "Amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE("PaymentId", "RepairOrderId")
);

CREATE TABLE IF NOT EXISTS mechanic_db."AppSettings"
(
    "Id" SERIAL PRIMARY KEY,
    "AppName" TEXT NOT NULL DEFAULT 'MechanicApp',
    "LogoUrl" TEXT DEFAULT '/assets/logo.svg',
    "FaviconUrl" TEXT DEFAULT '/assets/favicon.svg',
    "Address" TEXT,
    "Phone" TEXT,
    "WhatsAppPhone" TEXT,
    "Email" TEXT,
    "PhotoCleanupDays" INTEGER NOT NULL DEFAULT 0,
    "PhotoCleanupLastRun" TIMESTAMP,
    "PhotoCleanupLastUser" TEXT,
    "Timezone" TEXT NOT NULL DEFAULT 'UTC',
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Subscriptions"
(
    "Id" SERIAL PRIMARY KEY,
    "Email" TEXT NOT NULL,
    "StripeSessionId" TEXT,
    "StripeSubscriptionId" TEXT,
    "Status" TEXT NOT NULL DEFAULT 'active',
    "PlanName" TEXT DEFAULT 'Tenant',
    "StartDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    "StripePayload" JSONB,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."RepairOrderPhotos"
(
    "Id" SERIAL PRIMARY KEY,
    "RepairOrderId" INTEGER NOT NULL REFERENCES mechanic_db."RepairOrders"("Id") ON DELETE CASCADE,
    "FileName" TEXT NOT NULL,
    "FilePath" TEXT NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mechanic_db."Users"
(
    "Id" SERIAL PRIMARY KEY,
    "Username" TEXT NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    "FullName" TEXT NOT NULL DEFAULT '',
    "Email" TEXT NOT NULL DEFAULT '',
    "Role" TEXT NOT NULL DEFAULT 'mechanic',
    "Active" BOOLEAN NOT NULL DEFAULT TRUE,
    "MechanicId" INTEGER REFERENCES mechanic_db."Mechanics"("Id") ON DELETE SET NULL,
    "Country" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user for each new tenant (password: admin)
INSERT INTO mechanic_db."Users" ("Username", "PasswordHash", "FullName", "Email", "Role")
VALUES ('administrador', '$2a$11$FA8N6epiO9yDUGdZ91TD.epZp8XiJkjv.3IEV6C9a.XSN/pOS4VrW', 'Administrator', 'admin@mechanicapp.local', 'admin')
ON CONFLICT ("Username") DO NOTHING;

INSERT INTO mechanic_db."Users" ("Username", "PasswordHash", "FullName", "Email", "Role")
VALUES ('superuser', '$2a$11$rmcbiOPTla/NpdeMTtDK1.Ia9AuYhDDKe1nnJUrWjEmWCZ3FbWWsi', 'Super Administrator', 'superuser@local.com', 'super-admin')
ON CONFLICT ("Username") DO NOTHING;--superuser

-- Seed Currencies
INSERT INTO mechanic_db."Currencies" ("Code", "Name", "Symbol", "ExchangeRate", "IsDefault", "IsActive") VALUES
('CRC', 'Costa Rican Colón', '₡', 1.000000, TRUE, TRUE),
('USD', 'US Dollar', '$', 459.000000, FALSE, TRUE),
('EUR', 'Euro', '€', 503.000000, FALSE, TRUE)
ON CONFLICT ("Code") DO NOTHING;

-- Default active subscription for newly provisioned tenants
INSERT INTO mechanic_db."Subscriptions" ("Email", "Status", "PlanName", "StartDate", "ExpiresAt")
VALUES ('tenant@mechanicapp.local', 'active', 'Provisioned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Default AppSettings
INSERT INTO mechanic_db."AppSettings" ("AppName", "LogoUrl", "FaviconUrl")
VALUES ('Mechanic App', '/assets/logo.svg', '/assets/favicon.svg');

-- Seed CarBrands (same as init.sql)
INSERT INTO mechanic_db."CarBrands" ("BrandName", "Country") VALUES
('Toyota', 'Japan'), ('Honda', 'Japan'), ('Nissan', 'Japan'), ('Mazda', 'Japan'),
('Subaru', 'Japan'), ('Mitsubishi', 'Japan'), ('Suzuki', 'Japan'), ('Lexus', 'Japan'),
('Ford', 'USA'), ('Chevrolet', 'USA'), ('Dodge', 'USA'), ('Jeep', 'USA'),
('Ram', 'USA'), ('GMC', 'USA'), ('Tesla', 'USA'),
('BMW', 'Germany'), ('Mercedes-Benz', 'Germany'), ('Volkswagen', 'Germany'),
('Audi', 'Germany'), ('Porsche', 'Germany'),
('Hyundai', 'South Korea'), ('Kia', 'South Korea'),
('Fiat', 'Italy'), ('Land Rover', 'UK'), ('Jaguar', 'UK'),
('Peugeot', 'France'), ('Renault', 'France'),
('Volvo', 'Sweden'), ('BYD', 'China'), ('MG', 'China')
ON CONFLICT ("BrandName") DO NOTHING;

-- Seed CarModels
INSERT INTO mechanic_db."CarModels" ("BrandId", "ModelName")
SELECT b."Id", m."ModelName"
FROM (VALUES
('Toyota', 'Camry'), ('Toyota', 'Corolla'), ('Toyota', 'RAV4'),
('Honda', 'Civic'), ('Honda', 'CR-V'), ('Honda', 'Accord'),
('Nissan', 'Altima'), ('Nissan', 'Sentra'),
('Ford', 'F-150'), ('Ford', 'Mustang'), ('Ford', 'Explorer'),
('Chevrolet', 'Silverado'), ('Chevrolet', 'Equinox'),
('BMW', 'X5'), ('BMW', '330i'),
('Mercedes-Benz', 'C-Class'), ('Mercedes-Benz', 'GLE'),
('Volkswagen', 'Jetta'), ('Volkswagen', 'Tiguan'),
('Hyundai', 'Tucson'), ('Hyundai', 'Elantra'),
('Kia', 'Sportage'), ('Kia', 'Forte'),
('Tesla', 'Model 3'), ('Tesla', 'Model Y')
) AS m("BrandName", "ModelName")
JOIN mechanic_db."CarBrands" b ON b."BrandName" = m."BrandName"
ON CONFLICT ("BrandId", "ModelName") DO NOTHING;

COMMIT;
