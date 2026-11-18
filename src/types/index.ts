export type UserRole = 'consumer' | 'producer' | 'admin'

export type FulfillmentMode = 'delivery' | 'pickup'

export type PaymentMethod = 'on_delivery' | 'on_pickup' | 'simulated'

export type OrderStatus =
  | 'pendente'
  | 'confirmado'
  | 'em_preparacao'
  | 'pronto_retirada'
  | 'em_transporte'
  | 'entregue'
  | 'cancelado'

export interface UserProfile {
  uid: string
  email: string
  name: string
  role: UserRole
  phone?: string
  address?: string
  farmName?: string
  createdAt: string
}

export interface Product {
  id: string
  producerId: string
  producerName: string
  name: string
  description: string
  price: number
  unit: string
  stock: number
  active: boolean
  imageUrl: string
  createdAt: string
}

export interface CartItem {
  productId: string
  producerId: string
  producerName: string
  name: string
  price: number
  unit: string
  quantity: number
  imageUrl: string
  stock: number
}

export interface ProducerCartGroup {
  producerId: string
  producerName: string
  items: CartItem[]
  subtotal: number
  fulfillment: FulfillmentMode
  deliveryFee: number
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  unit: string
}

export interface Order {
  id: string
  checkoutGroupId: string
  producerId: string
  producerName: string
  consumerId: string
  consumerName: string
  consumerEmail: string
  consumerPhone: string
  address?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  fulfillment: FulfillmentMode
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface CheckoutGroup {
  id: string
  consumerId: string
  consumerName: string
  consumerEmail: string
  consumerPhone: string
  address?: string
  paymentMethod: PaymentMethod
  orderIds: string[]
  total: number
  createdAt: string
}

export interface CheckoutFormData {
  name: string
  email: string
  phone: string
  address: string
  paymentMethod: PaymentMethod
  producerFulfillment: Record<string, FulfillmentMode>
}

export const DELIVERY_FEE = 8

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_preparacao: 'Em preparação',
  pronto_retirada: 'Pronto para retirada',
  em_transporte: 'Em transporte',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const PRODUCER_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['em_preparacao', 'cancelado'],
  em_preparacao: ['pronto_retirada', 'em_transporte', 'cancelado'],
  pronto_retirada: ['entregue', 'cancelado'],
  em_transporte: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
}
