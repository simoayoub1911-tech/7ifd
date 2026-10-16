import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Card,
  Deck,
  StudyLog,
  UserProfile,
  LanguageCode,
  CEFRLevel,
} from '../types';
import {
  getAllDecks,
  getAllCards,
  saveDeck,
  saveCardsBatch,
  deleteDeck as dbDeleteDeck,
  saveCard as dbSaveCard,
  deleteCard as dbDeleteCard,
  getUserProfile,
  saveUserProfile,
  addStudyLog,
  getStudyLogs,
  DEFAULT_USER_PROFILE,
} from '../lib/storage/indexedDB';
import { calculateSM2, isCardDue, isCardMastered } from '../lib/srs/sm2';
import { getStarterPacks } from '../data/domainCardsProvider';
import { TRANSLATIONS, TranslationKey } from '../i18n/translations';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  syncUserProfileToCloud,
  syncDecksAndCardsToCloud,
  loadUserDataFromCloud,
  testFirestoreConnection,
  deleteDeckFromCloud,
  deleteCardFromCloud,
} from '../lib/firebase/config';

interface AppContextType {
  decks: Deck[];
  cards: Card[];
  profile: UserProfile;
  todayReviewsCount: number;
  isLoading: boolean;
  activeLanguage: LanguageCode;
  setActiveLanguage: (lang: LanguageCode) => void;
  syncStatus: 'saved' | 'saving' | 'offline';
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  createDeck: (deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardCount' | 'dueCardCount' | 'masteredCardCount'>) => Promise<Deck>;
  updateDeck: (deck: Deck) => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
  createCard: (cardData: Omit<Card, 'id' | 'srsState' | 'createdAt' | 'updatedAt'>) => Promise<Card>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  toggleBookmarkCard: (cardId: string) => Promise<void>;
  recordReview: (cardId: string, rating: 1 | 2 | 3 | 4) => Promise<void>;
  importDeckAndCards: (deck: Deck, cards: Card[]) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInFreeAccount: (email: string) => Promise<void>;
  registerFreeAccount: (data: { displayName: string; email: string; avatarUrl?: string }) => Promise<void>;
  signOutAccount: () => Promise<void>;
  saveAllThings: () => Promise<void>;
  t: (key: TranslationKey) => string;
  getDeckCards: (deckId: string) => Card[];
  getDeckDueCards: (deckId: string) => Card[];
  getAllDueCards: () => Card[];
  getBookmarkedCards: () => Card[];
  exportAllData: () => Promise<string>;
  importAllData: (jsonData: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [todayReviewsCount, setTodayReviewsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Translation helper across all 11 languages
  const t = (key: TranslationKey): string => {
    const lang = profile.interfaceLanguage || 'en';
    const langTranslations = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return langTranslations[key] || TRANSLATIONS.en[key] || key;
  };

  // Sync document dir attribute with interface language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRtl = profile.interfaceLanguage === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = profile.interfaceLanguage;
    }
  }, [profile.interfaceLanguage]);

  // Initial data loading & seeding
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        testFirestoreConnection();

        const [loadedProfile, loadedDecks, loadedCards, logs] = await Promise.all([
          getUserProfile(),
          getAllDecks(),
          getAllCards(),
          getStudyLogs(),
        ]);

        setProfile(loadedProfile);

        // Calculate today's reviews count
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysLogs = logs.filter((log) => log.timestamp.startsWith(todayStr));
        setTodayReviewsCount(todaysLogs.length);

