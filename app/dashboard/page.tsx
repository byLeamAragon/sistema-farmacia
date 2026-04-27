'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { Product, SaleSummary } from '@/lib/types'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<SaleSummary[]>([])

  useEffect(() => {
    supabase.from('products').select('*, units:unit_id(name), presentations:presentation_id(name)').order('name').then(({ data }) => setProducts((data as Product[]) ?? []))
    supabase.from('sales').select('id,sale_code,total,payment_method,customer_name,created_at').gte('created_at', new Date().toISOString().slice(0, 10)).order('created_at', { ascending: false }).then(({ data }) => setSales((data as SaleSummary[]) ?? []))
  }, [])

  const lowStock = useMemo(() => products.filter((product) => product.stock_quantity <= product.min_stock), [products])
  const todayTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0)

  return (
    <AppShell title="Panel principal" subtitle="Resumen operativo de inventario, ventas y alertas.">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Productos registrados" value={products.length.toString()} />
        <Metric label="Ventas de hoy" value={`C$ ${todayTotal.toFixed(2)}`} />
        <Metric label="Alertas de inventario" value={lowStock.length.toString()} tone={lowStock.length ? 'danger' : 'default'} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ['Registrar producto', '/products'],
          ['Consultar medicamento', '/search'],
          ['Registrar venta', '/sales'],
          ['Entrada o salida', '/inventory'],
          ['Ver alertas', '/alerts'],
          ['Reportes', '/reports'],
          ['Catalogos', '/catalogs'],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow">
            <span className="text-sm font-semibold text-emerald-800">{label}</span>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Productos proximos a agotarse</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="py-2">Producto</th>
                <th className="py-2">Stock</th>
                <th className="py-2">Minimo</th>
                <th className="py-2">Ubicacion</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.slice(0, 8).map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{product.name}</td>
                  <td className="py-3">{product.stock_quantity}</td>
                  <td className="py-3">{product.min_stock}</td>
                  <td className="py-3">{product.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lowStock.length === 0 ? <p className="py-4 text-sm text-slate-500">No hay alertas activas.</p> : null}
        </div>
      </section>
    </AppShell>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' }) {
  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${tone === 'danger' ? 'border-rose-200' : 'border-slate-200'}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone === 'danger' ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  )
}
