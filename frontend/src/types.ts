export interface User {
  id: number;
  name: string;
  email: string;
  role: "owner" | "operator" | "viewer";
  account_name: string;
  time_zone: string;
}
export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}
export interface Product {
  id: number;
  sku: string;
  name: string;
  location: string;
  on_hand: number;
  reorder_point: number;
  unit_cost_cents: number;
  supplier_id: number | null;
  supplier_name: string | null;
  low_stock: boolean;
}
export interface Movement {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  kind: "in" | "out";
  quantity: number;
  balance_after: number;
  reference: string;
  actor_name: string;
  created_at: string;
}
export interface Summary {
  products: number;
  units: number;
  low_stock: number;
  empty: number;
  inventory_value_cents: number;
  incoming_30d: number;
  outgoing_30d: number;
}
