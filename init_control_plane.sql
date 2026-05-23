-- ============================================================
-- MechanicApp SaaS Control Plane Schema
-- This database manages all tenant registrations, billing, and provisioning.
-- Run ONCE on the PostgreSQL server alongside mechanic_template.
-- ============================================================

BEGIN;

-- ============================================================
-- Control Plane Schema
-- ============================================================
CREATE SCHEMA IF NOT EXISTS control_plane;

-- ============================================================
-- Tenants registry
-- ============================================================
CREATE TABLE IF NOT EXISTS control_plane."Tenants"
(
    "Id" SERIAL PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Slug" TEXT NOT NULL UNIQUE,
    "Email" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'active'
        CHECK ("Status" IN ('active', 'demo', 'inactive', 'suspended', 'cancelled')),
    "DatabaseName" TEXT NOT NULL UNIQUE,
    "StripeCustomerId" TEXT,
    "StripeSubscriptionId" TEXT,
    "PlanName" TEXT NOT NULL DEFAULT 'trial',
    "MaxUsers" INTEGER NOT NULL DEFAULT 5,
    "IsDemo" BOOLEAN NOT NULL DEFAULT FALSE,
    "DemoExpiresAt" TIMESTAMP,
    "SubscriptionExpiresAt" TIMESTAMP,
    "Country" TEXT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON control_plane."Tenants"("Slug");
CREATE INDEX IF NOT EXISTS idx_tenants_email ON control_plane."Tenants"("Email");
CREATE INDEX IF NOT EXISTS idx_tenants_status ON control_plane."Tenants"("Status");
CREATE INDEX IF NOT EXISTS idx_tenants_demo_expires ON control_plane."Tenants"("DemoExpiresAt")
    WHERE "IsDemo" = TRUE;

-- ============================================================
-- Tenant Audit Log (tracks provisioning events)
-- ============================================================
CREATE TABLE IF NOT EXISTS control_plane."TenantAuditLog"
(
    "Id" SERIAL PRIMARY KEY,
    "TenantId" INTEGER REFERENCES control_plane."Tenants"("Id") ON DELETE CASCADE,
    "Action" TEXT NOT NULL,
    "Details" JSONB,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
