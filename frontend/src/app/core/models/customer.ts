export type CustomerType = 'wholesale' | 'retail';

export interface Customer {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_type: CustomerType;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerRequest {
  code?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customer_type?: CustomerType;
  is_active?: boolean;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  returned_qty: number;
}

export interface Sale {
  id: number;
  sale_number: string;
  customer_id?: number;
  customer_name?: string;
  location_id: number;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  created_by: string;
  created_at: string;
  items?: SaleItem[];
}

export interface PurchaseHistory {
  customer_id: number;
  customer_name: string;
  sales: Sale[];
}

export interface CheckoutRequest {
  customer_id?: number;
  location_id: number;
  payment_method: string;
  items: { product_id: number; quantity: number }[];
}

export interface ReturnRecord {
  id: number;
  sale_id: number;
  sale_item_id: number;
  product_id: number;
  customer_id?: number;
  quantity: number;
  refund_amount: number;
  reason?: string;
  created_by: string;
  created_at: string;
}

export interface ReturnRequest {
  sale_item_id: number;
  quantity: number;
  reason?: string;
}