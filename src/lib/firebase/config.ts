import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { Card, Deck, UserProfile } from '../../types';

export const app = initializeApp(firebaseConfig);
// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot according to skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Cloud sync functions for authenticated users
export async function syncUserProfileToCloud(profile: UserProfile): Promise<void> {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, {
      uid: auth.currentUser.uid,
      displayName: profile.displayName,
      email: profile.email || '',
      avatarUrl: profile.avatarUrl || '🦉',
      dailyGoal: profile.dailyGoal || 20,
      streak: profile.streak || 0,
      totalReviews: profile.totalReviews || 0,
      cardsLearned: profile.cardsLearned || 0,
      preferredVoice: profile.preferredVoice || 'gemini',
      geminiVoiceName: profile.geminiVoiceName || 'Puck',
      interfaceLanguage: profile.interfaceLanguage || 'en',
      bookmarkedCardIds: profile.bookmarkedCardIds || [],
      lastStudiedDate: profile.lastStudiedDate || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function syncDecksAndCardsToCloud(decks: Deck[], cards: Card[]): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const batch = writeBatch(db);

    // Sync decks
    decks.forEach((deck) => {
      const deckRef = doc(db, 'users', uid, 'decks', deck.id);
      batch.set(deckRef, {
        id: deck.id,
        ownerId: uid,
        title: deck.title,
        description: deck.description || '',
        targetLanguage: deck.targetLanguage,
        nativeLanguage: deck.nativeLanguage,
        level: deck.level,
        category: deck.category || '',
        domainId: deck.domainId || '',
        color: deck.color || 'indigo',
        cardCount: deck.cardCount || 0,
        dueCardCount: deck.dueCardCount || 0,
        masteredCardCount: deck.masteredCardCount || 0,
        createdAt: deck.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    // Sync cards
    cards.forEach((card) => {
      const cardRef = doc(db, 'users', uid, 'decks', card.deckId, 'cards', card.id);
      batch.set(cardRef, {
        id: card.id,
        deckId: card.deckId,
        ownerId: uid,
        front: card.front,
        back: card.back,
        targetLanguage: card.targetLanguage,
        nativeLanguage: card.nativeLanguage,
        phonetic: card.phonetic || '',
        transliteration: card.transliteration || '',
        exampleSentence: card.exampleSentence || '',
        exampleTranslation: card.exampleTranslation || '',
        tags: card.tags || [],
        isBookmarked: !!card.isBookmarked,
        srsState: card.srsState,
        createdAt: card.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}/decks_batch`);
  }
}

export async function loadUserDataFromCloud(): Promise<{
  profile: Partial<UserProfile> | null;
  decks: Deck[];
  cards: Card[];
} | null> {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDocFromServer(userDocRef).catch(() => null);
    const profile = userSnap?.exists() ? (userSnap.data() as UserProfile) : null;

    const decksSnap = await getDocs(collection(db, 'users', uid, 'decks'));
    const decks: Deck[] = [];
    const cards: Card[] = [];

    for (const dDoc of decksSnap.docs) {
      decks.push(dDoc.data() as Deck);
      const cardsSnap = await getDocs(collection(db, 'users', uid, 'decks', dDoc.id, 'cards'));
      cardsSnap.docs.forEach((cDoc) => cards.push(cDoc.data() as Card));
    }

    return { profile, decks, cards };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function deleteDeckFromCloud(deckId: string): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const cardsSnap = await getDocs(collection(db, 'users', uid, 'decks', deckId, 'cards')).catch(() => null);
    const batch = writeBatch(db);

    if (cardsSnap && !cardsSnap.empty) {
      cardsSnap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
    }

    const deckRef = doc(db, 'users', uid, 'decks', deckId);
    batch.delete(deckRef);

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/decks/${deckId}`);
  }
}

export async function deleteCardFromCloud(deckId: string, cardId: string): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const cardRef = doc(db, 'users', uid, 'decks', deckId, 'cards', cardId);
    await deleteDoc(cardRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}/decks/${deckId}/cards/${cardId}`);
  }
}

export { signInWithPopup, fbSignOut, onAuthStateChanged, testConnection, testConnection as testFirestoreConnection };
export type { FirebaseUser };
