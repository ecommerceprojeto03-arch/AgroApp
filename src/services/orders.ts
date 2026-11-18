import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db, isDemoMode } from '../lib/firebase'
import {
  demoConfirmCheckout,
  demoGetCheckout,
  demoListOrdersByConsumer,
  demoListOrdersByProducer,
  demoUpdateOrderStatus,
  type CartLine,
} from '../lib/demoStore'
import { generateId } from '../lib/format'
import {
  DELIVERY_FEE,
  type CheckoutFormData,
  type CheckoutGroup,
  type Order,
  type OrderStatus,
  type UserProfile,
} from '../types'

function mapOrder(id: string, data: DocumentData): Order {
  return {
    id,
    checkoutGroupId: data.checkoutGroupId,
    producerId: data.producerId,
    producerName: data.producerName,
    consumerId: data.consumerId,
    consumerName: data.consumerName,
    consumerEmail: data.consumerEmail,
    consumerPhone: data.consumerPhone,
    address: data.address,
    items: data.items ?? [],
    subtotal: Number(data.subtotal),
    deliveryFee: Number(data.deliveryFee ?? 0),
    total: Number(data.total),
    fulfillment: data.fulfillment,
    paymentMethod: data.paymentMethod,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

function mapCheckout(id: string, data: DocumentData): CheckoutGroup {
  return {
    id,
    consumerId: data.consumerId,
    consumerName: data.consumerName,
    consumerEmail: data.consumerEmail,
    consumerPhone: data.consumerPhone,
    address: data.address,
    paymentMethod: data.paymentMethod,
    orderIds: data.orderIds ?? [],
    total: Number(data.total),
    createdAt: data.createdAt,
  }
}

/**
 * Confirma compra com separação automática por produtor.
 * Em Firestore: uma única runTransaction lê produtos, valida e grava
 * checkout + pedidos + baixa de estoque. Falha = nada parcial.
 */
export async function confirmCheckout(
  consumer: UserProfile,
  form: CheckoutFormData,
  lines: CartLine[],
): Promise<{ checkout: CheckoutGroup; orders: Order[] }> {
  if (isDemoMode) {
    return demoConfirmCheckout(consumer, form, lines)
  }

  return runTransaction(db!, async (tx) => {
    const counterRef = doc(db!, 'counters', 'global')
    const counterSnap = await tx.get(counterRef)
    const counters = counterSnap.exists()
      ? (counterSnap.data() as { compra?: number; pedido?: number })
      : { compra: 0, pedido: 0 }

    let compra = Number(counters.compra ?? 0) + 1
    let pedido = Number(counters.pedido ?? 0)

    const productRefs = lines.map((l) => doc(db!, 'products', l.productId))
    const productSnaps = await Promise.all(productRefs.map((r) => tx.get(r)))

    const validated: {
      productId: string
      producerId: string
      producerName: string
      name: string
      unit: string
      price: number
      quantity: number
      newStock: number
    }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const snap = productSnaps[i]
      if (!snap.exists()) {
        throw new Error(`Produto ${line.productId} não encontrado.`)
      }
      const data = snap.data()
      if (!data.active) {
        throw new Error(`${data.name} não está ativo.`)
      }
      if (Number(data.price) !== line.expectedPrice) {
        throw new Error(`Preço de ${data.name} foi atualizado. Atualize o carrinho.`)
      }
      if (line.quantity <= 0) {
        throw new Error(`Quantidade inválida para ${data.name}.`)
      }
      const stock = Number(data.stock)
      if (stock < line.quantity) {
        throw new Error(
          `Estoque insuficiente de ${data.name}. Disponível: ${stock} ${data.unit}.`,
        )
      }
      const newStock = stock - line.quantity
      if (newStock < 0) {
        throw new Error(`Estoque negativo impedido para ${data.name}.`)
      }
      validated.push({
        productId: snap.id,
        producerId: data.producerId,
        producerName: data.producerName,
        name: data.name,
        unit: data.unit,
        price: Number(data.price),
        quantity: line.quantity,
        newStock,
      })
    }

    const byProducer = new Map<
      string,
      { producerName: string; items: typeof validated }
    >()

    for (const entry of validated) {
      const group = byProducer.get(entry.producerId) ?? {
        producerName: entry.producerName,
        items: [],
      }
      group.items.push(entry)
      byProducer.set(entry.producerId, group)
    }

    const now = new Date().toISOString()
    const checkoutId = generateId('COMPRA', compra)
    const orders: Order[] = []
    const orderIds: string[] = []

    for (const [producerId, group] of byProducer) {
      pedido += 1
      const orderId = generateId('PED', pedido)
      const fulfillment = form.producerFulfillment[producerId] ?? 'pickup'
      const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
      const items = group.items.map((e) => ({
        productId: e.productId,
        name: e.name,
        quantity: e.quantity,
        unitPrice: e.price,
        unit: e.unit,
      }))
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      const order: Order = {
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
      }
      orders.push(order)
      orderIds.push(orderId)
      tx.set(doc(db!, 'orders', orderId), order)
    }

    for (const entry of validated) {
      tx.update(doc(db!, 'products', entry.productId), {
        stock: entry.newStock,
      })
    }

    const checkout: CheckoutGroup = {
      id: checkoutId,
      consumerId: consumer.uid,
      consumerName: form.name,
      consumerEmail: form.email,
      consumerPhone: form.phone,
      address: form.address || undefined,
      paymentMethod: form.paymentMethod,
      orderIds,
      total: orders.reduce((s, o) => s + o.total, 0),
      createdAt: now,
    }

    tx.set(doc(db!, 'checkouts', checkoutId), checkout)
    tx.set(counterRef, { compra, pedido }, { merge: true })

    return { checkout, orders }
  })
}

export async function listConsumerOrders(consumerId: string): Promise<Order[]> {
  if (isDemoMode) return demoListOrdersByConsumer(consumerId)
  const snap = await getDocs(
    query(collection(db!, 'orders'), where('consumerId', '==', consumerId)),
  )
  return snap.docs
    .map((d) => mapOrder(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listProducerOrders(producerId: string): Promise<Order[]> {
  if (isDemoMode) return demoListOrdersByProducer(producerId)
  const snap = await getDocs(
    query(collection(db!, 'orders'), where('producerId', '==', producerId)),
  )
  return snap.docs
    .map((d) => mapOrder(d.id, d.data()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getCheckoutGroup(
  id: string,
): Promise<CheckoutGroup | undefined> {
  if (isDemoMode) return demoGetCheckout(id)
  const snap = await getDoc(doc(db!, 'checkouts', id))
  return snap.exists() ? mapCheckout(snap.id, snap.data()) : undefined
}

export async function updateOrderStatus(
  orderId: string,
  producerId: string,
  status: OrderStatus,
): Promise<Order> {
  if (isDemoMode) {
    return demoUpdateOrderStatus(orderId, producerId, status)
  }

  return runTransaction(db!, async (tx) => {
    const ref = doc(db!, 'orders', orderId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('Pedido não encontrado.')
    const data = snap.data()
    if (data.producerId !== producerId) {
      throw new Error('Você só pode atualizar pedidos da sua propriedade.')
    }
    tx.update(ref, { status, updatedAt: new Date().toISOString() })
    return mapOrder(orderId, { ...data, status, updatedAt: new Date().toISOString() })
  })
}
