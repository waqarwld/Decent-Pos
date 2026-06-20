import { Product } from './product';

export interface TransactionItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  items: TransactionItem[];
  total: number;
}
