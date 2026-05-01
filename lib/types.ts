export type CatalogItem = {
  id: number
  name: string
  created_at?: string
}

export type Product = {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  price: number
  cost: number | null
  type: string
  location: string
  description: string
  dose: string | null
  stock_quantity: number
  min_stock: number
  unit_id: number | null
  presentation_id: number | null
  units?: CatalogItem | null
  presentations?: CatalogItem | null
  created_at?: string
}

export type SaleSummary = {
  id: number
  sale_code: string | null
  total: number
  payment_method: string
  customer_name: string | null
  created_at: string
}

export type SaleItemSummary = {
  id: number
  sale_id?: number
  quantity: number
  unit_price: number
  subtotal?: number
  products?: Pick<Product, 'name'> | null
}

export type SaleWithItems = SaleSummary & {
  sale_items?: SaleItemSummary[]
}

export type InventoryMovement = {
  id: number
  movement_code: string | null
  product_id: number
  movement_type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  reason: string | null
  created_at: string
  products?: Pick<Product, 'name' | 'stock_quantity'> | null
}
