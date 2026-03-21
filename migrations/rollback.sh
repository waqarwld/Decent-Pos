#!/bin/bash
# Database Rollback Script
# Usage: ./rollback.sh [version]
# Example: ./rollback.sh v1.0.0  (rollback to this version)
#          ./rollback.sh          (rollback last migration)

set -e  # Exit on error

# Configuration
DB_NAME="${DB_NAME:-inventory_management}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/versions"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if database exists
check_database() {
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_error "Database '$DB_NAME' does not exist"
        exit 1
    fi
}

# Function to get current schema version
get_current_version() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT get_current_schema_version()" 2>/dev/null || echo "0.0.0"
}

# Function to get last applied migration
get_last_migration() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT version FROM schema_version WHERE status='applied' ORDER BY applied_at DESC LIMIT 1"
}

# Function to create database backup
create_backup() {
    local backup_file="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Creating backup: $backup_file"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"; then
        print_info "Backup created successfully: $backup_file"
        echo "$backup_file"
    else
        print_error "Backup failed"
        return 1
    fi
}

# Function to rollback a specific version
rollback_version() {
    local version=$1
    local rollback_file="$MIGRATIONS_DIR/v${version}_rollback.sql"
    
    if [ ! -f "$rollback_file" ]; then
        print_error "Rollback script not found: $rollback_file"
        return 1
    fi
    
    print_warning "Rolling back version $version"
    print_warning "This will execute: $rollback_file"
    
    # Confirm rollback
    read -p "Are you sure you want to rollback? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Rollback cancelled"
        return 1
    fi
    
    # Create backup before rollback
    local backup_file=$(create_backup)
    if [ $? -ne 0 ]; then
        print_error "Cannot proceed without backup"
        return 1
    fi
    
    # Execute rollback
    print_info "Executing rollback..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$rollback_file"; then
        print_info "Rollback completed successfully"
        print_info "Backup saved as: $backup_file"
        return 0
    else
        print_error "Rollback failed"
        print_error "You can restore from backup: $backup_file"
        return 1
    fi
}

# Function to list applied migrations
list_applied_migrations() {
    print_info "Applied migrations (newest first):"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "SELECT version, description, applied_at, status FROM schema_version ORDER BY applied_at DESC LIMIT 10"
}

# Main script
main() {
    print_info "Database Rollback Tool"
    print_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    
    # Check database connection
    check_database
    
    # Get current version
    local current_version=$(get_current_version)
    print_info "Current schema version: $current_version"
    
    if [ "$current_version" = "0.0.0" ]; then
        print_warning "No migrations have been applied"
        exit 0
    fi
    
    # Parse command
    if [ $# -eq 0 ]; then
        # No argument - show options
        list_applied_migrations
        echo ""
        echo "Usage: $0 [version]"
        echo "  version  - Rollback specific version (e.g., v1.0.0)"
        echo "  (no arg) - Show this help and list applied migrations"
        echo ""
        echo "To rollback the last migration, use: $0 v$current_version"
        exit 0
    fi
    
    case "$1" in
        v*)
            local version="${1#v}"
            rollback_version "$version"
            ;;
        list)
            list_applied_migrations
            ;;
        *)
            print_error "Invalid argument: $1"
            echo "Usage: $0 [version|list]"
            exit 1
            ;;
    esac
    
    # Show final version
    local final_version=$(get_current_version)
    print_info "Final schema version: $final_version"
}

main "$@"
