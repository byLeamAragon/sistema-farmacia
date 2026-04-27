'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    supabase.from('products').select('*, units:unit_id(id,name), presentations:presentation_id(id,name)').order('stock_quantity').then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  const alerts = useMemo(() => products.filter((product) => product.stock_quantity <= product.min_stock), [products])

  return (
    <AppShell title="Alertas de inventario" subtitle="Productos cuyo stock actual esta en el minimo o por debajo.">
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Stock minimo</th>
              <th className="px-4 py-3">Faltante sugerido</th>
              <th className="px-4 py-3">Ubicacion</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((product) => (
              <tr key={product.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-rose-700">{product.stock_quantity}</td>
                <td className="px-4 py-3">{product.min_stock}</td>
                <td className="px-4 py-3">{Math.max(product.min_stock - product.stock_quantity, 0)}</td>
                <td className="px-4 py-3">{product.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 ? <p className="p-5 text-sm text-slate-500">No hay productos proximos a agotarse.</p> : null}
      </section>
    </AppShell>
  )
}
