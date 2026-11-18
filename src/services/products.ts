import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db, isDemoMode } from '../lib/firebase'
import {
  demoCreateProduct,
  demoListProducts,
  demoUpsertProduct,
} from '../lib/demoStore'
import type { Product } from '../types'

function mapProduct(id: string, data: DocumentData): Product {
  return {
    id,
    producerId: data.producerId,
    producerName: data.producerName,
    name: data.name,
    description: data.description ?? '',
    price: Number(data.price),
    unit: data.unit,
    stock: Number(data.stock),
    active: Boolean(data.active),
    imageUrl: data.imageUrl ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

export async function listActiveProducts(): Promise<Product[]> {
  if (isDemoMode) {
    return demoListProducts().filter((p) => p.active && p.stock > 0)
  }
  const snap = await getDocs(
    query(collection(db!, 'products'), where('active', '==', true)),
  )
  return snap.docs
    .map((d) => mapProduct(d.id, d.data()))
    .filter((p) => p.stock > 0)
}

export async function listAllProducts(): Promise<Product[]> {
  if (isDemoMode) return demoListProducts()
  const snap = await getDocs(collection(db!, 'products'))
  return snap.docs.map((d) => mapProduct(d.id, d.data()))
}

export async function listProducerProducts(producerId: string): Promise<Product[]> {
  if (isDemoMode) {
    return demoListProducts().filter((p) => p.producerId === producerId)
  }
  const snap = await getDocs(
    query(collection(db!, 'products'), where('producerId', '==', producerId)),
  )
  return snap.docs.map((d) => mapProduct(d.id, d.data()))
}

export async function saveProduct(
  product: Omit<Product, 'id' | 'createdAt'> & { id?: string },
): Promise<Product> {
  if (isDemoMode) {
    if (product.id) {
      const full: Product = {
        ...(product as Product),
        id: product.id,
        createdAt: new Date().toISOString(),
      }
      demoUpsertProduct(full)
      return full
    }
    return demoCreateProduct(product)
  }

  const ref = product.id
    ? doc(db!, 'products', product.id)
    : doc(collection(db!, 'products'))
  const payload: Product = {
    id: ref.id,
    producerId: product.producerId,
    producerName: product.producerName,
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    stock: product.stock,
    active: product.active,
    imageUrl: product.imageUrl,
    createdAt: new Date().toISOString(),
  }
  await setDoc(ref, payload, { merge: true })
  return payload
}
