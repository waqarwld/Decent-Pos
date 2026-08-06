export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}

export interface StockInfo {
  location_id: number;
  location_name: string;
  quantity: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price?: number;
  wholesale_price?: number;
  unit_of_measure?: string;
  category_id?: number;
  category?: Category;
  status?: string;
  stock?: StockInfo[];
  created_at: string;
  updated_at: string;
}

export interface ProductCreateRequest {
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: string;
  cost_price?: number;
  selling_price?: number;
  wholesale_price?: number;
  category_id?: number;
  status?: string;
  weight_kg?: number;
  initial_quantity?: number;
  initial_location_id?: number;
}

export interface ProductUpdateRequest {
  sku?: string;
  name?: string;
  description?: string;
  unit_of_measure?: string;
  cost_price?: number;
  selling_price?: number;
  wholesale_price?: number;
  category_id?: number;
  status?: string;
  weight_kg?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
