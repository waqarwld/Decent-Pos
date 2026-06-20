import { PaginatedResponse } from './product';
import { InventoryMovement } from './inventory';

export interface ProductStockSummary {
  product_id: number;
  sku: string;
  product_name: string;
  category_name: string;
  location_count: number;
  total_quantity_on_hand: number;
  total_quantity_available: number;
  total_inventory_value_cost: number;
}

export interface StockLevel {
  product_id: number;
  sku: string;
  product_name: string;
  category_name: string;
  location_id: number;
  location_code: string;
  location_name: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_movement_at?: string;
  inventory_value_cost: number;
}

export interface LowStockAlert {
  product_id: number;
  sku: string;
  product_name: string;
  location_code: string;
  quantity_available: number;
  reorder_point: number;
  units_below_reorder: number;
  stock_status: string;
  preferred_supplier?: string;
  lead_time_days?: number;
}

export interface ValuationRecord {
  product_id: number;
  location_id: number;
  quantity_on_hand: number;
  value: number;
  average_unit_cost: number;
}

export interface TurnoverItem {
  product_id: number;
  product_name: string;
  movement_count: number;
}

export interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  products_supplied: number;
  avg_delivery_days: number;
  on_time_rate: number;
  avg_quality: number;
}

export interface AgingRecord {
  product_id: number;
  sku: string;
  product_name: string;
  location_code: string;
  quantity_on_hand: number;
  days_in_stock: number;
  aging_bucket: string;
  inventory_value?: number;
}