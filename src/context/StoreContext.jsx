import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { cartTotals } from '../utils/pricing.js'
import { PRODUCTS as SEED_PRODUCTS } from '../data/products.js'
import { SEED_SECTIONS } from '../data/sections.js'
import { supabase, supabaseEnabled, syncToSupabase, onSyncError } from '../lib/supabase.js'

// The store keeps all state in React memory and, when Supabase credentials
// are configured (see src/lib/supabase.js), mirrors orders and products to
// the database: writes are optimistic (UI updates instantly, then syncs),
// reads happen once on startup. Without credentials everything still works,
// nothing persists — the cart is always in-memory either way.

const StoreContext = createContext(null)

let itemSeq = 1
let productSeq = 1
let sectionSeq = 1

const productToRow = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  size: p.size ?? null,
  tag: p.tag ?? null,
  image: p.image ?? null,
  kind: p.kind ?? 'sticker',
  images: p.images ?? [],
  keywords: p.keywords ?? '',
  section: p.section ?? '',
})

const rowToProduct = (r) => ({
  id: r.id,
  name: r.name,
  price: Number(r.price),
  size: r.size ?? '',
  tag: r.tag ?? null,
  image: r.image ?? '',
  kind: r.kind ?? 'sticker',
  images: Array.isArray(r.images) ? r.images : [],
  keywords: r.keywords ?? '',
  section: r.section ?? '',
})

const sectionToRow = (s) => ({
  id: s.id,
  title: s.title,
  blurb: s.blurb ?? '',
  show_on_home: s.showOnHome ?? false,
})

const rowToSection = (r) => ({
  id: r.id,
  title: r.title,
  blurb: r.blurb ?? '',
  showOnHome: Boolean(r.show_on_home),
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
          if (action.patch.qty !== undefined) {
            next.qty = Math.max(1, Math.floor(action.patch.qty))
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
    case 'SET_SYNC_ERROR':
      return { ...state, syncError: action.error }
    case 'SET_SECTIONS':
      return { ...state, sections: action.sections }
    case 'ADD_SECTION':
      return { ...state, sections: [...state.sections, action.section] }
    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }
    case 'REMOVE_SECTION':
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.id),
        // products that pointed at the deleted section fall back to the
        // default shop lists.
        products: state.products.map((p) =>
          p.section === action.id ? { ...p, section: '' } : p,
        ),
      }
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
    sections: SEED_SECTIONS,
    syncError: null,
  })

  // Latest state for the service API below (its callbacks are memoized once).
  const stateRef = useRef(state)
  stateRef.current = state

  // Initial load from Supabase. Products are public; orders are guarded by
  // row-level security, so they only load once the admin signs in (the
  // client attaches the auth session automatically). On a brand-new
  // database the built-in catalog is seeded in so the shop starts stocked.
  useEffect(() => {
    if (!supabaseEnabled) return
    let cancelled = false

    async function loadProducts() {
      const { data: rows, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (!cancelled && !error && rows) {
        if (rows.length === 0) {
          syncToSupabase(
            supabase.from('products').upsert(SEED_PRODUCTS.map(productToRow)),
            'seed products',
          )
        } else {
          dispatch({ type: 'SET_PRODUCTS', products: rows.map(rowToProduct) })
        }
      }
      if (error) console.warn('Supabase load products failed:', error.message)
    }

    async function loadSections() {
      const { data: rows, error } = await supabase
        .from('sections')
        .select('*')
        .order('created_at', { ascending: true })
      if (!cancelled && !error && rows) {
        if (rows.length === 0) {
          syncToSupabase(
            supabase.from('sections').upsert(SEED_SECTIONS.map(sectionToRow)),
            'seed sections',
          )
        } else {
          dispatch({ type: 'SET_SECTIONS', sections: rows.map(rowToSection) })
        }
      }
      if (error) console.warn('Supabase load sections failed:', error.message)
    }

    async function loadOrders() {
      const { data: rows, error } = await supabase
        .from('orders')
        .select('*')
        .order('placed_at', { ascending: false })
      if (!cancelled && !error && rows) {
        dispatch({ type: 'SET_ORDERS', orders: rows.map(rowToOrder) })
      }
      if (error) console.warn('Supabase load orders failed:', error.message)
    }

    loadProducts().catch((err) => console.warn('Supabase load products failed:', err?.message ?? err))
    loadSections().catch((err) => console.warn('Supabase load sections failed:', err?.message ?? err))

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadOrders().catch((err) => console.warn('Supabase load orders failed:', err?.message ?? err))
      } else if (!cancelled) {
        dispatch({ type: 'SET_ORDERS', orders: [] })
      }
    })

    return () => {
      cancelled = true
      authSub.subscription.unsubscribe()
    }
  }, [])

  // Surface failed background saves (e.g. a rejected write when the admin
  // session has lapsed) so the owner sees them instead of silent data loss.
  useEffect(() => {
    if (!supabaseEnabled) return
    onSyncError((where, message) => dispatch({ type: 'SET_SYNC_ERROR', error: { where, message } }))
    return () => onSyncError(null)
  }, [])

  const api = useMemo(
    () => ({
      clearSyncError() {
        dispatch({ type: 'SET_SYNC_ERROR', error: null })
      },
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
      // Record an order as 'pending' right before sending the shopper to
      // Stripe. The confirm-order function flips it to 'new' once Stripe
      // says the payment went through, so unpaid attempts never count.
      beginCheckout(shipping, orderId) {
        const items = stateRef.current.items
        const order = {
          id: orderId,
          placedAt: new Date().toISOString(),
          status: 'pending',
          shipping,
          items,
          totals: cartTotals(items),
        }
        if (supabase) {
          syncToSupabase(supabase.from('orders').insert(orderToRow(order)), 'begin checkout')
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
      clearOrders() {
        dispatch({ type: 'SET_ORDERS', orders: [] })
        if (supabase) {
          // Delete-all needs a filter in PostgREST; match every non-empty id.
          syncToSupabase(supabase.from('orders').delete().neq('id', ''), 'clear orders')
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
      addSection(section) {
        const id = `section-${Date.now()}-${sectionSeq++}`
        const full = { blurb: '', showOnHome: false, ...section, id }
        dispatch({ type: 'ADD_SECTION', section: full })
        if (supabase) {
          syncToSupabase(supabase.from('sections').insert(sectionToRow(full)), 'insert section')
        }
        return id
      },
      updateSection(id, patch) {
        dispatch({ type: 'UPDATE_SECTION', id, patch })
        if (supabase) {
          const current = stateRef.current.sections.find((s) => s.id === id)
          if (current) {
            syncToSupabase(
              supabase.from('sections').upsert(sectionToRow({ ...current, ...patch })),
              'update section',
            )
          }
        }
      },
      removeSection(id) {
        // Detach products locally so they return to the default lists; the
        // database enforces the same via the products it still holds.
        const affected = stateRef.current.products.filter((p) => p.section === id)
        dispatch({ type: 'REMOVE_SECTION', id })
        if (supabase) {
          syncToSupabase(supabase.from('sections').delete().eq('id', id), 'delete section')
          if (affected.length > 0) {
            syncToSupabase(
              supabase.from('products').update({ section: '' }).eq('section', id),
              'clear product sections',
            )
          }
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
      sections: state.sections,
      syncError: state.syncError,
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
