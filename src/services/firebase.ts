/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BudgetData, CommitmentItem, PastExpenseItem } from '../types/finance';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set browser local persistence for Auth:', err);
});

// CRITICAL: Must pass database ID as second parameter
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting.');
    }
  }
}
testConnection();

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Firestore Realtime Subscriptions
export function subscribeToBudgetPlan(
  userId: string,
  onData: (plan: BudgetData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const planDocRef = doc(db, 'users', userId, 'budgetPlan', 'current');
  return onSnapshot(
    planDocRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as BudgetData);
      } else {
        onData(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${userId}/budgetPlan/current`);
      onError?.(err);
    }
  );
}

export function subscribeToCommitments(
  userId: string,
  onData: (commitments: CommitmentItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'commitments');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: CommitmentItem[] = [];
      snap.forEach((d) => items.push(d.data() as CommitmentItem));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/commitments`);
      onError?.(err);
    }
  );
}

export function subscribeToExpenses(
  userId: string,
  onData: (expenses: PastExpenseItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'expenses');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: PastExpenseItem[] = [];
      snap.forEach((d) => items.push(d.data() as PastExpenseItem));
      // Sort chronologically
      items.sort((a, b) => a.day - b.day);
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/expenses`);
      onError?.(err);
    }
  );
}

// Save complete plan after Onboarding / Review
export async function saveUserPlanFull(
  userId: string,
  budget: BudgetData,
  commitments: CommitmentItem[],
  expenses: PastExpenseItem[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Save user profile
  const userRef = doc(db, 'users', userId);
  batch.set(
    userRef,
    {
      email: auth.currentUser?.email || '',
      displayName: auth.currentUser?.displayName || '',
      currency: budget.currency || 'INR',
      timezone: budget.timezone || 'Asia/Kolkata',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // 2. Save active plan
  const planRef = doc(db, 'users', userId, 'budgetPlan', 'current');
  batch.set(planRef, {
    ...budget,
    userId,
    isOnboardingComplete: true,
    updatedAt: new Date().toISOString(),
  });

  // 3. Save commitments
  for (const c of commitments) {
    const cRef = doc(db, 'users', userId, 'commitments', c.id);
    batch.set(cRef, {
      ...c,
      userId,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Save expenses
  for (const e of expenses) {
    const eRef = doc(db, 'users', userId, 'expenses', e.id);
    batch.set(eRef, {
      ...e,
      userId,
      createdAt: new Date().toISOString(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/batch_plan`);
  }
}

export async function saveUserBudget(userId: string, budget: BudgetData): Promise<void> {
  const planRef = doc(db, 'users', userId, 'budgetPlan', 'current');
  try {
    await setDoc(
      planRef,
      {
        ...budget,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/budgetPlan/current`);
  }
}

// Transactions collection subscriptions and mutations
export function subscribeToTransactions(
  userId: string,
  onData: (transactions: any[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'transactions');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push(d.data()));
      items.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/transactions`);
      onError?.(err);
    }
  );
}

export async function saveTransaction(userId: string, tx: any): Promise<void> {
  const txRef = doc(db, 'users', userId, 'transactions', tx.id);
  try {
    await setDoc(txRef, {
      ...tx,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/transactions/${tx.id}`);
  }
}

export async function deleteTransaction(userId: string, txId: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  const txRef = doc(db, 'users', userId, 'transactions', txId);
  try {
    await deleteDoc(txRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/transactions/${txId}`);
  }
}

// ==========================================
// PHASE 3: ROADMAP & AI INSIGHTS FIRESTORE
// ==========================================

export function subscribeToRoadmap(
  userId: string,
  onData: (items: any[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'users', userId, 'roadmap');
  return onSnapshot(
    colRef,
    (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push(d.data()));
      // Sort: high priority first, then timeframe
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/roadmap`);
      onError?.(err);
    }
  );
}

export async function saveRoadmapItem(userId: string, item: any): Promise<void> {
  const stepRef = doc(db, 'users', userId, 'roadmap', item.id);
  try {
    await setDoc(stepRef, {
      ...item,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/roadmap/${item.id}`);
  }
}

export async function saveFullRoadmap(userId: string, items: any[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    const stepRef = doc(db, 'users', userId, 'roadmap', item.id);
    batch.set(stepRef, {
      ...item,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/batch_roadmap`);
  }
}

export async function toggleRoadmapItemCompleted(userId: string, stepId: string, isCompleted: boolean): Promise<void> {
  const stepRef = doc(db, 'users', userId, 'roadmap', stepId);
  try {
    await setDoc(stepRef, { isCompleted, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/roadmap/${stepId}`);
  }
}

export async function saveAICoachInsight(userId: string, insight: any): Promise<void> {
  const id = insight.id || 'latest';
  const insightRef = doc(db, 'users', userId, 'insights', id);
  try {
    await setDoc(insightRef, {
      ...insight,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/insights/${id}`);
  }
}

// Gamification Profile sync
export function subscribeToGamificationProfile(
  userId: string,
  onData: (profile: any | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const profileRef = doc(db, 'users', userId, 'gamification', 'profile');
  return onSnapshot(
    profileRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      } else {
        onData(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${userId}/gamification/profile`);
      onError?.(err);
    }
  );
}

export async function saveGamificationProfileToFirestore(userId: string, profile: any): Promise<void> {
  const profileRef = doc(db, 'users', userId, 'gamification', 'profile');
  try {
    await setDoc(
      profileRef,
      {
        ...profile,
        userId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/gamification/profile`);
  }
}

// Legal Consent Audit Trail
export async function recordUserConsent(
  userId: string,
  privacyVersion: string,
  termsVersion: string
): Promise<void> {
  const consentRef = doc(db, 'users', userId, 'consents', `legal_v${privacyVersion.replace(/\./g, '_')}`);
  try {
    await setDoc(
      consentRef,
      {
        userId,
        privacyPolicyVersion: privacyVersion,
        termsVersion: termsVersion,
        acceptedAt: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Could not record legal consent event:', error);
  }
}


