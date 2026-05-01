import type { Product } from '@/lib/types'

export function ProductTable({
  products,
  onEdit,
  onAddToSale,
  saleQuantities,
  onSaleQuantityChange,
}: {
  products: Product[]
  onEdit?: (product: Product) => void
  onAddToSale?: (product: Product, quantity?: number) => void
  saleQuantities?: Record<number, string>
  onSaleQuantityChange?: (productId: number, value: string) => void
}) {
  return (
    <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3">Codigo</th>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Presentacion</th>
            <th className="px-4 py-3">Ubicacion</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Min.</th>
            {onEdit || onAddToSale ? <th className="px-4 py-3"></th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{product.sku}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-slate-500">{product.dose || product.description}</p>
                {product.barcode ? <p className="text-xs text-slate-400">CB: {product.barcode}</p> : null}
              </td>
              <td className="px-4 py-3">C$ {Number(product.price).toFixed(2)}</td>
              <td className="px-4 py-3">{product.type}</td>
              <td className="px-4 py-3">{product.presentations?.name ?? '-'}</td>
              <td className="px-4 py-3">{product.location}</td>
              <td className="px-4 py-3">{product.stock_quantity}</td>
              <td className="px-4 py-3">{product.min_stock}</td>
              {onEdit || onAddToSale ? (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {onAddToSale ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={product.stock_quantity}
                          value={saleQuantities?.[product.id] ?? '1'}
                          onChange={(event) => onSaleQuantityChange?.(product.id, event.target.value)}
                          className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-center text-xs"
                        />
                        <button onClick={() => onAddToSale(product, Number(saleQuantities?.[product.id] ?? '1'))} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800">
                          Agregar
                        </button>
                      </div>
                    ) : null}
                    {onEdit ? (
                      <button onClick={() => onEdit(product)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-100">
                        Editar
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 ? <p className="p-5 text-sm text-slate-500">Todavia no hay productos registrados.</p> : null}
    </section>
  )
}
