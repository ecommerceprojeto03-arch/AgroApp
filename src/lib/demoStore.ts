import type {
  CheckoutFormData,
  CheckoutGroup,
  Order,
  OrderStatus,
  Product,
  UserProfile,
} from '../types'
import { DELIVERY_FEE } from '../types'
import { generateId } from './format'

const KEYS = {
  users: 'agrotech_users',
  products: 'agrotech_products',
  orders: 'agrotech_orders',
  checkouts: 'agrotech_checkouts',
  session: 'agrotech_session',
  counters: 'agrotech_counters',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function nextCounter(name: 'compra' | 'pedido' | 'product'): number {
  const counters = read<Record<string, number>>(KEYS.counters, {
    compra: 0,
    pedido: 0,
    product: 0,
  })
  counters[name] = (counters[name] ?? 0) + 1
  write(KEYS.counters, counters)
  return counters[name]
}

const SEED_PRODUCERS: UserProfile[] = [
  {
    uid: 'producer-boa-esperanca',
    email: 'boaesperanca@agrotech.demo',
    name: 'Maria Oliveira',
    role: 'producer',
    phone: '(11) 98888-1001',
    farmName: 'Fazenda Boa Esperança',
    address: 'Estrada Rural km 12, Interior',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'producer-verde-vida',
    email: 'verdevida@agrotech.demo',
    name: 'João Santos',
    role: 'producer',
    phone: '(11) 97777-2002',
    farmName: 'Sítio Verde Vida',
    address: 'Rodovia dos Agricultores, 450',
    createdAt: new Date().toISOString(),
  },
]

const SEED_CONSUMER: UserProfile = {
  uid: 'consumer-demo',
  email: 'consumidor@agrotech.demo',
  name: 'Ana Consumidora',
  role: 'consumer',
  phone: '(11) 99999-0000',
  address: 'Rua das Flores, 100 — Centro',
  createdAt: new Date().toISOString(),
}

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-banana',
    producerId: 'producer-boa-esperanca',
    producerName: 'Fazenda Boa Esperança',
    name: 'Banana',
    description: 'Banana nanica madura, colhida na semana.',
    price: 6,
    unit: 'kg',
    stock: 80,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1571771894821-ce9b6d11d85e?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-tomate',
    producerId: 'producer-boa-esperanca',
    producerName: 'Fazenda Boa Esperança',
    name: 'Tomate',
    description: 'Tomate italiano fresco para saladas e molhos.',
    price: 8,
    unit: 'kg',
    stock: 50,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1546470427-e212b9d31075?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-alface',
    producerId: 'producer-verde-vida',
    producerName: 'Sítio Verde Vida',
    name: 'Alface',
    description: 'Alface crespa hidropônica, sem agrotóxicos.',
    price: 3.5,
    unit: 'unidade',
    stock: 40,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-cenoura',
    producerId: 'producer-verde-vida',
    producerName: 'Sítio Verde Vida',
    name: 'Cenoura',
    description: 'Cenoura orgânica crocante e doce.',
    price: 5,
    unit: 'kg',
    stock: 60,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-ovos',
    producerId: 'producer-boa-esperanca',
    producerName: 'Fazenda Boa Esperança',
    name: 'Ovos caipiras',
    description: 'Cartela com 12 ovos de galinhas criadas soltas.',
    price: 15,
    unit: 'cartela',
    stock: 25,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-morango',
    producerId: 'producer-verde-vida',
    producerName: 'Sítio Verde Vida',
    name: 'Morango',
    description: 'Morangos selecionados, embalagem de 250g.',
    price: 12,
    unit: 'bandeja',
    stock: 30,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80',
    createdAt: new Date().toISOString(),
  },
]

