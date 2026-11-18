import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isDemoMode } from '../lib/firebase'
import {
  demoGetSession,
  demoLogin,
  demoRegister,
  demoSetSession,
  ensureDemoSeed,
} from '../lib/demoStore'
import { normalizeRole } from '../lib/roles'
import type { UserProfile, UserRole } from '../types'

/** Firestore rejeita `undefined` — só inclui campos com valor. */
function buildProfile(data: {
  uid: string
  email: string
  name: string
  role: UserRole
  phone?: string
  farmName?: string
}): UserProfile {
  const profile: UserProfile = {
    uid: data.uid,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: new Date().toISOString(),
  }
  if (data.phone?.trim()) profile.phone = data.phone.trim()
  if (data.role === 'producer') {
    profile.farmName = data.farmName?.trim() || data.name
  }
  return profile
}

export class ProfileIncompleteError extends Error {
  readonly uid: string
  readonly email: string

  constructor(uid: string, email: string) {
    super('PROFILE_INCOMPLETE')
    this.name = 'ProfileIncompleteError'
    this.uid = uid
    this.email = email
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isDemoMode) {
    ensureDemoSeed()
    const session = demoGetSession()
    return session?.uid === uid ? session : null
  }
  const snap = await getDoc(doc(db!, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  const role = normalizeRole(data.role)
  if (!role) return null
  return { ...data, uid, role } as UserProfile
}

export async function login(email: string, password: string): Promise<UserProfile> {
  if (isDemoMode) return demoLogin(email, password)

  const cred = await signInWithEmailAndPassword(auth!, email, password)
  const profile = await getUserProfile(cred.user.uid)
  if (!profile) {
    throw new ProfileIncompleteError(
      cred.user.uid,
      cred.user.email ?? email,
    )
  }
  return profile
}

/** Completa o perfil no Firestore para usuários criados só no Authentication. */
export async function completeProfile(data: {
  uid: string
  email: string
  name: string
  role: UserRole
  phone?: string
  farmName?: string
}): Promise<UserProfile> {
  if (isDemoMode) {
    throw new Error('completeProfile não se aplica ao modo demo.')
  }

  const profile = buildProfile(data)
  await setDoc(doc(db!, 'users', data.uid), profile)
  return profile
}

export async function register(data: {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  farmName?: string
}): Promise<UserProfile> {
  if (isDemoMode) return demoRegister(data)

  const cred = await createUserWithEmailAndPassword(auth!, data.email, data.password)
  const profile = buildProfile({
    uid: cred.user.uid,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone,
    farmName: data.farmName,
  })
  await setDoc(doc(db!, 'users', cred.user.uid), profile)
  return profile
}

/** Atualiza dados pessoais. O papel (role) é imutável após o cadastro. */
export async function updateProfile(
  current: UserProfile,
  data: {
    name: string
    phone?: string
    farmName?: string
  },
): Promise<UserProfile> {
  const profile = buildProfile({
    uid: current.uid,
    email: current.email,
    name: data.name,
    role: current.role,
    phone: data.phone,
    farmName: data.farmName,
  })
  profile.createdAt = current.createdAt || profile.createdAt

  if (isDemoMode) {
    ensureDemoSeed()
    const raw = localStorage.getItem('agrotech_users')
    const users = raw ? (JSON.parse(raw) as UserProfile[]) : []
    const idx = users.findIndex((u) => u.uid === current.uid)
    if (idx >= 0) users[idx] = profile
    else users.push(profile)
    localStorage.setItem('agrotech_users', JSON.stringify(users))
    demoSetSession(profile)
    return profile
  }

  await setDoc(doc(db!, 'users', current.uid), profile)
  return profile
}

export async function logout(): Promise<void> {
  if (isDemoMode) {
    demoSetSession(null)
    return
  }
  await signOut(auth!)
}

export function subscribeAuth(
  callback: (user: UserProfile | null) => void,
): () => void {
  if (isDemoMode) {
    ensureDemoSeed()
    callback(demoGetSession())
    const handler = () => callback(demoGetSession())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }

  return onAuthStateChanged(auth!, async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      callback(null)
      return
    }
    const profile = await getUserProfile(firebaseUser.uid)
    callback(profile)
  })
}

export function getAuthUser(): User | null {
  if (isDemoMode) return null
  return auth?.currentUser ?? null
}
