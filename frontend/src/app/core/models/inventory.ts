export interface Location {
  id: number;
  name: string;
  description?: string;
}

export interface LocationCreateRequest {
  name: string;
  description?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_info?: string;
}

export interface SupplierCreateRequest {
  name: string;
  contact_info?: string;
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
