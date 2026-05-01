'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'

type CartItem = {
  product_id: number
  name: string
  quantity: number
  unit_price: number
  stock_quantity: number
}

const pendingSaleKey = 'farmacia_ocampo_sale_items'

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [customer, setCustomer] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [items, setItems] = useState<CartItem[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const deferredProductQuery = useDeferredValue(productQuery)

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*, units:unit_id(id,name), presentations:presentation_id(id,name)').gt('stock_quantity', 0).order('name')
    setProducts((data as Product[]) ?? [])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem(pendingSaleKey)
    if (!stored) return

    try {
      const pendingItems = JSON.parse(stored) as CartItem[]
      if (Array.isArray(pendingItems) && pendingItems.length > 0) {
        setItems(pendingItems)
        setMessage('Productos cargados desde consulta.')
      }
      window.localStorage.removeItem(pendingSaleKey)
    } catch {
      window.localStorage.removeItem(pendingSaleKey)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const clean = deferredProductQuery.trim().toLowerCase()
    if (!clean) return products

    return products.filter((product) => {
      const searchFields = [product.name, product.description, product.dose, product.type, product.sku, product.barcode]
      return searchFields.some((field) => field?.toLowerCase().includes(clean))
    })
  }, [deferredProductQuery, products])

  const displayedProducts = useMemo(() => {
    if (!productId) return filteredProducts

    const selectedProductId = Number(productId)
    const selectedProduct = products.find((product) => product.id === selectedProductId)
    const alreadyIncluded = filteredProducts.some((product) => product.id === selectedProductId)

    return selectedProduct && !alreadyIncluded ? [selectedProduct, ...filteredProducts] : filteredProducts
  }, [filteredProducts, productId, products])

  const quickMatches = useMemo(() => filteredProducts.slice(0, 6), [filteredProducts])
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items])

  const addItem = () => {
    const product = products.find((item) => item.id === Number(productId))
    const qty = Number(quantity)
    if (!product || qty <= 0) return

    const existing = items.find((item) => item.product_id === product.id)
    const nextQty = (existing?.quantity ?? 0) + qty
    if (nextQty > product.stock_quantity) {
      setMessage(`Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}.`)
      return
    }

    setMessage('')
    if (existing) {
      setItems(items.map((item) => item.product_id === product.id ? { ...item, quantity: nextQty } : item))
    } else {
      setItems([...items, { product_id: product.id, name: product.name, quantity: qty, unit_price: Number(product.price), stock_quantity: product.stock_quantity }])
    }
    setProductId('')
    setProductQuery('')
    setQuantity('1')
  }

  const selectProduct = (selectedProductId: number) => {
    setProductId(String(selectedProductId))
    setMessage('')
  }

  const updateItemQuantity = (productIdToUpdate: number, nextQuantity: number) => {
    const currentItem = items.find((item) => item.product_id === productIdToUpdate)
    if (!currentItem) return

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      setMessage('La cantidad debe ser al menos 1.')
      return
    }

    if (nextQuantity > currentItem.stock_quantity) {
      setMessage(`Stock insuficiente para ${currentItem.name}. Disponible: ${currentItem.stock_quantity}.`)
      return
    }

    setMessage('')
    setItems(items.map((item) => item.product_id === productIdToUpdate ? { ...item, quantity: nextQuantity } : item))
  }

  const handleItemQuantityInput = (productIdToUpdate: number, rawValue: string) => {
    if (rawValue.trim() === '') return
    updateItemQuantity(productIdToUpdate, Number(rawValue))
  }

  const registerSale = async () => {
    if (items.length === 0) return
    setSaving(true)
    setMessage('')

    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.rpc('register_sale', {
      p_customer_name: customer.trim() || null,
      p_payment_method: paymentMethod,
      p_user_id: userData.user?.id ?? null,
      p_items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })

    setSaving(false)
    if (error) {
      const schemaMessage = error.message.includes('does not exist')
        ? `${error.message}. Ejecuta el SQL actualizado en Supabase y recarga la pagina.`
        : error.message
      setMessage(schemaMessage)
      return
    }

    setItems([])
    setCustomer('')
    window.localStorage.removeItem(pendingSaleKey)
    setMessage('Venta registrada y stock actualizado.')
    loadProducts()
  }

  return (
    <AppShell title="Registrar venta" subtitle="Cada venta descuenta inventario automaticamente desde Supabase.">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Buscador rapido</span>
            <input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Busca por nombre, codigo, dosis o descripcion..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">
              {deferredProductQuery.trim() ? `${filteredProducts.length} resultado(s) encontrados.` : 'Escribe para filtrar la lista de medicamentos.'}
            </span>
          </label>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Coincidencias rapidas</span>
            <div className="mt-1 flex min-h-11 flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              {quickMatches.length > 0 ? (
                quickMatches.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      Number(productId) === product.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
                    }`}
                  >
                    {product.name}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-500">No hay coincidencias con esa busqueda.</span>
              )}
            </div>
          </div>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Producto</span>
            <select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seleccionar</option>
              {displayedProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name} - C$ {Number(product.price).toFixed(2)} - Stock {product.stock_quantity}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Cantidad</span>
            <input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={addItem} className="self-end rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Agregar</button>
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Cliente</span>
            <input value={customer} onChange={(event) => setCustomer(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Opcional" />
          </label>
          <label>
            <span className="text-sm font-medium text-slate-700">Pago</span>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Detalle de venta</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="py-2">Producto</th>
                <th className="py-2">Cantidad</th>
                <th className="py-2">Precio</th>
                <th className="py-2">Subtotal</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product_id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3">
                    <div className="flex w-fit items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock_quantity}
                        value={item.quantity}
                        onChange={(event) => handleItemQuantityInput(item.product_id, event.target.value)}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Disponible: {item.stock_quantity}</p>
                  </td>
                  <td className="py-3">C$ {item.unit_price.toFixed(2)}</td>
                  <td className="py-3">C$ {(item.unit_price * item.quantity).toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => setItems(items.filter((row) => row.product_id !== item.product_id))} className="text-sm font-medium text-rose-700">Quitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 ? <p className="py-4 text-sm text-slate-500">Agrega productos para registrar la venta.</p> : null}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-bold">Total: C$ {total.toFixed(2)}</p>
          <button disabled={saving || items.length === 0} onClick={registerSale} className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
            {saving ? 'Guardando...' : 'Registrar venta'}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>
    </AppShell>
  )
}
