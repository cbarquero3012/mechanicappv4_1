-- ============================================================
-- DELETE ALL DATA from mechanic_db
-- Respects foreign key dependencies (children deleted first)
-- WARNING: This will remove ALL data. DO NOT execute in
--          production without a backup!
-- ============================================================

BEGIN;

    SET search_path
    TO mechanic_db;

-- ── Level 1: Junction / leaf tables (no other table depends on these) ──

DELETE FROM mechanic_db."PaymentRepairOrders";
DELETE FROM mechanic_db."RepairOrderPhotos";
DELETE FROM mechanic_db."RepairOrderServices";
DELETE FROM mechanic_db."RepairOrderParts";
DELETE FROM mechanic_db."RepairOrderProducts";

-- ── Level 2: Tables that are parents of Level 1 only ──

DELETE FROM mechanic_db."Payments";
DELETE FROM mechanic_db."RepairOrders";

-- ── Level 3: Tables referenced by RepairOrders / Payments ──

DELETE FROM mechanic_db."DetailsCars";
DELETE FROM mechanic_db."Mechanics";
DELETE FROM mechanic_db."Customers";
DELETE FROM mechanic_db."Services";
DELETE FROM mechanic_db."Parts";
DELETE FROM mechanic_db."Products";

/*-- ── Level 4: Catalog / reference tables ──

DELETE FROM mechanic_db."CarModels";
DELETE FROM mechanic_db."CarBrands";
DELETE FROM mechanic_db."Currencies";

-- ── Level 5: Auth, config and system tables ──

DELETE FROM mechanic_db."Users";
DELETE FROM mechanic_db."Subscriptions";
DELETE FROM mechanic_db."AppSettings";*/

-- ── Reset all SERIAL sequences back to 1 ──

SELECT setval(pg_get_serial_sequence('mechanic_db."PaymentRepairOrders"',  'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderPhotos"',    'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderServices"',  'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderParts"',     'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrderProducts"',  'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Payments"',             'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."RepairOrders"',         'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."DetailsCars"',          'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Mechanics"',            'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Customers"',            'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Services"',             'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Parts"',                'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Products"',             'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."CarModels"',            'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."CarBrands"',            'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Currencies"',           'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Users"',                'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."Subscriptions"',        'Id'), 1, false);
SELECT setval(pg_get_serial_sequence('mechanic_db."AppSettings"',          'Id'), 1, false);

COMMIT;