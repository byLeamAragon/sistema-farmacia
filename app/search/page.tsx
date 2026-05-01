'use client'

import { FormEvent, useDeferredValue, useEffect, useRef, useState } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [saleQuantities, setSaleQuantities] = useState<Record<number, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const runSearch = async (rawQuery: string) => {
    const clean = rawQuery.trim().replace(/,/g, ' ')
    if (!clean) {
      setResults([])
      setSearched(false)
      return []
    }

    setLoading(true)
    setSearched(true)

    const exactBarcodeQuery = clean.replace(/\s+/g, '')
    const { data: exactMatches } = await supabase
      .from('products')
      .select('*, units:unit_id(id,name), presentations:presentation_id(id,name)')
      .or(`barcode.eq.${exactBarcodeQuery},sku.eq.${exactBarcodeQuery}`)
      .limit(5)

    if ((exactMatches as Product[] | null)?.length) {
      const exactResults = exactMatches as Product[]
      setResults(exactResults)
      setLoading(false)
      return exactResults
    }

    const { data } = await supabase
      .from('products')
      .select('*, units:unit_id(id,name), presentations:presentation_id(id,name)')
      .or(`name.ilike.%${clean}%,description.ilike.%${clean}%,dose.ilike.%${clean}%,type.ilike.%${clean}%,sku.ilike.%${clean}%,barcode.ilike.%${clean}%`)
      .order('name')
      .limit(30)

    const nextResults = (data as Product[]) ?? []
    setResults(nextResults)
    setLoading(false)
    return nextResults
  }

  useEffect(() => {
    const clean = deferredQuery.trim()
    if (!clean) {
      setResults([])
      setSearched(false)
      return
    }

    const timeout = window.setTimeout(() => {
      runSearch(clean)
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [deferredQuery])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    const found = await runSearch(query)
    const clean = query.trim().replace(/\s+/g, '')
    const exactMatch = found.find((product) => product.barcode === clean || product.sku === clean)

    if (exactMatch) {
      addToSale(exactMatch, Number(saleQuantities[exactMatch.id] ?? '1'))
      setQuery('')
      inputRef.current?.focus()
    }
  }

  const updateSaleQuantity = (productId: number, value: string) => {
    if (value === '') {
      setSaleQuantities((current) => ({ ...current, [productId]: '' }))
      return
    }

    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue < 1) return

    setSaleQuantities((current) => ({ ...current, [productId]: String(Math.floor(numericValue)) }))
  }

  const addToSale = (product: Product, requestedQuantity = 1) => {
    const stored = window.localStorage.getItem('farmacia_ocampo_sale_items')
    const currentItems: PendingSaleItem[] = stored ? JSON.parse(stored) : []
    const existing = currentItems.find((item) => item.product_id === product.id)
    const quantityToAdd = Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? Math.floor(requestedQuantity) : 1
    const nextQuantity = (existing?.quantity ?? 0) + quantityToAdd

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
            quantity: quantityToAdd,
            unit_price: Number(product.price),
            stock_quantity: product.stock_quantity,
          },
        ]

    window.localStorage.setItem('farmacia_ocampo_sale_items', JSON.stringify(nextItems))
    setSaleQuantities((current) => ({ ...current, [product.id]: '1' }))
    setMessage(`${product.name} agregado a la venta.`)
    inputRef.current?.focus()
  }

  return (
    <AppShell title="Consulta de medicamentos" subtitle="Busca por nombre, codigo, codigo de barras, tipo, descripcion o dosis.">
      <form onSubmit={search} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. acetaminofen, jarabe, 500mg o escanea el codigo de barras..."
          className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Buscar</button>
      </form>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Si tienes lector de codigo de barras conectado, escanea en el buscador y presiona `Enter`.
        Si el codigo coincide exactamente, el producto se agrega rapido a la venta.
      </div>
      {message ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{message}</span>
          <Link href="/sales" className="rounded-md bg-emerald-700 px-4 py-2 text-center font-semibold text-white hover:bg-emerald-800">
            Ir a venta
          </Link>
        </div>
      ) : null}
      {loading ? <p className="mt-5 text-sm text-slate-500">Buscando medicamentos...</p> : null}
      {searched && results.length === 0 ? <p className="mt-5 text-sm text-slate-500">No se encontraron productos con esa busqueda.</p> : null}
      {results.length > 0 ? <ProductTable products={results} onAddToSale={addToSale} saleQuantities={saleQuantities} onSaleQuantityChange={updateSaleQuantity} /> : null}
    </AppShell>
  )
}
