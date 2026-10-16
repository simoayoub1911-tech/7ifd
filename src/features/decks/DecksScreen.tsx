import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Search,
  Flame,
  Award,
  Layers,
  Sparkles,
  Trash2,
  Star,
  CheckCircle2,
  Brain,
  ListOrdered,
  Headphones,
  Zap,
  AlertTriangle,
  AlertCircle,
  Edit3,
  X,
  Loader2,
} from 'lucide-react';
import { Deck, Card, StudyMode, SUPPORTED_LANGUAGES } from '../../types';
import { useApp } from '../../context/AppContext';
import { StudySessionModal } from '../study/StudySessionModal';
import { CardEditorModal } from '../../components/CardEditorModal';
import { DeckEditorModal } from '../../components/DeckEditorModal';

interface DecksScreenProps {
  onOpenNewDeck: () => void;
  onExploreClick: () => void;
  onPracticeClick?: () => void;
}

export const DecksScreen: React.FC<DecksScreenProps> = ({
  onOpenNewDeck,
  onExploreClick,
  onPracticeClick,
}) => {
  const {
    decks,
    cards,
    profile,
    todayReviewsCount,
    deleteDeck,
    createCard,
    updateDeck,
    t,
    getAllDueCards,
    getDeckDueCards,
    getBookmarkedCards,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [filterBookmarkedOnly, setFilterBookmarkedOnly] = useState<boolean>(false);

  // Modal states
  const [activeStudySession, setActiveStudySession] = useState<{
    deck?: Deck;
    cards: Card[];
    mode?: StudyMode;
  } | null>(null);

  const [activeCardEditorDeck, setActiveCardEditorDeck] = useState<Deck | null>(null);
  const [activeDeckEditor, setActiveDeckEditor] = useState<Deck | null>(null);

  const bookmarkedCards = useMemo(() => getBookmarkedCards(), [cards, profile.bookmarkedCardIds]);

  // Filtered decks
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      const matchesSearch =
        deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang =
        selectedLanguage === 'all' || deck.targetLanguage === selectedLanguage;
      const matchesLevel =
        selectedLevel === 'all' || deck.level === selectedLevel;

      if (filterBookmarkedOnly) {
        const deckHasBookmarks = cards.some(
          (c) => c.deckId === deck.id && profile.bookmarkedCardIds?.includes(c.id)
        );
        return matchesSearch && matchesLang && matchesLevel && deckHasBookmarks;
      }

      return matchesSearch && matchesLang && matchesLevel;
    });
  }, [decks, cards, profile.bookmarkedCardIds, searchQuery, selectedLanguage, selectedLevel, filterBookmarkedOnly]);

  const allDueCards = useMemo(() => getAllDueCards(), [cards]);
  const goalPercent = Math.min(100, Math.round((todayReviewsCount / (profile.dailyGoal || 20)) * 100));

  const handleStudyAllDue = (mode: StudyMode = 'srs') => {
    setActiveStudySession({
      cards: allDueCards,
      mode,
    });
  };

  const handleStudyDeck = (deck: Deck, mode: StudyMode = 'srs') => {
    const due = getDeckDueCards(deck.id);
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    setActiveStudySession({
      deck,
      cards: due.length > 0 ? due : deckCards,
      mode,
    });
  };

  const handleStudyBookmarks = () => {
    setActiveStudySession({
      cards: bookmarkedCards,
      mode: 'srs',
    });
  };

  const [deckPendingDelete, setDeckPendingDelete] = useState<Deck | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deckPendingDelete) return;
    try {
      setIsDeletingDeck(true);
      setDeleteError(null);
      const title = deckPendingDelete.title;
      const cardCount = cards.filter((c) => c.deckId === deckPendingDelete.id).length;
      await deleteDeck(deckPendingDelete.id);
      setDeckPendingDelete(null);
      setDeleteToast(`✓ Deck "${title}" (${cardCount} cards) deleted.`);
      setTimeout(() => setDeleteToast(null), 4000);
    } catch (err: any) {
      console.error('Failed to delete deck:', err);
      setDeleteError(err?.message || 'Failed to delete deck. Please check permissions or try again.');
    } finally {
      setIsDeletingDeck(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Daily Progress & Motivation Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Spaced Repetition SM-2
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {todayReviewsCount} of {profile.dailyGoal} cards studied today
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Keep your memory retention sharp.
            </h1>

            {/* Daily Goal Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{t('dailyGoal')} ({goalPercent}%)</span>
                <span className="text-indigo-400">{todayReviewsCount} / {profile.dailyGoal}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('savedLocally')} in offline-first IndexedDB vault</span>
            </div>
          </div>

          {/* Quick Study Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleStudyAllDue('srs')}
              disabled={allDueCards.length === 0}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition active:scale-95 ${
                allDueCards.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {allDueCards.length > 0
                  ? `${t('studyDueCards')} (${allDueCards.length})`
                  : t('allCaughtUp')}
              </span>
            </button>

            <button
              onClick={onOpenNewDeck}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-white text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newDeck')}</span>
            </button>

            {onPracticeClick && (
              <button
                onClick={onPracticeClick}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-sm font-semibold transition"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{t('practice')}</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Bookmarked Cards Quick Access Banner (if any) */}
      {bookmarkedCards.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Bookmarked Starred Cards</h4>
              <p className="text-xs text-slate-400">
                You have {bookmarkedCards.length} prioritized cards saved for targeted review.
              </p>
            </div>
          </div>
          <button
            onClick={handleStudyBookmarks}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shrink-0"
          >
            Review Bookmarks
          </button>
        </div>
      )}

      {/* Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('filterByLanguage')}</option>
            {Object.values(SUPPORTED_LANGUAGES).map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('filterByLevel')}</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

      </div>

      {/* Decks Grid */}
      {filteredDecks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Decks Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-5">
            You don't have any decks matching this filter. You can create a new deck or browse curated packs in Explore!
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenNewDeck}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
            >
              {t('newDeck')}
            </button>
            <button
              onClick={onExploreClick}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              {t('explore')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => {
            const targetMeta = SUPPORTED_LANGUAGES[deck.targetLanguage];

            return (
              <div
                key={deck.id}
                className="group rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 p-5 sm:p-6 shadow-lg transition-all duration-200 flex flex-col justify-between hover:shadow-indigo-500/10 hover:-translate-y-0.5"
              >
                <div>
                  
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" title={targetMeta?.name}>
                        {targetMeta?.flag || '🌐'}
                      </span>
                      {deck.level && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                          {deck.level}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {deck.dueCardCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse">
                          {deck.dueCardCount} {t('due')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          Caught up
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDeckEditor(deck);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-slate-800 transition"
                        title={t('editDeck') || 'Edit Deck'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeckPendingDelete(deck);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title={t('deleteDeck') || t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
                    {deck.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {deck.description || 'Custom spaced repetition deck'}
                  </p>

                  {/* Stats Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>{deck.cardCount} {t('cards')}</span>
                      <span>{deck.masteredCardCount} {t('mastered')}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${deck.cardCount > 0 ? (deck.masteredCardCount / deck.cardCount) * 100 : 0}%`,
                        }}
                        title="Mastered"
                      />
                      <div
                        className="bg-indigo-500 h-full"
                        style={{
                          width: `${deck.cardCount > 0 ? ((deck.cardCount - deck.dueCardCount - deck.masteredCardCount) / deck.cardCount) * 100 : 0}%`,
                        }}
                        title="Learning"
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${deck.cardCount > 0 ? (deck.dueCardCount / deck.cardCount) * 100 : 0}%`,
                        }}
                        title="Due"
                      />
                    </div>
                  </div>

                </div>

                {/* Deck Card Action Buttons & Study Modes */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStudyDeck(deck, 'srs')}
                      disabled={deck.cardCount === 0}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                        deck.dueCardCount > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Study Now</span>
                    </button>

                    <button
                      onClick={() => setActiveCardEditorDeck(deck)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title={t('newCard')}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mode Shortcuts */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                    <span className="text-[10px] text-slate-500">Modes:</span>
                    <button
                      onClick={() => handleStudyDeck(deck, 'quiz')}
                      disabled={deck.cardCount < 2}
                      className="hover:text-indigo-400 transition flex items-center gap-1 disabled:opacity-30"
                    >
                      <ListOrdered className="w-3 h-3" />
                      <span>Quiz</span>
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      onClick={() => handleStudyDeck(deck, 'listen')}
                      disabled={deck.cardCount === 0}
                      className="hover:text-indigo-400 transition flex items-center gap-1 disabled:opacity-30"
                    >
                      <Headphones className="w-3 h-3" />
                      <span>Listen</span>
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      onClick={() => handleStudyDeck(deck, 'cram')}
                      disabled={deck.cardCount === 0}
                      className="hover:text-indigo-400 transition flex items-center gap-1 disabled:opacity-30"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Cram</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Study Session Modal */}
      {activeStudySession && (
        <StudySessionModal
          deck={activeStudySession.deck}
          cards={activeStudySession.cards}
          initialMode={activeStudySession.mode || 'srs'}
          onClose={() => setActiveStudySession(null)}
        />
      )}

      {/* New Card Modal */}
      {activeCardEditorDeck && (
        <CardEditorModal
          deckId={activeCardEditorDeck.id}
          defaultTargetLang={activeCardEditorDeck.targetLanguage}
          defaultNativeLang={activeCardEditorDeck.nativeLanguage}
          onSave={async (cardData) => {
            await createCard(cardData);
          }}
          onClose={() => setActiveCardEditorDeck(null)}
        />
      )}

      {/* Edit Deck Modal */}
      {activeDeckEditor && (
        <DeckEditorModal
          existingDeck={activeDeckEditor}
          onSave={async (data) => {
            await updateDeck({ ...activeDeckEditor, ...data });
          }}
          onDelete={async (deckId) => {
            const title = activeDeckEditor.title;
            await deleteDeck(deckId);
            setDeleteToast(`✓ Deck "${title}" deleted.`);
            setTimeout(() => setDeleteToast(null), 4000);
          }}
          onClose={() => setActiveDeckEditor(null)}
        />
      )}

      {/* Toast Notification */}
      {deleteToast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3 text-white text-xs font-bold shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Delete Deck Confirmation Modal (Replaces blocked window.confirm) */}
      {deckPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t('deleteDeck')}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (!isDeletingDeck) {
                    setDeckPendingDelete(null);
                    setDeleteError(null);
                  }
                }}
                disabled={isDeletingDeck}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                {t('confirmDelete')}
              </p>

              {/* Deck Details Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-base">
                    <span>{SUPPORTED_LANGUAGES[deckPendingDelete.targetLanguage]?.flag || '🌐'}</span>
                    <span className="line-clamp-1">{deckPendingDelete.title}</span>
                  </div>
                  {deckPendingDelete.level && (
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      {deckPendingDelete.level}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>{cards.filter((c) => c.deckId === deckPendingDelete.id).length} {t('cards')}</span>
                  <span>•</span>
                  <span>{SUPPORTED_LANGUAGES[deckPendingDelete.targetLanguage]?.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {t('deleteDeckWarning')}
                </span>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setDeckPendingDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingDeck}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-40"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingDeck}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white text-xs shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {isDeletingDeck ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteDeck')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
