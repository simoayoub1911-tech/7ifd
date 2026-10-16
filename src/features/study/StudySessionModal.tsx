import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Volume2,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Trophy,
  Flame,
  Star,
  Headphones,
  Check,
  Brain,
  ListOrdered,
  Layers,
  ChevronRight,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Card, Deck, StudyMode } from '../../types';
import { useApp } from '../../context/AppContext';
import { speakText } from '../../lib/speech/tts';

interface StudySessionModalProps {
  deck?: Deck;
  cards: Card[];
  initialMode?: StudyMode;
  onClose: () => void;
}

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  deck,
  cards,
  initialMode = 'srs',
  onClose,
}) => {
  const { recordReview, profile, toggleBookmarkCard, t } = useApp();
  const [studyMode, setStudyMode] = useState<StudyMode>(initialMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<number[]>([]);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;
  const isBookmarked = currentCard ? profile.bookmarkedCardIds?.includes(currentCard.id) : false;

  // Generate 4 multiple-choice options for Quiz Mode
  const quizOptions = useMemo(() => {
    if (!currentCard || studyMode !== 'quiz') return [];
    const correct = currentCard.back;
    // pick 3 other distractors from remaining cards
    const others = cards
      .filter((c) => c.id !== currentCard.id)
      .map((c) => c.back);
    // shuffle and take up to 3
    const shuffledOthers = [...new Set(others)].sort(() => 0.5 - Math.random()).slice(0, 3);
    const all = [correct, ...shuffledOthers];
    return all.sort(() => 0.5 - Math.random());
  }, [currentCard, cards, studyMode, currentIndex]);

  // Audio pronunciation helper
  const handlePlayAudio = useCallback(
    async (textToSpeak?: string, lang?: any) => {
      if (!currentCard) return;
      const text = textToSpeak || currentCard.front;
      const language = lang || currentCard.targetLanguage;

      try {
        setIsPlayingAudio(true);
        await speakText({
          text,
          language,
          voicePreference: profile.preferredVoice,
          geminiVoice: profile.geminiVoiceName,
        });
      } catch (err) {
        console.error('TTS error:', err);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [currentCard, profile]
  );

  // In Listening mode, automatically play audio when new card appears!
  useEffect(() => {
    if (studyMode === 'listen' && currentCard && !sessionCompleted) {
      handlePlayAudio();
    }
  }, [studyMode, currentIndex, sessionCompleted]);

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Handle SM-2 rating
  const handleRate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!currentCard) return;

      await recordReview(currentCard.id, rating);
      const newRatings = [...sessionRatings, rating];
      setSessionRatings(newRatings);

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setIsQuizAnswered(false);
        setSelectedQuizOption(null);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
        triggerCelebration();
      }
    },
    [currentCard, currentIndex, cards.length, sessionRatings, recordReview]
  );

  // Handle Quiz Option Selection
  const handleSelectQuizOption = (option: string) => {
    if (isQuizAnswered || !currentCard) return;
    setSelectedQuizOption(option);
    setIsQuizAnswered(true);
    const isCorrect = option === currentCard.back;
    handleRate(isCorrect ? 3 : 1);
  };

  const triggerCelebration = () => {
    try {
      const end = Date.now() + 1500;
      const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'a') {
        handlePlayAudio();
      } else if (e.key.toLowerCase() === 's' && currentCard) {
        toggleBookmarkCard(currentCard.id);
      } else if (isFlipped && studyMode === 'srs') {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, sessionCompleted, handleFlip, handleRate, onClose, handlePlayAudio, toggleBookmarkCard, currentCard, studyMode]);

  const successfulReviews = sessionRatings.filter((r) => r >= 3).length;
  const accuracyRate =
    sessionRatings.length > 0
      ? Math.round((successfulReviews / sessionRatings.length) * 100)
      : 100;

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-100 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('allCaughtUp')}</h3>
          <p className="text-xs text-slate-400 mb-6">
            There are no cards in this selection. You have reviewed all cards or the deck is empty!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-sm transition"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-8 shadow-2xl relative flex flex-col min-h-[580px]">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5">
          
          {/* Deck info & Counter */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {deck ? deck.title : 'All Due Cards'}
            </span>
            <span className="text-xs text-slate-400 font-semibold font-mono">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>

          {/* Mode Selector Pill */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setStudyMode('srs');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                studyMode === 'srs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="SM-2 Spaced Repetition"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SRS</span>
            </button>

            <button
              onClick={() => {
                setStudyMode('quiz');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                studyMode === 'quiz' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Multiple Choice Quiz"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quiz</span>
            </button>

            <button
              onClick={() => {
                setStudyMode('listen');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                studyMode === 'listen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Listening Practice"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Listen</span>
            </button>

            <button
              onClick={() => {
                setStudyMode('cram');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                studyMode === 'cram' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Quick Flashcard Cram"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cram</span>
            </button>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2">
            {currentCard && (
              <button
                onClick={() => toggleBookmarkCard(currentCard.id)}
                className={`p-2 rounded-xl transition ${
                  isBookmarked
                    ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks [S]'}
              >
                <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Session Finished Screen */}
        {sessionCompleted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20 mb-5">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-amber-400">
                <Trophy className="w-10 h-10" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {t('congratulations')}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mb-6">
              {t('sessionComplete')} All cards and SM-2 retention intervals updated safely in your vault.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  {t('cardsReviewed')}
                </span>
                <span className="text-2xl font-black text-white">
                  {sessionRatings.length}
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  {t('accuracy')}
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {accuracyRate}%
                </span>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  {t('streak')}
                </span>
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-amber-400">
                  <Flame className="w-5 h-5 fill-amber-400" />
                  <span>{profile.streak}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setSessionCompleted(false);
                  setSessionRatings([]);
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Study Again
              </button>

              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-bold text-white text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Active Flashcard Screen */
          <div className="flex-1 flex flex-col justify-between">
            
            {/* The Professional Card */}
            <div
              onClick={() => {
                if (studyMode !== 'quiz') handleFlip();
              }}
              className="cursor-pointer group flex-1 rounded-3xl bg-gradient-to-b from-slate-800/80 via-slate-800/50 to-slate-900 border border-slate-700/70 hover:border-indigo-500/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative select-none min-h-[300px] shadow-xl"
            >
              
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentCard.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300 border border-slate-600/40"
                    >
                      {tag}
                    </span>
                  ))}
                  {currentCard.srsState?.interval > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      interval: {currentCard.srsState.interval}d
                    </span>
                  )}
                </div>

                {/* Pronunciation Sound Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio();
                  }}
                  disabled={isPlayingAudio}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-2 text-xs font-bold"
                  title="Pronounce Word [A]"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-amber-400' : ''}`} />
                  {/* Sound Wave Bars */}
                  {isPlayingAudio && (
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-0.5 h-full bg-amber-400 animate-pulse" />
                      <span className="w-0.5 h-2 bg-amber-400 animate-pulse delay-75" />
                      <span className="w-0.5 h-3 bg-amber-400 animate-pulse delay-150" />
                    </div>
                  )}
                  <span className="hidden sm:inline">Audio [A]</span>
                </button>
              </div>

              {/* Card Body */}
              <div className="my-auto text-center py-4">
                
                {/* Listening mode prompt */}
                {studyMode === 'listen' && !isFlipped ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center animate-pulse">
                      <Headphones className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Listen to the pronunciation</h3>
                    <p className="text-xs text-slate-400">Try to recall the word and meaning before revealing</p>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
                      {currentCard.front}
                    </h1>

                    {currentCard.phonetic && (
                      <p className="text-indigo-300 text-sm font-mono tracking-wide mb-1">
                        {currentCard.phonetic}
                      </p>
                    )}
                    {currentCard.transliteration && (
                      <p className="text-slate-400 text-xs italic">
                        ({currentCard.transliteration})
                      </p>
                    )}
                  </>
                )}

                {/* Back side Answer (when flipped) */}
                {isFlipped && (
                  <div className="mt-6 pt-6 border-t border-slate-700/60 animate-fadeIn">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-emerald-400 mb-3">
                      {currentCard.back}
                    </h2>

                    {currentCard.exampleSentence && (
                      <div className="mt-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center max-w-lg mx-auto">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-200">
                            "{currentCard.exampleSentence}"
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio(currentCard.exampleSentence);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-400 transition"
                            title="Play example"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {currentCard.exampleTranslation && (
                          <p className="text-xs text-slate-400 italic">
                            {currentCard.exampleTranslation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Flip Hint */}
              {studyMode !== 'quiz' && (
                <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-2">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t('flipCard')}</span>
                </div>
              )}

            </div>

            {/* Bottom Actions based on Study Mode */}
            <div className="mt-5">
              
              {/* Quiz Mode: 4 option buttons */}
              {studyMode === 'quiz' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quizOptions.map((opt) => {
                    let btnStyle = 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white';
                    if (isQuizAnswered) {
                      if (opt === currentCard.back) {
                        btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold';
                      } else if (opt === selectedQuizOption) {
                        btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-300';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectQuizOption(opt)}
                        disabled={isQuizAnswered}
                        className={`p-3.5 rounded-2xl border text-sm font-medium transition text-left flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isQuizAnswered && opt === currentCard.back && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : !isFlipped ? (
                /* Card not yet flipped: Big flip button */
                <button
                  onClick={handleFlip}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>{t('showAnswer')} (Space)</span>
                </button>
              ) : studyMode === 'srs' ? (
                /* SM-2 Spaced Repetition Rating Buttons */
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRate(1)}
                    className="py-3 px-2 rounded-2xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-1 active:scale-95"
                  >
                    <span>{t('again')}</span>
                    <span className="text-[10px] text-rose-400/80 font-mono font-normal">[1] 1d</span>
                  </button>

                  <button
                    onClick={() => handleRate(2)}
                    className="py-3 px-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-1 active:scale-95"
                  >
                    <span>{t('hard')}</span>
                    <span className="text-[10px] text-amber-400/80 font-mono font-normal">[2] 2d</span>
                  </button>

                  <button
                    onClick={() => handleRate(3)}
                    className="py-3 px-2 rounded-2xl bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-1 active:scale-95"
                  >
                    <span>{t('good')}</span>
                    <span className="text-[10px] text-blue-400/80 font-mono font-normal">[3] 4d</span>
                  </button>

                  <button
                    onClick={() => handleRate(4)}
                    className="py-3 px-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm transition flex flex-col items-center justify-center gap-1 active:scale-95"
                  >
                    <span>{t('easy')}</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono font-normal">[4] 7d</span>
                  </button>
                </div>
              ) : (
                /* Quick Cram Mode: Simple Next Button */
                <button
                  onClick={() => handleRate(3)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>{t('nextCard')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