        // If no decks exist and starter packs have never been initialized, seed them
        if (!loadedProfile.hasInitializedStarterPacks && loadedDecks.length === 0) {
          const starter = getStarterPacks(
            loadedProfile.interfaceLanguage === 'ar' ? 'en' : 'ar',
            loadedProfile.interfaceLanguage === 'ar' ? 'ar' : 'en'
          );
          await Promise.all([
            ...starter.decks.map((d) => saveDeck(d)),
            saveCardsBatch(starter.cards),
          ]);
          const initializedProfile: UserProfile = {
            ...loadedProfile,
            hasInitializedStarterPacks: true,
          };
          await saveUserProfile(initializedProfile);
          setProfile(initializedProfile);
          setDecks(starter.decks);
          setCards(starter.cards);
        } else {
          setDecks(loadedDecks);
          setCards(loadedCards);
        }
      } catch (err) {
        console.error('Error initializing 7ifd offline DB:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setSyncStatus('saving');
        try {
          const cloudData = await loadUserDataFromCloud();
          if (cloudData && cloudData.decks && cloudData.decks.length > 0) {
            // Merge with local state
            setDecks(cloudData.decks);
            setCards(cloudData.cards);
            await Promise.all([
              ...cloudData.decks.map((d) => saveDeck(d)),
              saveCardsBatch(cloudData.cards),
            ]);
          }

          const updatedProfile: UserProfile = {
            ...profile,
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Learner',
            email: fbUser.email || undefined,
            avatarUrl: fbUser.photoURL || '🌟',
            isGuest: false,
            accountType: 'free',
            lastSavedAt: new Date().toISOString(),
          };

          setProfile(updatedProfile);
          await saveUserProfile(updatedProfile);
          await syncUserProfileToCloud(updatedProfile);
          setSyncStatus('saved');
        } catch (err) {
          console.warn('Error loading cloud profile:', err);
          setSyncStatus('saved');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Recalculate deck counts
  const enrichedDecks = useMemo(() => {
    return decks.map((deck) => {
      const deckCards = cards.filter((c) => c.deckId === deck.id);
      const dueCards = deckCards.filter((c) => isCardDue(c));
      const masteredCards = deckCards.filter((c) => isCardMastered(c));
      return {
        ...deck,
        cardCount: deckCards.length,
        dueCardCount: dueCards.length,
        masteredCardCount: masteredCards.length,
      };
    });
  }, [decks, cards]);

  const getDeckCards = (deckId: string) => cards.filter((c) => c.deckId === deckId);
  const getDeckDueCards = (deckId: string) => cards.filter((c) => c.deckId === deckId && isCardDue(c));
  const getAllDueCards = () => cards.filter((c) => isCardDue(c));
  const getBookmarkedCards = () => cards.filter((c) => profile.bookmarkedCardIds?.includes(c.id));

  const createDeck = async (
    deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'cardCount' | 'dueCardCount' | 'masteredCardCount'>
  ): Promise<Deck> => {
    setSyncStatus('saving');
    const newDeck: Deck = {
      ...deckData,
      id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardCount: 0,
      dueCardCount: 0,
      masteredCardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveDeck(newDeck);
    const updatedDecks = [newDeck, ...decks];
    setDecks(updatedDecks);

    if (!profile.isGuest && auth.currentUser) {
      syncDecksAndCardsToCloud(updatedDecks, cards);
    }
    setSyncStatus('saved');
    return newDeck;
  };

  const updateDeck = async (deck: Deck) => {
    setSyncStatus('saving');
    const updated = { ...deck, updatedAt: new Date().toISOString() };
    await saveDeck(updated);
    const updatedDecks = decks.map((d) => (d.id === deck.id ? updated : d));
    setDecks(updatedDecks);

    if (!profile.isGuest && auth.currentUser) {
      syncDecksAndCardsToCloud(updatedDecks, cards);
    }
    setSyncStatus('saved');
  };

  const deleteDeck = async (deckId: string) => {
    setSyncStatus('saving');
    try {
      // 1. Delete from local IndexedDB
      await dbDeleteDeck(deckId);

      // 2. Delete from cloud Firestore if authenticated
      if (!profile.isGuest && auth.currentUser) {
        await deleteDeckFromCloud(deckId);
      }

      // 3. Update React state immediately
      const updatedDecks = decks.filter((d) => d.id !== deckId);
      const updatedCards = cards.filter((c) => c.deckId !== deckId);
      setDecks(updatedDecks);
      setCards(updatedCards);

      // 4. Ensure hasInitializedStarterPacks is marked true so deleted decks are not re-seeded
      if (!profile.hasInitializedStarterPacks) {
        const updatedProfile: UserProfile = { ...profile, hasInitializedStarterPacks: true };
        setProfile(updatedProfile);
        await saveUserProfile(updatedProfile);
        if (!profile.isGuest && auth.currentUser) {
          syncUserProfileToCloud(updatedProfile);
        }
      }

      setSyncStatus('saved');
    } catch (err) {
      console.error('Failed to delete deck:', err);
      setSyncStatus('saved');
      throw err;
    }
  };

  const createCard = async (
    cardData: Omit<Card, 'id' | 'srsState' | 'createdAt' | 'updatedAt'>
  ): Promise<Card> => {
    setSyncStatus('saving');
    const { createDefaultSRSState } = await import('../lib/srs/sm2');
    const newCard: Card = {
      ...cardData,
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      srsState: createDefaultSRSState(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbSaveCard(newCard);
    const updatedCards = [...cards, newCard];
    setCards(updatedCards);

    if (!profile.isGuest && auth.currentUser) {
      syncDecksAndCardsToCloud(decks, updatedCards);
    }
    setSyncStatus('saved');
    return newCard;
  };

  const updateCard = async (card: Card) => {
    setSyncStatus('saving');
    const updated = { ...card, updatedAt: new Date().toISOString() };
    await dbSaveCard(updated);
    const updatedCards = cards.map((c) => (c.id === card.id ? updated : c));
    setCards(updatedCards);

    if (!profile.isGuest && auth.currentUser) {
      syncDecksAndCardsToCloud(decks, updatedCards);
    }
    setSyncStatus('saved');
  };

  const deleteCard = async (cardId: string) => {
    setSyncStatus('saving');
    try {
      const targetCard = cards.find((c) => c.id === cardId);
      await dbDeleteCard(cardId);
      const updatedCards = cards.filter((c) => c.id !== cardId);
      setCards(updatedCards);

      if (!profile.isGuest && auth.currentUser && targetCard) {
        await deleteCardFromCloud(targetCard.deckId, cardId);
      }
      setSyncStatus('saved');
    } catch (err) {
      console.error('Failed to delete card:', err);
      setSyncStatus('saved');
      throw err;
    }
  };

  const toggleBookmarkCard = async (cardId: string) => {
    const isBookmarked = profile.bookmarkedCardIds?.includes(cardId);
    const updatedIds = isBookmarked
      ? profile.bookmarkedCardIds.filter((id) => id !== cardId)
      : [...(profile.bookmarkedCardIds || []), cardId];

    await updateProfile({ bookmarkedCardIds: updatedIds });
  };

  // Record an SM-2 review rating (1 = Again, 2 = Hard, 3 = Good, 4 = Easy)
  const recordReview = async (cardId: string, rating: 1 | 2 | 3 | 4) => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    setSyncStatus('saving');
    const updatedSRS = calculateSM2(targetCard.srsState, rating);
    const updatedCard: Card = {
      ...targetCard,
      srsState: updatedSRS,
      updatedAt: new Date().toISOString(),
    };

    await dbSaveCard(updatedCard);
    const updatedCards = cards.map((c) => (c.id === cardId ? updatedCard : c));
    setCards(updatedCards);

    // Create study log
    const log: StudyLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      cardId,
      deckId: targetCard.deckId,
      rating,
      timestamp: new Date().toISOString(),
    };
    await addStudyLog(log);
    setTodayReviewsCount((prev) => prev + 1);

    // Update streak and profile stats
    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = profile.streak || 1;

    if (profile.lastStudiedDate) {
      const lastDate = new Date(profile.lastStudiedDate);
      const currentDate = new Date(todayStr);
      const diffDays = Math.round(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    const updatedProfile: UserProfile = {
      ...profile,
      streak: newStreak,
      lastStudiedDate: todayStr,
      totalReviews: (profile.totalReviews || 0) + 1,
      cardsLearned: isCardMastered(updatedCard) ? profile.cardsLearned + 1 : profile.cardsLearned,
      lastSavedAt: new Date().toISOString(),
    };

    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);

    // Sync to Firestore if authenticated
    if (!profile.isGuest && auth.currentUser) {
      syncUserProfileToCloud(updatedProfile);
      syncDecksAndCardsToCloud(decks, updatedCards);
    }

    setSyncStatus('saved');
  };

  const importDeckAndCards = async (deck: Deck, newCards: Card[]) => {
    setSyncStatus('saving');
    const importedDeckId = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedDeck: Deck = {
      ...deck,
      id: importedDeckId,
      isSystemPack: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cardCount: newCards.length,
      dueCardCount: newCards.length,
      masteredCardCount: 0,
    };

    const clonedCards: Card[] = newCards.map((c, index) => ({
      ...c,
      id: `card_${importedDeckId}_${index + 1}`,
      deckId: importedDeckId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await Promise.all([saveDeck(clonedDeck), saveCardsBatch(clonedCards)]);

    const updatedDecks = [clonedDeck, ...decks];
    const updatedCards = [...cards, ...clonedCards];
    setDecks(updatedDecks);
    setCards(updatedCards);

    if (!profile.isGuest && auth.currentUser) {
      syncDecksAndCardsToCloud(updatedDecks, updatedCards);
    }

    setSyncStatus('saved');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setSyncStatus('saving');
    const updated = {
      ...profile,
      ...updates,
      lastSavedAt: new Date().toISOString(),
    };
    setProfile(updated);
    await saveUserProfile(updated);

    if (!profile.isGuest && auth.currentUser) {
      syncUserProfileToCloud(updated);
    }
    setSyncStatus('saved');
  };

  // Firebase Google Sign In
  const signInWithGoogle = async () => {
    setSyncStatus('saving');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const updatedProfile: UserProfile = {
        ...profile,
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Learner',
        email: fbUser.email || undefined,
        avatarUrl: fbUser.photoURL || '🌟',
        isGuest: false,
        accountType: 'free',
        lastSavedAt: new Date().toISOString(),
      };

      setProfile(updatedProfile);
      await saveUserProfile(updatedProfile);
      await syncUserProfileToCloud(updatedProfile);
      await syncDecksAndCardsToCloud(decks, cards);
      setSyncStatus('saved');
    } catch (err: any) {
      console.warn('Google sign-in cancelled or failed:', err);
      setSyncStatus('saved');
      throw err;
    }
  };

  // Local Free account registration
  const registerFreeAccount = async (data: { displayName: string; email: string; avatarUrl?: string }) => {
    setSyncStatus('saving');
    const uid = `user_${Date.now()}`;
    const newProfile: UserProfile = {
      ...profile,
      uid,
      displayName: data.displayName,
      email: data.email,
      avatarUrl: data.avatarUrl || '🦉',
      isGuest: false,
      accountType: 'free',
      lastSavedAt: new Date().toISOString(),
    };

    await saveUserProfile(newProfile);
    setProfile(newProfile);
    setSyncStatus('saved');
  };

  const signInFreeAccount = async (email: string) => {
    setSyncStatus('saving');
    const existing = await getUserProfile(email);
    if (existing && !existing.isGuest) {
      setProfile(existing);
    } else {
      await registerFreeAccount({
        displayName: email.split('@')[0],
        email,
      });
    }
    setSyncStatus('saved');
  };

  const signOutAccount = async () => {
    setSyncStatus('saving');
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }

    const guestProfile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      lastSavedAt: new Date().toISOString(),
    };
    await saveUserProfile(guestProfile);
    setProfile(guestProfile);
    setSyncStatus('saved');
  };

  const saveAllThings = async () => {
    setSyncStatus('saving');
    const updatedProfile = { ...profile, lastSavedAt: new Date().toISOString() };
    await Promise.all([
      saveUserProfile(updatedProfile),
      ...decks.map((d) => saveDeck(d)),
      saveCardsBatch(cards),
    ]);

    if (!profile.isGuest && auth.currentUser) {
      await syncUserProfileToCloud(updatedProfile);
      await syncDecksAndCardsToCloud(decks, cards);
    }

    setTimeout(() => {
      setSyncStatus('saved');
    }, 400);
  };

  // Data Portability (JSON Export & Import)
  const exportAllData = async (): Promise<string> => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      profile,
      decks,
      cards,
    };
    return JSON.stringify(data, null, 2);
  };

  const importAllData = async (jsonData: string): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.decks || !parsed.cards) {
        return { success: false, message: 'Invalid 7ifd backup format' };
      }

      await Promise.all([
        ...parsed.decks.map((d: Deck) => saveDeck(d)),
        saveCardsBatch(parsed.cards),
      ]);

      if (parsed.profile) {
        await saveUserProfile(parsed.profile);
        setProfile(parsed.profile);
      }

      setDecks(parsed.decks);
      setCards(parsed.cards);

      if (!profile.isGuest && auth.currentUser) {
        syncDecksAndCardsToCloud(parsed.decks, parsed.cards);
      }

      return {
        success: true,
        message: `Successfully imported ${parsed.decks.length} decks and ${parsed.cards.length} cards!`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to parse JSON file' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        decks: enrichedDecks,
        cards,
        profile,
        todayReviewsCount,
        isLoading,
        activeLanguage,
        setActiveLanguage,
        syncStatus,
        isAuthModalOpen,
        setIsAuthModalOpen,
        createDeck,
        updateDeck,
        deleteDeck,
        createCard,
        updateCard,
        deleteCard,
        toggleBookmarkCard,
        recordReview,
        importDeckAndCards,
        updateProfile,
        signInWithGoogle,
        signInFreeAccount,
        registerFreeAccount,
        signOutAccount,
        saveAllThings,
        t,
        getDeckCards,
        getDeckDueCards,
        getAllDueCards,
        getBookmarkedCards,
        exportAllData,
        importAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
