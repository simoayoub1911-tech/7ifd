import { LanguageCode } from '../../types';

// By default, AI features are disabled to guarantee 100% offline out-of-the-box reliability.
export const ENABLE_AI_FEATURES = false;

export interface CardSuggestion {
  term: string;
  translation: string;
  phonetic: string;
  transliteration?: string;
  exampleSentence: string;
  exampleTranslation: string;
  tags: string[];
}
