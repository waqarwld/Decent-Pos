#!/bin/bash
# Database Migration Script
# Usage: ./migrate.sh [version|all]
# Example: ./migrate.sh v1.0.0
#          ./migrate.sh all

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

# Function to check if schema_version table exists
check_schema_version_table() {
    local table_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='schema_version')")
    
    if [ "$table_exists" != "t" ]; then
        print_warning "schema_version table does not exist. Creating it..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$MIGRATIONS_DIR")/schema_version.sql"
        print_info "schema_version table created successfully"
    fi
}

# Function to get current schema version
get_current_version() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT get_current_schema_version()"
}

# Function to check if version is already applied
is_version_applied() {
    local version=$1
    local count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM schema_version WHERE version='$version' AND status='applied'")
    [ "$count" -gt 0 ]
}

# Function to apply a migration
apply_migration() {
    local migration_file=$1
    local version=$(basename "$migration_file" | sed 's/_.*$//' | sed 's/^v//')
    
    print_info "Applying migration: $migration_file"
    
    # Check if already applied
    if is_version_applied "$version"; then
        print_warning "Migration $version is already applied. Skipping."
        return 0
    fi
    
    # Record start time
    local start_time=$(date +%s%3N)
    
    # Apply the migration
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        print_info "Migration $version applied successfully in ${execution_time}ms"
        return 0
    else
        print_error "Migration $version failed"
        return 1
    fi
}

# Function to list available migrations
list_migrations() {
    print_info "Available migrations:"
    for file in "$MIGRATIONS_DIR"/v*_*.sql; do
        if [[ ! "$file" =~ rollback ]]; then
            local version=$(basename "$file" | sed 's/_.*$//')
            local description=$(basename "$file" | sed 's/^v[0-9.]*_//' | sed 's/.sql$//' | tr '_' ' ')
            
            if is_version_applied "${version#v}"; then
                echo "  ✓ $version - $description (applied)"
            else
                echo "  ○ $version - $description (pending)"
            fi
        fi
    done
}

# Function to apply all pending migrations
apply_all_migrations() {
    print_info "Applying all pending migrations..."
    
    local applied_count=0
    local skipped_count=0
    
    for file in "$MIGRATIONS_DIR"/v*_*.sql; do
        if [[ ! "$file" =~ rollback ]]; then
            local version=$(basename "$file" | sed 's/_.*$//' | sed 's/^v//')
            
            if is_version_applied "$version"; then
                ((skipped_count++))
            else
                if apply_migration "$file"; then
                    ((applied_count++))
                else
                    print_error "Migration failed. Stopping."
                    exit 1
                fi
            fi
        fi
    done
    
    print_info "Migration complete: $applied_count applied, $skipped_count skipped"
}

# Main script
main() {
    print_info "Database Migration Tool"
    print_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    
    # Check database connection
    check_database
    
    # Ensure schema_version table exists
    check_schema_version_table
    
    # Get current version
    local current_version=$(get_current_version)
    print_info "Current schema version: $current_version"
    
    # Parse command
    if [ $# -eq 0 ]; then
        list_migrations
        echo ""
        echo "Usage: $0 [version|all|list]"
        echo "  version  - Apply specific version (e.g., v1.0.0)"
        echo "  all      - Apply all pending migrations"
        echo "  list     - List all available migrations"
        exit 0
    fi
    
    case "$1" in
        all)
            apply_all_migrations
            ;;
        list)
            list_migrations
            ;;
        v*)
            local version="${1#v}"
            local migration_file="$MIGRATIONS_DIR/v${version}_*.sql"
            
            # Find the migration file
            local found_file=$(ls $migration_file 2>/dev/null | grep -v rollback | head -n 1)
            
            if [ -z "$found_file" ]; then
                print_error "Migration file for version $1 not found"
                exit 1
            fi
            
            apply_migration "$found_file"
            ;;
        *)
            print_error "Invalid argument: $1"
            echo "Usage: $0 [version|all|list]"
            exit 1
            ;;
    esac
    
    # Show final version
    local final_version=$(get_current_version)
    print_info "Final schema version: $final_version"
}

main "$@"
