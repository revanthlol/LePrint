-- Migration: Add printer brand and driver columns to kiosks table
-- Run: psql -U printuser -d printkiosk -f backend/migrations/001_add_printer_brand.sql

ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS printer_brand VARCHAR(50);
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS printer_driver VARCHAR(100);

\echo '✅ Migration complete: printer_brand and printer_driver columns added to kiosks'