export function ensureDemoSeed(): void {
  if (!localStorage.getItem(KEYS.products)) {
    write(KEYS.products, SEED_PRODUCTS)
  }
  if (!localStorage.getItem(KEYS.users)) {
    write(KEYS.users, [...SEED_PRODUCERS, SEED_CONSUMER])
  }
  if (!localStorage.getItem(KEYS.orders)) {
    write(KEYS.orders, [] as Order[])
  }
  if (!localStorage.getItem(KEYS.checkouts)) {
    write(KEYS.checkouts, [] as CheckoutGroup[])
  }
}

export function demoGetSession(): UserProfile | null {
  return read<UserProfile | null>(KEYS.session, null)
}

export function demoSetSession(user: UserProfile | null): void {
  if (user) write(KEYS.session, user)
  else localStorage.removeItem(KEYS.session)
}

export function demoLogin(email: string, _password: string): UserProfile {
  ensureDemoSeed()
  const users = read<UserProfile[]>(KEYS.users, [])
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!found) {
    throw new Error('Usuário não encontrado. Use as contas demo listadas na tela de login.')
  }
  demoSetSession(found)
  return found
}

export function demoRegister(data: {
  email: string
  password: string
  name: string
  role: UserProfile['role']
  phone?: string
  farmName?: string
}): UserProfile {
  ensureDemoSeed()
  const users = read<UserProfile[]>(KEYS.users, [])
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('E-mail já cadastrado.')
  }
  const user: UserProfile = {
    uid: `user-${Date.now()}`,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone,
    farmName: data.role === 'producer' ? data.farmName || data.name : undefined,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  write(KEYS.users, users)
  demoSetSession(user)
  return user
}

export function demoListProducts(): Product[] {
  ensureDemoSeed()
  return read<Product[]>(KEYS.products, [])
}

export function demoGetProduct(id: string): Product | undefined {
  return demoListProducts().find((p) => p.id === id)
}

export function demoUpsertProduct(product: Product): void {
  const products = demoListProducts()
  const idx = products.findIndex((p) => p.id === product.id)
  if (idx >= 0) products[idx] = product
  else products.push(product)
  write(KEYS.products, products)
}

export function demoCreateProduct(
  data: Omit<Product, 'id' | 'createdAt'>,
): Product {
  const product: Product = {
    ...data,
    id: generateId('prod', nextCounter('product') + 100),
    createdAt: new Date().toISOString(),
  }
  demoUpsertProduct(product)
  return product
}

export type CartLine = {
  productId: string
  quantity: number
  expectedPrice: number
}

/**
 * Simula transação atômica: valida estoque/preço/ativo,
 * cria pedidos por produtor e baixa estoque. Em falha, nada é persistido.
 */
