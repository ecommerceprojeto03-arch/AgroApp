import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, FulfillmentMode, ProducerCartGroup, Product } from '../types'
import { DELIVERY_FEE } from '../types'

interface CartContextValue {
  items: CartItem[]
  groups: ProducerCartGroup[]
  totalItems: number
  subtotal: number
  deliveryTotal: number
  grandTotal: number
  addItem: (product: Product, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  setFulfillment: (producerId: string, mode: FulfillmentMode) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'agrotech_cart'
const FULFILLMENT_KEY = 'agrotech_fulfillment'

function loadItems(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CartItem[]
  } catch {
    return []
  }
}

function loadFulfillment(): Record<string, FulfillmentMode> {
  try {
    return JSON.parse(localStorage.getItem(FULFILLMENT_KEY) || '{}') as Record<
      string,
      FulfillmentMode
    >
  } catch {
    return {}
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadItems)
  const [fulfillment, setFulfillmentMap] =
    useState<Record<string, FulfillmentMode>>(loadFulfillment)

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const persistFulfillment = useCallback(
    (next: Record<string, FulfillmentMode>) => {
      setFulfillmentMap(next)
      localStorage.setItem(FULFILLMENT_KEY, JSON.stringify(next))
    },
    [],
  )

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      const next = [...items]
      const idx = next.findIndex((i) => i.productId === product.id)
      if (idx >= 0) {
        const qty = Math.min(product.stock, next[idx].quantity + quantity)
        next[idx] = { ...next[idx], quantity: qty, price: product.price, stock: product.stock }
      } else {
        next.push({
          productId: product.id,
          producerId: product.producerId,
          producerName: product.producerName,
          name: product.name,
          price: product.price,
          unit: product.unit,
          quantity: Math.min(product.stock, quantity),
          imageUrl: product.imageUrl,
          stock: product.stock,
        })
      }
      persist(next)
      if (!fulfillment[product.producerId]) {
        persistFulfillment({ ...fulfillment, [product.producerId]: 'pickup' })
      }
    },
    [items, persist, fulfillment, persistFulfillment],
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        persist(items.filter((i) => i.productId !== productId))
        return
      }
      persist(
        items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(i.stock, quantity) }
            : i,
        ),
      )
    },
    [items, persist],
  )

  const removeItem = useCallback(
    (productId: string) => {
      persist(items.filter((i) => i.productId !== productId))
    },
    [items, persist],
  )

  const setFulfillment = useCallback(
    (producerId: string, mode: FulfillmentMode) => {
      persistFulfillment({ ...fulfillment, [producerId]: mode })
    },
    [fulfillment, persistFulfillment],
  )

  const clear = useCallback(() => {
    persist([])
    persistFulfillment({})
  }, [persist, persistFulfillment])

  const groups = useMemo<ProducerCartGroup[]>(() => {
    const map = new Map<string, ProducerCartGroup>()
    for (const item of items) {
      const group = map.get(item.producerId) ?? {
        producerId: item.producerId,
        producerName: item.producerName,
        items: [],
        subtotal: 0,
        fulfillment: fulfillment[item.producerId] ?? 'pickup',
        deliveryFee: 0,
      }
      group.items.push(item)
      group.subtotal += item.price * item.quantity
      map.set(item.producerId, group)
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      fulfillment: fulfillment[g.producerId] ?? 'pickup',
      deliveryFee:
        (fulfillment[g.producerId] ?? 'pickup') === 'delivery' ? DELIVERY_FEE : 0,
    }))
  }, [items, fulfillment])

  const subtotal = groups.reduce((s, g) => s + g.subtotal, 0)
  const deliveryTotal = groups.reduce((s, g) => s + g.deliveryFee, 0)
  const grandTotal = subtotal + deliveryTotal
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  const value = useMemo(
    () => ({
      items,
      groups,
      totalItems,
      subtotal,
      deliveryTotal,
      grandTotal,
      addItem,
      updateQuantity,
      removeItem,
      setFulfillment,
      clear,
    }),
    [
      items,
      groups,
      totalItems,
      subtotal,
      deliveryTotal,
      grandTotal,
      addItem,
      updateQuantity,
      removeItem,
      setFulfillment,
      clear,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
