-- Schema Version Tracking Table
-- This table tracks all applied migrations and their status

CREATE TABLE IF NOT EXISTS schema_version (
    version_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    script_name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100) DEFAULT CURRENT_USER,
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'rolled_back', 'failed')),
    rollback_script VARCHAR(255),
    notes TEXT
);

-- Index for quick version lookups
CREATE INDEX IF NOT EXISTS idx_schema_version_version ON schema_version(version);
CREATE INDEX IF NOT EXISTS idx_schema_version_status ON schema_version(status);
CREATE INDEX IF NOT EXISTS idx_schema_version_applied_at ON schema_version(applied_at);

-- Function to get current schema version
CREATE OR REPLACE FUNCTION get_current_schema_version()
RETURNS VARCHAR(20) AS $
DECLARE
    current_version VARCHAR(20);
BEGIN
    SELECT version INTO current_version
    FROM schema_version
    WHERE status = 'applied'
    ORDER BY applied_at DESC
    LIMIT 1;
    
    RETURN COALESCE(current_version, '0.0.0');
END;
$ LANGUAGE plpgsql;

-- Function to record migration
CREATE OR REPLACE FUNCTION record_migration(
    p_version VARCHAR(20),
    p_description TEXT,
    p_script_name VARCHAR(255),
    p_execution_time_ms INTEGER,
    p_checksum VARCHAR(64),
    p_rollback_script VARCHAR(255)
)
RETURNS VOID AS $
BEGIN
    INSERT INTO schema_version (
        version, 
        description, 
        script_name, 
        execution_time_ms, 
        checksum, 
        rollback_script,
        status
    ) VALUES (
        p_version,
        p_description,
        p_script_name,
        p_execution_time_ms,
        p_checksum,
        p_rollback_script,
        'applied'
    );
END;
$ LANGUAGE plpgsql;

-- Function to record rollback
CREATE OR REPLACE FUNCTION record_rollback(
    p_version VARCHAR(20),
    p_notes TEXT
)
RETURNS VOID AS $
BEGIN
    UPDATE schema_version
    SET status = 'rolled_back',
        notes = p_notes
    WHERE version = p_version;
END;
$ LANGUAGE plpgsql;

-- View to show migration history
CREATE OR REPLACE VIEW migration_history AS
SELECT 
    version,
    description,
    script_name,
    applied_at,
    applied_by,
    execution_time_ms,
    status,
    rollback_script
FROM schema_version
ORDER BY applied_at DESC;

COMMENT ON TABLE schema_version IS 'Tracks all database schema migrations and their status';
COMMENT ON FUNCTION get_current_schema_version() IS 'Returns the current applied schema version';
COMMENT ON FUNCTION record_migration(VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR, VARCHAR) IS 'Records a successful migration application';
COMMENT ON FUNCTION record_rollback(VARCHAR, TEXT) IS 'Records a migration rollback';