export function demoConfirmCheckout(
  consumer: UserProfile,
  form: CheckoutFormData,
  lines: CartLine[],
): { checkout: CheckoutGroup; orders: Order[] } {
  ensureDemoSeed()

  const productsSnapshot = demoListProducts()
  const productsById = new Map(productsSnapshot.map((p) => [p.id, { ...p }]))

  const validated: {
    product: Product
    quantity: number
  }[] = []

  for (const line of lines) {
    const product = productsById.get(line.productId)
    if (!product) throw new Error(`Produto ${line.productId} não encontrado.`)
    if (!product.active) throw new Error(`${product.name} não está ativo.`)
    if (product.price !== line.expectedPrice) {
      throw new Error(`Preço de ${product.name} foi atualizado. Atualize o carrinho.`)
    }
    if (line.quantity <= 0) throw new Error(`Quantidade inválida para ${product.name}.`)
    if (product.stock < line.quantity) {
      throw new Error(
        `Estoque insuficiente de ${product.name}. Disponível: ${product.stock} ${product.unit}.`,
      )
    }
    validated.push({ product, quantity: line.quantity })
  }

  // Agrupa por produtor
  const byProducer = new Map<
    string,
    { producerName: string; items: typeof validated }
  >()

  for (const entry of validated) {
    const key = entry.product.producerId
    const group = byProducer.get(key) ?? {
      producerName: entry.product.producerName,
      items: [],
    }
    group.items.push(entry)
    byProducer.set(key, group)
  }

  const now = new Date().toISOString()
  const checkoutId = generateId('COMPRA', nextCounter('compra'))
  const orders: Order[] = []

  for (const [producerId, group] of byProducer) {
    const fulfillment = form.producerFulfillment[producerId] ?? 'pickup'
    const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
    const items = group.items.map(({ product, quantity }) => ({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
      unit: product.unit,
    }))
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const orderId = generateId('PED', nextCounter('pedido'))

    orders.push({
      id: orderId,
      checkoutGroupId: checkoutId,
      producerId,
      producerName: group.producerName,
      consumerId: consumer.uid,
      consumerName: form.name,
      consumerEmail: form.email,
      consumerPhone: form.phone,
      address: fulfillment === 'delivery' ? form.address : undefined,
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfillment,
      paymentMethod: form.paymentMethod,
      status: 'pendente',
      createdAt: now,
      updatedAt: now,
    })
  }

  // Baixa de estoque (ainda só em memória até commit)
  for (const { product, quantity } of validated) {
    const current = productsById.get(product.id)!
    const nextStock = current.stock - quantity
    if (nextStock < 0) {
      throw new Error(`Estoque negativo impedido para ${product.name}.`)
    }
    current.stock = nextStock
  }

  const checkout: CheckoutGroup = {
    id: checkoutId,
    consumerId: consumer.uid,
    consumerName: form.name,
    consumerEmail: form.email,
    consumerPhone: form.phone,
    address: form.address || undefined,
    paymentMethod: form.paymentMethod,
    orderIds: orders.map((o) => o.id),
    total: orders.reduce((s, o) => s + o.total, 0),
    createdAt: now,
  }

  // Commit atômico (tudo ou nada)
  try {
    write(KEYS.products, Array.from(productsById.values()))
    const existingOrders = read<Order[]>(KEYS.orders, [])
    const existingCheckouts = read<CheckoutGroup[]>(KEYS.checkouts, [])
    write(KEYS.orders, [...existingOrders, ...orders])
    write(KEYS.checkouts, [...existingCheckouts, checkout])
  } catch (err) {
    throw new Error(
      `Falha ao registrar compra. Nenhuma alteração parcial foi mantida. ${String(err)}`,
    )
  }

  return { checkout, orders }
}

export function demoListOrdersByConsumer(consumerId: string): Order[] {
  ensureDemoSeed()
  return read<Order[]>(KEYS.orders, [])
    .filter((o) => o.consumerId === consumerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function demoListOrdersByProducer(producerId: string): Order[] {
  ensureDemoSeed()
  return read<Order[]>(KEYS.orders, [])
    .filter((o) => o.producerId === producerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function demoGetCheckout(id: string): CheckoutGroup | undefined {
  return read<CheckoutGroup[]>(KEYS.checkouts, []).find((c) => c.id === id)
}

export function demoUpdateOrderStatus(
  orderId: string,
  producerId: string,
  status: OrderStatus,
): Order {
  const orders = read<Order[]>(KEYS.orders, [])
  const idx = orders.findIndex((o) => o.id === orderId)
  if (idx < 0) throw new Error('Pedido não encontrado.')
  if (orders[idx].producerId !== producerId) {
    throw new Error('Você só pode atualizar pedidos da sua propriedade.')
  }
  orders[idx] = {
    ...orders[idx],
    status,
    updatedAt: new Date().toISOString(),
  }
  write(KEYS.orders, orders)
  return orders[idx]
}

export const DEMO_ACCOUNTS = [
  {
    label: 'Consumidor',
    email: 'consumidor@agrotech.demo',
    password: 'demo123',
  },
  {
    label: 'Fazenda Boa Esperança',
    email: 'boaesperanca@agrotech.demo',
    password: 'demo123',
  },
  {
    label: 'Sítio Verde Vida',
    email: 'verdevida@agrotech.demo',
    password: 'demo123',
  },
] as const
