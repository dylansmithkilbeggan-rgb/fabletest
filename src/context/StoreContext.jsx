import { createContext, useContext, useMemo, useReducer } from 'react'
import { cartTotals } from '../utils/pricing.js'
import { PRODUCTS as SEED_PRODUCTS } from '../data/products.js'

// Cart, order and product state lives in React memory on purpose: this
// prototype may run in sandboxed environments without storage access.
// Everything goes through the small service-style API below, so a backend
// (or persisted storage) can replace the reducer later without touching
// the pages. Products are seeded from the built-in catalog and editable
// from the admin page.

const StoreContext = createContext(null)

let itemSeq = 1
let productSeq = 1

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item } = action
      // Premade products merge into one line; custom sheets are always unique.
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
    case 'PLACE_ORDER': {
      const order = {
        ...action.order,
        status: 'new',
        items: state.items,
        totals: cartTotals(state.items),
      }
      return { ...state, items: [], lastOrder: order, orders: [order, ...state.orders] }
    }
    case 'SET_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)),
      }
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
        dispatch({
          type: 'PLACE_ORDER',
          order: {
            id: `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            placedAt: new Date().toISOString(),
            shipping,
          },
        })
      },
      setOrderStatus(id, status) {
        dispatch({ type: 'SET_ORDER_STATUS', id, status })
      },
      addProduct(product) {
        const id = `custom-${productSeq++}`
        dispatch({ type: 'ADD_PRODUCT', product: { tag: null, ...product, id } })
        return id
      },
      updateProduct(id, patch) {
        dispatch({ type: 'UPDATE_PRODUCT', id, patch })
      },
      removeProduct(id) {
        dispatch({ type: 'REMOVE_PRODUCT', id })
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
