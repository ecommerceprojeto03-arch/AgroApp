import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db, isDemoMode } from '../lib/firebase'
import type { Product, UserProfile } from '../types'

const SAMPLE_CATALOG: Omit<Product, 'id' | 'producerId' | 'producerName' | 'createdAt'>[] = [
  {
    name: 'Banana',
    description: 'Banana nanica madura, colhida na semana.',
    price: 6,
    unit: 'kg',
    stock: 80,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1571771894821-ce9b6d11d85e?w=600&q=80',
  },
  {
    name: 'Tomate',
    description: 'Tomate italiano fresco para saladas e molhos.',
    price: 8,
    unit: 'kg',
    stock: 50,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1546470427-e212b9d31075?w=600&q=80',
  },
  {
    name: 'Alface',
    description: 'Alface crespa hidropônica, sem agrotóxicos.',
    price: 3.5,
    unit: 'unidade',
    stock: 40,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&q=80',
  },
  {
    name: 'Cenoura',
    description: 'Cenoura orgânica crocante e doce.',
    price: 5,
    unit: 'kg',
    stock: 60,
    active: true,
    imageUrl:
      'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80',
  },
]

/** Popula produtos de exemplo para o produtor logado (Firestore). */
export async function seedProducerCatalog(producer: UserProfile): Promise<number> {
  if (isDemoMode || !db) {
    throw new Error('Seed Firebase só funciona com VITE_DEMO_MODE=false.')
  }
  if (producer.role !== 'producer') {
    throw new Error('Apenas produtores podem popular o catálogo.')
  }

  const existing = await getDocs(
    query(collection(db, 'products'), where('producerId', '==', producer.uid)),
  )
  if (!existing.empty) {
    return 0
  }

  const farm = producer.farmName || producer.name
  const now = new Date().toISOString()
  let created = 0

  for (const sample of SAMPLE_CATALOG) {
    const ref = doc(collection(db, 'products'))
    const product: Product = {
      id: ref.id,
      producerId: producer.uid,
      producerName: farm,
      createdAt: now,
      ...sample,
    }
    await setDoc(ref, product)
    created += 1
  }

  return created
}
