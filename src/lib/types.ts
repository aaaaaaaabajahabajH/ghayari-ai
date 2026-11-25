export type GarageProduct = {
  id: string;
  owner_id: string;
  sku: string;
  name: string;
  category: string;
  compatibility: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  product_id: string;
  movement_type: "in" | "out";
  quantity: number;
  reference: string;
  notes: string;
  created_at: string;
  product: { name: string; sku: string } | null;
};

export const productCategories = [
  "المحرك",
  "الفرامل",
  "التعليق",
  "الكهرباء",
  "السوائل",
  "أخرى",
] as const;
