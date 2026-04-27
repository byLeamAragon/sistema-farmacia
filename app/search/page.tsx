'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { ProductTable } from '@/components/ProductTable'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'

type PendingSaleItem = {
  product_id: number
  name: string
  quantity: number
  unit_price: number
  stock_quantity: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searched, setSearched] = useState(false)
  const [message, setMessage] = useState('')

  const search = async (event: FormEvent) => {
    event.preventDefault()
    setSearched(true)
    const clean = query.trim().replace(/,/g, ' ')

    if (!clean) {
      setResults([])
      return
    }

    const { data } = await supabase
      .from('products')
      .select('*, units:unit_id(id,name), presentations:presentation_id(id,name)')
      .or(`name.ilike.%${clean}%,description.ilike.%${clean}%,dose.ilike.%${clean}%,type.ilike.%${clean}%,sku.ilike.%${clean}%,barcode.ilike.%${clean}%`)
      .order('name')

    setResults((data as Product[]) ?? [])
  }

  const addToSale = (product: Product) => {
    const stored = window.localStorage.getItem('farmacia_ocampo_sale_items')
    const currentItems: PendingSaleItem[] = stored ? JSON.parse(stored) : []
    const existing = currentItems.find((item) => item.product_id === product.id)
    const nextQuantity = (existing?.quantity ?? 0) + 1

    if (nextQuantity > product.stock_quantity) {
      setMessage(`Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}.`)
      return
    }

    const nextItems = existing
      ? currentItems.map((item) => item.product_id === product.id ? { ...item, quantity: nextQuantity } : item)
      : [
          ...currentItems,
          {
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: Number(product.price),
            stock_quantity: product.stock_quantity,
          },
        ]

    window.localStorage.setItem('farmacia_ocampo_sale_items', JSON.stringify(nextItems))
    setMessage(`${product.name} agregado a la venta.`)
  }

  return (
    <AppShell title="Consulta de medicamentos" subtitle="Busca por nombre, codigo, tipo, descripcion o dosis.">
      <form onSubmit={search} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. acetaminofen, jarabe, 500mg..." className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Buscar</button>
      </form>
      {message ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{message}</span>
          <Link href="/sales" className="rounded-md bg-emerald-700 px-4 py-2 text-center font-semibold text-white hover:bg-emerald-800">
            Ir a venta
          </Link>
        </div>
      ) : null}
      {searched && results.length === 0 ? <p className="mt-5 text-sm text-slate-500">No se encontraron productos con esa busqueda.</p> : null}
      {results.length > 0 ? <ProductTable products={results} onAddToSale={addToSale} /> : null}
    </AppShell>
  )
}
