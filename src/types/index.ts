export type LanguageCode =
  | 'ar'
  | 'en'
  | 'fr'
  | 'es'
  | 'de'
  | 'pt'
  | 'zh-CN'
  | 'ja'
  | 'ko'
  | 'th'
  | 'hi';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type StudyMode = 'srs' | 'quiz' | 'listen' | 'cram' | 'match' | 'cloze' | 'spelling';

export interface LanguageMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageMeta> = {
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl', bcp47: 'ar-SA' },
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', bcp47: 'en-US' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', bcp47: 'fr-FR' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', bcp47: 'es-ES' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', bcp47: 'de-DE' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', dir: 'ltr', bcp47: 'pt-BR' },
  'zh-CN': { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳', dir: 'ltr', bcp47: 'zh-CN' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr', bcp47: 'ja-JP' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', dir: 'ltr', bcp47: 'ko-KR' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', dir: 'ltr', bcp47: 'th-TH' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr', bcp47: 'hi-IN' },
};

export interface SRSHistoryEntry {
  timestamp: string;
  rating: number; // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
}

export interface SRSState {
  interval: number; // days until next review
  repetition: number; // consecutive successful reviews
  easeFactor: number; // difficulty factor, default 2.5, min 1.3
  nextDueAt: string; // ISO 8601 timestamp
  lastReviewedAt?: string;
  history: SRSHistoryEntry[];
}

export interface Card {
  id: string;
  deckId: string;
  front: string; // The term or phrase
  back: string; // Primary translation
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  phonetic?: string;
  transliteration?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  notes?: string;
  tags?: string[];
  isBookmarked?: boolean;
  srsState: SRSState;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  targetLanguage: LanguageCode;
  nativeLanguage: LanguageCode;
  level?: CEFRLevel;
  category?: string;
  domainId?: string;
  icon?: string;
  color?: string;
  cardCount: number;
  dueCardCount: number;
  masteredCardCount: number;
  isSystemPack?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: 1 | 2 | 3 | 4;
  timestamp: string;
  reviewDurationMs?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  isGuest: boolean;
  avatarUrl?: string;
  accountType?: 'guest' | 'free';
  dailyGoal: number; // default e.g. 20
  streak: number;
  lastStudiedDate?: string;
  totalReviews: number;
  cardsLearned: number;
  preferredVoice: 'gemini' | 'native';
  geminiVoiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  interfaceLanguage: LanguageCode;
  bookmarkedCardIds: string[];
  lastSavedAt?: string;
  hasInitializedStarterPacks?: boolean;
}

export interface DomainMeta {
  id: string;
  titleEn: string;
  titleAr: string;
  titles: Partial<Record<LanguageCode, string>>;
  descriptionEn: string;
  descriptionAr: string;
  descriptions: Partial<Record<LanguageCode, string>>;
  icon: string;
  gradient: string;
  badgeColor: string;
}
