export interface Location {
  id: number;
  code: string;
  name: string;
  description?: string;
  location_type?: string;
  parent_location_id?: number;
  capacity?: number;
  is_active?: boolean;
}

export interface LocationCreateRequest {
  code: string;
  name: string;
  description?: string;
  location_type?: string;
  parent_location_id?: number;
  capacity?: number;
  is_active?: boolean;
}

export interface Product {
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  unit_of_measure: string;
  price?: number;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_info?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  payment_terms?: string;
  is_active?: boolean;
}

export interface SupplierCreateRequest {
  code: string;
  name: string;
  contact_info?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  payment_terms?: string;
  is_active?: boolean;
}

export interface InventoryMovement {
  id: number;
  type: 'receive' | 'ship' | 'transfer' | 'adjust';
  product_id: number;
  product_name: string;
  quantity: number;
  location_id?: number;
  source_location_id?: number;
  destination_location_id?: number;
  supplier_id?: number;
  reason?: string;
  created_at: string;
}

export interface ReceiveRequest {
  product_id: number;
  location_id: number;
  quantity: number;
  supplier_id: number;
}

export interface ShipRequest {
  product_id: number;
  location_id: number;
  quantity: number;
}

export interface TransferRequest {
  product_id: number;
  source_location_id: number;
  destination_location_id: number;
  quantity: number;
}

export interface AdjustRequest {
  product_id: number;
  location_id: number;
  quantity_delta: number;
  reason: string;
}

export interface OperationResult {
  success: boolean;
  message: string;
  movement_id?: number;
  new_stock_level?: number;
}
