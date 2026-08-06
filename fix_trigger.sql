-- Fix update_stock_levels trigger to clamp initial stock to 0 instead of failing
-- on negative values (prevents sample_data_movements.sql from erroring out)

CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
DECLARE
    quantity_adjustment INTEGER;
BEGIN
    SELECT affects_quantity * NEW.quantity
    INTO quantity_adjustment
    FROM movement_types
    WHERE movement_type_id = NEW.movement_type_id;

    INSERT INTO stock_levels (product_id, location_id, quantity_on_hand, last_movement_at)
    VALUES (NEW.product_id, NEW.location_id, GREATEST(0, quantity_adjustment), NEW.created_at)
    ON CONFLICT (product_id, location_id)
    DO UPDATE SET
        quantity_on_hand = GREATEST(0, stock_levels.quantity_on_hand + quantity_adjustment),
        last_movement_at = NEW.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
