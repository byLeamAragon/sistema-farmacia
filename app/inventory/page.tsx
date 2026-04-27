'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { InventoryMovement, Product } from '@/lib/types'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [form, setForm] = useState({ product_id: '', movement_type: 'entry', quantity: '', reason: '' })
  const [message, setMessage] = useState('')

  const load = async () => {
    const [productResult, movementResult] = await Promise.all([
      supabase.from('products').select('*, units:unit_id(id,name), presentations:presentation_id(id,name)').order('name'),
      supabase.from('inventory_movements').select('*, products(name, stock_quantity)').order('created_at', { ascending: false }).limit(25),
    ])
    setProducts((productResult.data as Product[]) ?? [])
    setMovements((movementResult.data as InventoryMovement[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('register_inventory_movement', {
      p_product_id: Number(form.product_id),
      p_movement_type: form.movement_type,
      p_quantity: Number(form.quantity),
      p_reason: form.reason.trim() || null,
      p_user_id: userData.user?.id ?? null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setForm({ product_id: '', movement_type: 'entry', quantity: '', reason: '' })
    setMessage('Movimiento registrado y stock actualizado.')
    load()
  }

  return (
    <AppShell title="Entradas y salidas" subtitle="Registra compras, ajustes, vencimientos, perdidas y salidas internas.">
      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Producto</span>
            <select value={form.product_id} onChange={(event) => setForm({ ...form, product_id: event.target.value })} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seleccionar</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} - Stock {product.stock_quantity}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Movimiento</span>
            <select value={form.movement_type} onChange={(event) => setForm({ ...form, movement_type: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Cantidad</span>
            <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="md:col-span-4">
            <span className="text-sm font-medium text-slate-700">Razon</span>
            <input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Compra, producto vencido, ajuste por conteo..." />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Registrar movimiento</button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>

      <section className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Razon</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-b last:border-0">
                <td className="px-4 py-3">{new Date(movement.created_at).toLocaleString('es-NI')}</td>
                <td className="px-4 py-3 font-mono text-xs">{movement.movement_code ?? movement.id}</td>
                <td className="px-4 py-3 font-medium">{movement.products?.name}</td>
                <td className="px-4 py-3">{movement.movement_type}</td>
                <td className="px-4 py-3">{movement.quantity}</td>
                <td className="px-4 py-3">{movement.reason ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  )
}
