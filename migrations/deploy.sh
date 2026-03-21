#!/bin/bash
# Database Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh development
#          ./deploy.sh production

set -e  # Exit on error

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to load environment configuration
load_environment() {
    local env=$1
    local config_file="$SCRIPT_DIR/config/${env}.env"
    
    if [ -f "$config_file" ]; then
        print_info "Loading configuration from $config_file"
        source "$config_file"
    else
        print_warning "Configuration file not found: $config_file"
        print_warning "Using default configuration"
        
        # Default configuration
        export DB_NAME="${DB_NAME:-inventory_management}"
        export DB_USER="${DB_USER:-postgres}"
        export DB_HOST="${DB_HOST:-localhost}"
        export DB_PORT="${DB_PORT:-5432}"
    fi
    
    print_info "Database: $DB_NAME@$DB_HOST:$DB_PORT (user: $DB_USER)"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump command not found. Please install PostgreSQL client."
        exit 1
    fi
    
    print_info "Prerequisites check passed"
}

# Function to test database connection
test_connection() {
    print_step "Testing database connection..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
        print_info "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database"
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    print_step "Checking if database exists..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        print_info "Database '$DB_NAME' already exists"
    else
        print_warning "Database '$DB_NAME' does not exist. Creating..."
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME"; then
            print_info "Database created successfully"
        else
            print_error "Failed to create database"
            exit 1
        fi
    fi
}

# Function to create backup
create_backup() {
    local env=$1
    local backup_dir="$SCRIPT_DIR/backups"
    local backup_file="$backup_dir/${env}_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    print_step "Creating backup..."
    
    # Check if database has any tables
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
    
    if [ "$table_count" -gt 0 ]; then
        if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file"; then
            print_info "Backup created: $backup_file"
            echo "$backup_file"
        else
            print_error "Backup failed"
            return 1
        fi
    else
        print_info "Database is empty, skipping backup"
        echo ""
    fi
}

# Function to initialize schema version tracking
init_schema_version() {
    print_step "Initializing schema version tracking..."
    
    local table_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='schema_version')")
    
    if [ "$table_exists" != "t" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/schema_version.sql"
        print_info "Schema version tracking initialized"
    else
        print_info "Schema version tracking already exists"
    fi
}

# Function to run migrations
run_migrations() {
    print_step "Running migrations..."
    
    bash "$SCRIPT_DIR/migrate.sh" all
}

# Function to load initial data
load_initial_data() {
    local env=$1
    
    print_step "Loading initial data..."
    
    # Only load sample data in development
    if [ "$env" = "development" ]; then
        if [ -f "$PROJECT_ROOT/sample_data.sql" ]; then
            print_info "Loading sample data..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_ROOT/sample_data.sql"
            print_info "Sample data loaded"
        fi
    else
        print_info "Skipping sample data for $env environment"
    fi
}

# Function to run validation
run_validation() {
    print_step "Running validation..."
    
    if [ -f "$PROJECT_ROOT/validate_schema.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$PROJECT_ROOT/validate_schema.sql"
        print_info "Validation completed"
    else
        print_warning "Validation script not found"
    fi
}

# Function to display deployment summary
show_summary() {
    local env=$1
    local backup_file=$2
    
    print_info "========================================="
    print_info "Deployment Summary"
    print_info "========================================="
    print_info "Environment: $env"
    print_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    
    local current_version=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
        "SELECT get_current_schema_version()")
    print_info "Schema Version: $current_version"
    
    if [ -n "$backup_file" ]; then
        print_info "Backup: $backup_file"
    fi
    
    print_info "========================================="
}

# Main deployment function
main() {
    local env=${1:-development}
    
    echo ""
    print_info "========================================="
    print_info "Database Deployment Tool"
    print_info "========================================="
    print_info "Environment: $env"
    echo ""
    
    # Validate environment
    case "$env" in
        development|staging|production)
            ;;
        *)
            print_error "Invalid environment: $env"
            echo "Usage: $0 [development|staging|production]"
            exit 1
            ;;
    esac
    
    # Production safety check
    if [ "$env" = "production" ]; then
        print_warning "You are about to deploy to PRODUCTION!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Load environment configuration
    load_environment "$env"
    
    # Run deployment steps
    check_prerequisites
    test_connection
    create_database
    
    # Create backup (if database has data)
    local backup_file=$(create_backup "$env")
    
    # Initialize and run migrations
    init_schema_version
    run_migrations
    
    # Load initial data (development only)
    load_initial_data "$env"
    
    # Run validation
    run_validation
    
    # Show summary
    echo ""
    show_summary "$env" "$backup_file"
    echo ""
    
    print_info "Deployment completed successfully!"
}

# Run main function
main "$@"
