import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { cartTotals } from '../utils/pricing.js'
import { PRODUCTS as SEED_PRODUCTS } from '../data/products.js'
import { supabase, supabaseEnabled, syncToSupabase } from '../lib/supabase.js'

// The store keeps all state in React memory and, when Supabase credentials
// are configured (see src/lib/supabase.js), mirrors orders and products to
// the database: writes are optimistic (UI updates instantly, then syncs),
// reads happen once on startup. Without credentials everything still works,
// nothing persists — the cart is always in-memory either way.

const StoreContext = createContext(null)

let itemSeq = 1
let productSeq = 1

const productToRow = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  size: p.size ?? null,
  tag: p.tag ?? null,
  image: p.image ?? null,
})

const rowToProduct = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  size: r.size ?? '',
  tag: r.tag ?? null,
  image: r.image ?? '',
})

const orderToRow = (o) => ({
  id: o.id,
  placed_at: o.placedAt,
  status: o.status,
  shipping: o.shipping,
  items: o.items,
  totals: o.totals,
})

const rowToOrder = (r) => ({
  id: r.id,
  placedAt: r.placed_at,
  status: r.status,
  shipping: r.shipping,
  items: r.items,
  totals: r.totals,
})

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item } = action
      // Premade products merge into one line; custom items are always unique.
      if (item.productId) {
        const existing = state.items.find((i) => i.productId === item.productId)
        if (existing) {
          return {
            ...state,
            items: state.items.map((i) =>
              i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i,
            ),
          }
        }
      }
      return { ...state, items: [...state.items, item] }
    }
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((i) => {
          if (i.id !== action.id) return i
          const next = { ...i, ...action.patch }
          // Quantities respect the item's minimum (premade stickers sell
          // in batches of 5+).
          if (action.patch.qty !== undefined) {
            next.qty = Math.max(i.minQty ?? 1, Math.floor(action.patch.qty))
          }
          return next
        }),
      }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    case 'PLACE_ORDER':
      return {
        ...state,
        items: [],
        lastOrder: action.order,
        orders: [action.order, ...state.orders],
      }
    case 'SET_ORDERS':
      return { ...state, orders: action.orders }
    case 'SET_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)),
      }
    case 'SET_PRODUCTS':
      return { ...state, products: action.products }
    case 'ADD_PRODUCT':
      return { ...state, products: [action.product, ...state.products] }
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      }
    case 'REMOVE_PRODUCT':
      return { ...state, products: state.products.filter((p) => p.id !== action.id) }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    orders: [],
    lastOrder: null,
    products: SEED_PRODUCTS,
  })

  // Latest state for the service API below (its callbacks are memoized once).
  const stateRef = useRef(state)
  stateRef.current = state

  // Initial load from Supabase. On a brand-new database the built-in
  // catalog is seeded in so the shop starts stocked.
  useEffect(() => {
    if (!supabaseEnabled) return
    let cancelled = false

    async function load() {
      const { data: productRows, error: productError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (!cancelled && !productError && productRows) {
        if (productRows.length === 0) {
          syncToSupabase(
            supabase.from('products').upsert(SEED_PRODUCTS.map(productToRow)),
            'seed products',
          )
        } else {
          dispatch({ type: 'SET_PRODUCTS', products: productRows.map(rowToProduct) })
        }
      }
      if (productError) console.warn('Supabase load products failed:', productError.message)

      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('placed_at', { ascending: false })
      if (!cancelled && !orderError && orderRows) {
        dispatch({ type: 'SET_ORDERS', orders: orderRows.map(rowToOrder) })
      }
      if (orderError) console.warn('Supabase load orders failed:', orderError.message)
    }

    load().catch((err) => console.warn('Supabase initial load failed:', err?.message ?? err))
    return () => {
      cancelled = true
    }
  }, [])

  const api = useMemo(
    () => ({
      addItem(item) {
        const id = item.id ?? `item-${itemSeq++}`
        dispatch({ type: 'ADD_ITEM', item: { qty: 1, ...item, id } })
        return id
      },
      updateItem(id, patch) {
        dispatch({ type: 'UPDATE_ITEM', id, patch })
      },
      setQty(id, qty) {
        dispatch({ type: 'UPDATE_ITEM', id, patch: { qty } })
      },
      removeItem(id) {
        dispatch({ type: 'REMOVE_ITEM', id })
      },
      clearCart() {
        dispatch({ type: 'CLEAR_CART' })
      },
      placeOrder(shipping) {
        const items = stateRef.current.items
        const order = {
          id: `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          placedAt: new Date().toISOString(),
          status: 'new',
          shipping,
          items,
          totals: cartTotals(items),
        }
        dispatch({ type: 'PLACE_ORDER', order })
        if (supabase) {
          syncToSupabase(supabase.from('orders').insert(orderToRow(order)), 'insert order')
        }
        return order
      },
      setOrderStatus(id, status) {
        dispatch({ type: 'SET_ORDER_STATUS', id, status })
        if (supabase) {
          syncToSupabase(
            supabase.from('orders').update({ status }).eq('id', id),
            'update order status',
          )
        }
      },
      addProduct(product) {
        const id = `custom-${Date.now()}-${productSeq++}`
        const full = { tag: null, ...product, id }
        dispatch({ type: 'ADD_PRODUCT', product: full })
        if (supabase) {
          syncToSupabase(supabase.from('products').insert(productToRow(full)), 'insert product')
        }
        return id
      },
      updateProduct(id, patch) {
        dispatch({ type: 'UPDATE_PRODUCT', id, patch })
        if (supabase) {
          const current = stateRef.current.products.find((p) => p.id === id)
          if (current) {
            syncToSupabase(
              supabase.from('products').upsert(productToRow({ ...current, ...patch })),
              'update product',
            )
          }
        }
      },
      removeProduct(id) {
        dispatch({ type: 'REMOVE_PRODUCT', id })
        if (supabase) {
          syncToSupabase(supabase.from('products').delete().eq('id', id), 'delete product')
        }
      },
    }),
    [],
  )

  const totals = useMemo(() => cartTotals(state.items), [state.items])
  const count = useMemo(() => state.items.reduce((n, i) => n + i.qty, 0), [state.items])

  const value = useMemo(
    () => ({
      items: state.items,
      orders: state.orders,
      lastOrder: state.lastOrder,
      products: state.products,
      persisted: supabaseEnabled,
      totals,
      count,
      ...api,
    }),
    [state, totals, count, api],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
