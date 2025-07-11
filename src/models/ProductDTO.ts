export interface ProductDTO {
  id: number;
  name: string;
  variant_name: string;
  hex_code: string;
  reference: string;
  gender: string;
  category: string;
  subcategory: string | null;
  prompt_delivery: boolean;
  description: string | null;
  type: string | null;
  skus: SkuDTO[];
  companies: { key: number };
  brand: string;
}

interface SkuDTO {
  id: number;
  size: string;
  price: number;
  stock: number;
  open_grid: boolean;
  min_quantity: number;
}
