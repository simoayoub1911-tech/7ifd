import React, { useState } from 'react';
import { X, Layers, Trash2 } from 'lucide-react';
import { CEFRLevel, Deck, LanguageCode, SUPPORTED_LANGUAGES } from '../types';
import { useApp } from '../context/AppContext';

interface DeckEditorModalProps {
  existingDeck?: Deck;
  onSave: (deckData: any) => Promise<void>;
  onDelete?: (deckId: string) => Promise<void>;
  onClose: () => void;
}

export const DeckEditorModal: React.FC<DeckEditorModalProps> = ({
  existingDeck,
  onSave,
  onDelete,
  onClose,
}) => {
  const { t } = useApp();
  const [title, setTitle] = useState(existingDeck?.title || '');
  const [description, setDescription] = useState(existingDeck?.description || '');
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>(
    existingDeck?.targetLanguage || 'en'
  );
  const [nativeLanguage, setNativeLanguage] = useState<LanguageCode>(
    existingDeck?.nativeLanguage || 'ar'
  );
  const [level, setLevel] = useState<CEFRLevel>(existingDeck?.level || 'A1');
  const [color, setColor] = useState(existingDeck?.color || '#4f46e5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const colors = [
    '#4f46e5', // Indigo
    '#0284c7', // Sky
    '#059669', // Emerald
    '#d97706', // Amber
    '#e11d48', // Rose
    '#7c3aed', // Violet
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        targetLanguage,
        nativeLanguage,
        level,
        color,
        category: 'custom',
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
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative my-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              {existingDeck ? 'Edit Deck' : 'Create New Deck'}
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
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deck Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Travel Vocabulary B1"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you master in this deck?"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Native / Reference
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                CEFR Proficiency Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deck Theme Color
              </label>
              <div className="flex items-center gap-2 pt-1">
                {colors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
            {existingDeck && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirmingDelete) {
                    try {
                      setIsSubmitting(true);
                      await onDelete(existingDeck.id);
                      onClose();
                    } catch (err) {
                      console.error('Failed to delete deck:', err);
                    } finally {
                      setIsSubmitting(false);
                    }
                  } else {
                    setConfirmingDelete(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  confirmingDelete
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
                title={t('delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmingDelete ? 'Click again to confirm' : (t('delete') || 'Delete Deck')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
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
          </div>

        </form>
      </div>
    </div>
  );
};
