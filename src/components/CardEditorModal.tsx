import React, { useState } from 'react';
import { X, Sparkles, Wand2, Volume2 } from 'lucide-react';
import { Card, LanguageCode, SUPPORTED_LANGUAGES } from '../types';
import { searchOfflineDictionary } from '../lib/ai/dictionary';
import { useApp } from '../context/AppContext';

interface CardEditorModalProps {
  deckId: string;
  defaultTargetLang: LanguageCode;
  defaultNativeLang: LanguageCode;
  existingCard?: Card;
  onSave: (cardData: Omit<Card, 'id' | 'srsState' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  deckId,
  defaultTargetLang,
  defaultNativeLang,
  existingCard,
  onSave,
  onClose,
}) => {
  const { t } = useApp();
  const [front, setFront] = useState(existingCard?.front || '');
  const [back, setBack] = useState(existingCard?.back || '');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    existingCard?.targetLanguage || defaultTargetLang
  );
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>(
    existingCard?.nativeLanguage || defaultNativeLang
  );
  const [phonetic, setPhonetic] = useState(existingCard?.phonetic || '');
  const [transliteration, setTransliteration] = useState(existingCard?.transliteration || '');
  const [exampleSentence, setExampleSentence] = useState(existingCard?.exampleSentence || '');
  const [exampleTranslation, setExampleTranslation] = useState(
    existingCard?.exampleTranslation || ''
  );
  const [tagsInput, setTagsInput] = useState(existingCard?.tags?.join(', ') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestionFound, setSuggestionFound] = useState<boolean | null>(null);

  // Auto-fill from offline dictionary
  const handleAutoFill = () => {
    if (!front.trim()) return;
    const match = searchOfflineDictionary(front, targetLanguage, nativeLanguage);
    if (match) {
      setBack(match.translations[nativeLanguage] || match.translations.en || '');
      if (match.phonetic) setPhonetic(match.phonetic);
      if (match.transliteration) setTransliteration(match.transliteration);
      if (match.examples[targetLanguage]) {
        setExampleSentence(match.examples[targetLanguage]);
      }
      if (match.examples[nativeLanguage]) {
        setExampleTranslation(match.examples[nativeLanguage]);
      }
      if (match.tags && match.tags.length > 0) {
        setTagsInput(match.tags.join(', '));
      }
      setSuggestionFound(true);
    } else {
      setSuggestionFound(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    try {
      setIsSubmitting(true);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        deckId,
        front: front.trim(),
        back: back.trim(),
        targetLanguage,
        nativeLanguage,
        phonetic: phonetic.trim() || undefined,
        transliteration: transliteration.trim() || undefined,
        exampleSentence: exampleSentence.trim() || undefined,
        exampleTranslation: exampleTranslation.trim() || undefined,
        tags,
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative my-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {existingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Front / Term */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Front (Term / Word / Phrase) *
              </label>
              
              <button
                type="button"
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{t('autoFillDictionary')}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={front}
              onChange={(e) => {
                setFront(e.target.value);
                setSuggestionFound(null);
              }}
              placeholder="e.g. مرحباً / Bonjour / Hello"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {suggestionFound === false && (
              <p className="text-[11px] text-amber-400 mt-1">
                Term not found in offline quick lexicon. You can enter translations manually.
              </p>
            )}
            {suggestionFound === true && (
              <p className="text-[11px] text-emerald-400 mt-1">
                ✓ Auto-filled translations and examples from verified offline dictionary!
              </p>
            )}
          </div>

          {/* Back / Translation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Back (Primary Translation) *
            </label>
            <input
              type="text"
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. Hello / مرحباً"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Phonetic & Transliteration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                IPA Phonetic (Optional)
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/həˈloʊ/ or /mar.ħa.baː/"
                className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Transliteration (Optional)
              </label>
              <input
                type="text"
                value={transliteration}
                onChange={(e) => setTransliteration(e.target.value)}
                placeholder="e.g. Marhaban"
                className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Contextual Example Sentence */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Example Sentence (Optional)
            </label>
            <textarea
              rows={2}
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="Contextual sentence demonstrating natural usage..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Example Translation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Example Translation (Optional)
            </label>
            <textarea
              rows={2}
              value={exampleTranslation}
              onChange={(e) => setExampleTranslation(e.target.value)}
              placeholder="Translation of the example sentence..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. greeting, essential, A1"
              className="w-full px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-sm shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : t('save')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
