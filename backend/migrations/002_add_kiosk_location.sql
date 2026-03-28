-- Migration: 002_add_kiosk_location
-- Description: Add latitude and longitude columns to kiosks table for map feature
-- Date: 2026-03-28

-- Add latitude and longitude columns if they don't exist
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8);
ALTER TABLE kiosks ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_kiosks_location ON kiosks(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
