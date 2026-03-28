-- Migration: 001_add_max_retry_count_constraint
-- Description: Add max_retry_count constraint to jobs table
-- Date: 2026-03-28

ALTER TABLE jobs ADD CONSTRAINT max_retry_count CHECK (retry_count <= 3);
