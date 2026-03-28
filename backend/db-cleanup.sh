#!/bin/bash
# LePrint Database Cleanup Script
# This script allows you to selectively clean up database tables.

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_USER=${DB_USER:-printuser}
DB_NAME=${DB_NAME:-printkiosk}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "------------------------------------------------"
echo "LePrint Database Cleanup Tool"
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo "------------------------------------------------"

# Function to execute SQL
execute_sql() {
    psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -p "$DB_PORT" -c "$1"
}

# Cleanup options
echo "Select parts to clean (y/n):"
read -p "1. Delete all Jobs? [y/N]: " clean_jobs
read -p "2. Delete all Kiosks? (Cascades to jobs) [y/N]: " clean_kiosks
read -p "3. Delete all non-admin Users? [y/N]: " clean_users
read -p "4. Delete all Admin Actions log? [y/N]: " clean_admin
read -p "5. Reset Kiosk Paper Counts to 500? [y/N]: " reset_paper

echo "------------------------------------------------"
echo "PLANNING EXECUTION..."

SQL_COMMANDS=""

if [[ "$clean_jobs" =~ ^[Yy]$ && ! "$clean_kiosks" =~ ^[Yy]$ ]]; then
    echo " -> Will clear 'jobs' table"
    SQL_COMMANDS+="TRUNCATE TABLE jobs CASCADE;"
fi

if [[ "$clean_kiosks" =~ ^[Yy]$ ]]; then
    echo " -> Will clear 'kiosks' table (and cascading jobs)"
    SQL_COMMANDS+="TRUNCATE TABLE kiosks CASCADE;"
fi

if [[ "$clean_users" =~ ^[Yy]$ ]]; then
    echo " -> Will delete non-admin users"
    SQL_COMMANDS+="DELETE FROM users WHERE role NOT IN ('admin', 'superadmin');"
fi

if [[ "$clean_admin" =~ ^[Yy]$ ]]; then
    echo " -> Will clear 'admin_actions' table"
    SQL_COMMANDS+="TRUNCATE TABLE admin_actions;"
fi

if [[ "$reset_paper" =~ ^[Yy]$ ]]; then
    echo " -> Will reset all kiosk paper counts to 500"
    SQL_COMMANDS+="UPDATE kiosks SET current_paper_count = 500;"
fi

if [ -z "$SQL_COMMANDS" ]; then
    echo "No actions selected. Exiting."
    exit 0
fi

echo "------------------------------------------------"
read -p "ARE YOU SURE? This action is irreversible. [y/N]: " confirm

if [[ "$confirm" =~ ^[Yy]$ ]]; then
    echo "Executing cleanup..."
    execute_sql "$SQL_COMMANDS"
    echo "✅ Database cleanup complete."
else
    echo "Aborted."
fi
