import { Card, Deck, StudyLog, UserProfile } from '../../types';

const DB_NAME = '7ifd_offline_storage_v1';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('decks')) {
        db.createObjectStore('decks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cards')) {
        const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardStore.createIndex('deckId', 'deckId', { unique: false });
        cardStore.createIndex('targetLanguage', 'targetLanguage', { unique: false });
      }

      if (!db.objectStoreNames.contains('study_logs')) {
        const logStore = db.createObjectStore('study_logs', { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
        logStore.createIndex('deckId', 'deckId', { unique: false });
      }

      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'uid' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper to run transaction
async function executeTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);

    tx.oncomplete = () => {
      if (request) {
        resolve(request.result);
      } else {
        resolve(undefined as unknown as T);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Decks
export async function getAllDecks(): Promise<Deck[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('decks', 'readonly');
    const store = tx.objectStore('decks');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDeck(deck: Deck): Promise<void> {
  await executeTransaction('decks', 'readwrite', (store) => store.put(deck));
}

export async function deleteDeck(deckId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(['decks', 'cards', 'study_logs'], 'readwrite');
      const deckStore = tx.objectStore('decks');
      const cardStore = tx.objectStore('cards');
      const logStore = tx.objectStore('study_logs');
      const cardIndex = cardStore.index('deckId');
      const logIndex = logStore.index('deckId');

      // Delete the deck record
      deckStore.delete(deckId);

      // Iterate and delete all cards in this deck using cursor
      const cardCursorReq = cardIndex.openCursor(IDBKeyRange.only(deckId));
      cardCursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Also remove associated study logs
      const logCursorReq = logIndex.openCursor(IDBKeyRange.only(deckId));
      logCursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Delete deck transaction aborted'));
    } catch (err) {
      reject(err);
    }
  });
}

// Cards
export async function getAllCards(): Promise<Card[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const store = tx.objectStore('cards');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getCardsByDeckId(deckId: string): Promise<Card[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readonly');
    const store = tx.objectStore('cards');
    const index = store.index('deckId');
    const request = index.getAll(deckId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCard(card: Card): Promise<void> {
  await executeTransaction('cards', 'readwrite', (store) => store.put(card));
}

export async function saveCardsBatch(cards: Card[]): Promise<void> {
  if (cards.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cards', 'readwrite');
    const store = tx.objectStore('cards');
    cards.forEach((card) => store.put(card));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await executeTransaction('cards', 'readwrite', (store) => store.delete(cardId));
}

// Study Logs
export async function getStudyLogs(): Promise<StudyLog[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('study_logs', 'readonly');
    const store = tx.objectStore('study_logs');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function addStudyLog(log: StudyLog): Promise<void> {
  await executeTransaction('study_logs', 'readwrite', (store) => store.put(log));
}

// Profile
const GUEST_UID = 'guest_user_local';

export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: GUEST_UID,
  displayName: 'Polyglot Learner',
  isGuest: true,
  accountType: 'guest',
  dailyGoal: 20,
  streak: 1,
  lastStudiedDate: new Date().toISOString().split('T')[0],
  totalReviews: 0,
  cardsLearned: 0,
  preferredVoice: 'gemini',
  geminiVoiceName: 'Puck',
  interfaceLanguage: 'en',
  bookmarkedCardIds: [],
  lastSavedAt: new Date().toISOString(),
  hasInitializedStarterPacks: false,
};

export async function getUserProfile(uid: string = GUEST_UID): Promise<UserProfile> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profile', 'readonly');
    const store = tx.objectStore('profile');
    const request = store.get(uid);
    request.onsuccess = () => {
      if (request.result) {
        resolve({
          ...DEFAULT_USER_PROFILE,
          ...request.result,
          bookmarkedCardIds: request.result.bookmarkedCardIds || [],
        });
      } else {
        saveUserProfile(DEFAULT_USER_PROFILE).then(() => resolve(DEFAULT_USER_PROFILE));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const updated = {
    ...profile,
    lastSavedAt: new Date().toISOString(),
  };
  await executeTransaction('profile', 'readwrite', (store) => store.put(updated));
}
