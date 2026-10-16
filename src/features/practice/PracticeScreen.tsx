import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCw,
  Trophy,
  Flame,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Layers,
  Clock,
  Play,
  Shuffle,
  Headphones,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, Deck, LanguageCode, SUPPORTED_LANGUAGES } from '../../types';
import { playSpeech } from '../../lib/speech/tts';

type PracticeModeId = 'quiz' | 'listen' | 'match' | 'cloze' | 'spelling';

interface MatchTile {
  id: string;
  cardId: string;
  text: string;
  type: 'front' | 'back';
  isMatched: boolean;
}

export const PracticeScreen: React.FC = () => {
  const {
    decks,
    cards,
    profile,
    recordReview,
    t,
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<PracticeModeId>('quiz');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<1.0 | 0.8>(1.0);

  // Mode-specific states:
  // 1. Multiple Choice Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 2. Audio Dictation state
  const [dictationInput, setDictationInput] = useState('');
  const [showDictationHint, setShowDictationHint] = useState(false);
  const [dictationSubmitted, setDictationSubmitted] = useState(false);

  // 3. Speed Match state
  const [matchTiles, setMatchTiles] = useState<MatchTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [matchMismatched, setMatchMismatched] = useState<string[]>([]);
  const [matchCompletedCount, setMatchCompletedCount] = useState(0);
  const [matchTimeRemaining, setMatchTimeRemaining] = useState(60);
  const [isMatchTimerRunning, setIsMatchTimerRunning] = useState(false);

  // 4. Cloze state
  const [clozeOptions, setClozeOptions] = useState<string[]>([]);
  const [selectedCloze, setSelectedCloze] = useState<string | null>(null);
  const [clozeSubmitted, setClozeSubmitted] = useState(false);

  // 5. Spelling Drill state
  const [spellingLetters, setSpellingLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [assembledSpelling, setAssembledSpelling] = useState<{ id: string; char: string }[]>([]);
  const [spellingSubmitted, setSpellingSubmitted] = useState(false);

  // Filter pool of cards based on deck selection
  const availableCards = useMemo(() => {
    if (selectedDeckId === 'all') {
      return cards.length > 0 ? cards : [];
    }
    return cards.filter((c) => c.deckId === selectedDeckId);
  }, [cards, selectedDeckId]);

  // Start or restart a practice session with 10 randomized cards
  const startSession = useCallback(() => {
    if (availableCards.length === 0) {
      setSessionCards([]);
      return;
    }

    const shuffled = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 10);
    setSessionCards(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setIsComplete(false);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setDictationInput('');
    setShowDictationHint(false);
    setDictationSubmitted(false);
    setSelectedCloze(null);
    setClozeSubmitted(false);
    setSpellingSubmitted(false);

    // If speed match mode, initialize the tiles grid (6 pairs = 12 tiles)
    if (selectedMode === 'match') {
      const matchPool = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 6);
      const tiles: MatchTile[] = [];
      matchPool.forEach((card) => {
        tiles.push({
          id: `front_${card.id}`,
          cardId: card.id,
          text: card.front,
          type: 'front',
          isMatched: false,
        });
        tiles.push({
          id: `back_${card.id}`,
          cardId: card.id,
          text: card.back,
          type: 'back',
          isMatched: false,
        });
      });
      // Shuffle tiles
      setMatchTiles(tiles.sort(() => 0.5 - Math.random()));
      setSelectedTile(null);
      setMatchMismatched([]);
      setMatchCompletedCount(0);
      setMatchTimeRemaining(45);
      setIsMatchTimerRunning(true);
    }
  }, [availableCards, selectedMode]);

  // Initialize on mode or deck change
  useEffect(() => {
    startSession();
  }, [selectedMode, selectedDeckId, startSession]);

  const currentCard = sessionCards[currentIndex] as Card | undefined;

  // Audio pronunciation helper
  const handlePlayAudio = useCallback(async (textToSpeak?: string, lang?: LanguageCode, rate = 1.0) => {
    if (!currentCard && !textToSpeak) return;
    const speakText = textToSpeak || currentCard?.front;
    const targetLang = lang || currentCard?.targetLanguage || 'en';
    if (!speakText) return;

    setIsPlayingAudio(true);
    try {
      await playSpeech({
        text: speakText,
        lang: targetLang,
        rate,
        voicePreference: profile.preferredVoice || 'gemini',
        geminiVoiceName: profile.geminiVoiceName,
      });
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsPlayingAudio(false);
    }
  }, [currentCard, profile.preferredVoice, profile.geminiVoiceName]);

  // Set up question state whenever currentCard changes
  useEffect(() => {
    if (!currentCard) return;

    // Auto play audio in listen mode
    if (selectedMode === 'listen') {
      handlePlayAudio(currentCard.front, currentCard.targetLanguage, audioSpeed);
    }

    // Prepare 4 multiple choice options
    if (selectedMode === 'quiz' || selectedMode === 'listen') {
      const correctAnswer = currentCard.back;
      const otherAnswers = cards
        .filter((c) => c.id !== currentCard.id && c.back !== correctAnswer)
        .map((c) => c.back)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [correctAnswer, ...otherAnswers].sort(() => 0.5 - Math.random());
      setQuizOptions(options);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
    }

    // Prepare Cloze options
    if (selectedMode === 'cloze') {
      const correctAnswer = currentCard.front;
      const otherAnswers = cards
        .filter((c) => c.id !== currentCard.id && c.front !== correctAnswer)
        .map((c) => c.front)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [correctAnswer, ...otherAnswers].sort(() => 0.5 - Math.random());
      setClozeOptions(options);
      setSelectedCloze(null);
      setClozeSubmitted(false);
    }

    // Prepare Spelling letters (characters of front term + 2 distractors if short)
    if (selectedMode === 'spelling') {
      const cleanWord = currentCard.front.trim();
      const chars = cleanWord.split('').filter((c) => c !== ' ');
      const letterItems = chars.map((char, i) => ({
        id: `char_${i}_${char}`,
        char,
        used: false,
      })).sort(() => 0.5 - Math.random());

      setSpellingLetters(letterItems);
      setAssembledSpelling([]);
      setSpellingSubmitted(false);
    }

    setDictationInput('');
    setShowDictationHint(false);
    setDictationSubmitted(false);
  }, [currentIndex, currentCard, selectedMode, cards, handlePlayAudio, audioSpeed]);

  // Speed Match timer countdown
  useEffect(() => {
    if (!isMatchTimerRunning || selectedMode !== 'match') return;

    const timer = setInterval(() => {
      setMatchTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsMatchTimerRunning(false);
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchTimerRunning, selectedMode]);

  // Handle tile click in Speed Match mode
  const handleTileClick = (tile: MatchTile) => {
    if (tile.isMatched || matchMismatched.length > 0) return;

    if (!selectedTile) {
      setSelectedTile(tile);
      if (tile.type === 'front') {
        const matchingCard = cards.find((c) => c.id === tile.cardId);
        if (matchingCard) handlePlayAudio(matchingCard.front, matchingCard.targetLanguage);
      }
      return;
    }

    // Clicked same tile
    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    // Check match
    if (selectedTile.cardId === tile.cardId && selectedTile.type !== tile.type) {
      // MATCH!
      setMatchTiles((prev) =>
        prev.map((t) => (t.cardId === tile.cardId ? { ...t, isMatched: true } : t))
      );
      setSelectedTile(null);
      const newScore = score + 100 + combo * 20;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setMatchCompletedCount((c) => {
        const next = c + 1;
        if (next >= 6) {
          setIsMatchTimerRunning(false);
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
          setIsComplete(true);
        }
        return next;
      });
      // SM-2 integration: reward Good
      recordReview(tile.cardId, 3);
    } else {
      // MISMATCH
      setMatchMismatched([selectedTile.id, tile.id]);
      setCombo(0);
      setTimeout(() => {
        setMatchMismatched([]);
        setSelectedTile(null);
      }, 700);
    }
  };

  // Multiple Choice Submission
  const handleQuizChoice = async (option: string) => {
    if (quizSubmitted || !currentCard) return;

    setSelectedAnswer(option);
    setQuizSubmitted(true);
    const isCorrect = option === currentCard.back;

    if (isCorrect) {
      const newScore = score + 100 + combo * 25;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      await recordReview(currentCard.id, 4); // Easy
      handlePlayAudio();
    } else {
      setCombo(0);
      await recordReview(currentCard.id, 1); // Again
    }
  };

  // Dictation Submission
  const handleDictationSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (dictationSubmitted || !currentCard || !dictationInput.trim()) return;

    setDictationSubmitted(true);
    const normalizedInput = dictationInput.trim().toLowerCase();
    const normalizedTarget = currentCard.front.trim().toLowerCase();
    const isCorrect = normalizedInput === normalizedTarget;

    if (isCorrect) {
      const newScore = score + 120 + combo * 30;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      await recordReview(currentCard.id, 4);
    } else {
      setCombo(0);
      await recordReview(currentCard.id, 2);
    }
  };

  // Cloze Submission
  const handleClozeChoice = async (option: string) => {
    if (clozeSubmitted || !currentCard) return;

    setSelectedCloze(option);
    setClozeSubmitted(true);
    const isCorrect = option === currentCard.front;

    if (isCorrect) {
      const newScore = score + 100 + combo * 20;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      await recordReview(currentCard.id, 3);
      handlePlayAudio();
    } else {
      setCombo(0);
      await recordReview(currentCard.id, 1);
    }
  };

  // Spelling Assembly
  const handleAddSpellingLetter = (letterItem: { id: string; char: string }) => {
    if (spellingSubmitted) return;
    setSpellingLetters((prev) =>
      prev.map((l) => (l.id === letterItem.id ? { ...l, used: true } : l))
    );
    setAssembledSpelling((prev) => [...prev, letterItem]);
  };

  const handleRemoveSpellingLetter = (letterItem: { id: string; char: string }) => {
    if (spellingSubmitted) return;
    setAssembledSpelling((prev) => prev.filter((l) => l.id !== letterItem.id));
    setSpellingLetters((prev) =>
      prev.map((l) => (l.id === letterItem.id ? { ...l, used: false } : l))
    );
  };

  const handleSpellingCheck = async () => {
    if (spellingSubmitted || !currentCard) return;
    const typed = assembledSpelling.map((l) => l.char).join('');
    const target = currentCard.front.replace(/\s+/g, '');
    const isCorrect = typed.trim().toLowerCase() === target.trim().toLowerCase();

    setSpellingSubmitted(true);
    if (isCorrect) {
      const newScore = score + 110 + combo * 25;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      await recordReview(currentCard.id, 4);
      handlePlayAudio();
    } else {
      setCombo(0);
      await recordReview(currentCard.id, 1);
    }
  };

  // Next card in current session
  const handleNext = () => {
    if (currentIndex + 1 >= sessionCards.length) {
      setIsComplete(true);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentLangMeta = currentCard
    ? SUPPORTED_LANGUAGES[currentCard.targetLanguage] || SUPPORTED_LANGUAGES.en
    : SUPPORTED_LANGUAGES.en;

  // Generate cloze sentence with blank
  const clozeDisplay = useMemo(() => {
    if (!currentCard) return { blankSentence: '', translation: '' };
    const sentence = currentCard.exampleSentence || `${currentCard.front} is essential to practice.`;
    const translation = currentCard.exampleTranslation || currentCard.back;
    // Replace front term case-insensitively with blank
    const regex = new RegExp(currentCard.front, 'gi');
    const blankSentence = sentence.replace(regex, '______');
    return { blankSentence, translation };
  }, [currentCard]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Header & Strategy Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs text-indigo-400 font-semibold tracking-wide">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Learning Laboratory</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Multimodal Fluency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('practiceLab')}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {t('practiceTagline')}
          </p>
        </div>

        {/* Deck Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">
                {t('allDecks')} ({cards.length})
              </option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id} className="bg-slate-900 text-slate-200">
                  {deck.title} ({deck.cardCount})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={startSession}
            title="Restart session"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Mode Tabs (Segmented Control conforming to constitution) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setSelectedMode('quiz')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
            selectedMode === 'quiz'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{t('modeQuiz')}</span>
        </button>

        <button
          onClick={() => setSelectedMode('listen')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
            selectedMode === 'listen'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{t('modeListen')}</span>
        </button>

        <button
          onClick={() => setSelectedMode('match')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
            selectedMode === 'match'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('modeMatch')}</span>
        </button>

        <button
          onClick={() => setSelectedMode('cloze')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
            selectedMode === 'cloze'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('modeCloze')}</span>
        </button>

        <button
          onClick={() => setSelectedMode('spelling')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition col-span-2 sm:col-span-1 ${
            selectedMode === 'spelling'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>{t('modeSpelling')}</span>
        </button>
      </div>

      {/* When no cards available */}
      {availableCards.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Cards Available in this Deck</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Select a different deck from the filter above or import a CEFR domain pack from Explore Packs.
          </p>
        </div>
      ) : isComplete ? (
        /* Session Results View */
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">{t('practiceComplete')}</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your spaced repetition retention scores have been refreshed in your profile vault.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="text-center">
              <span className="block text-2xl font-black text-amber-400">{score}</span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">{t('score')}</span>
            </div>
            <div className="text-center border-x border-slate-800">
              <span className="block text-2xl font-black text-indigo-400">
                {selectedMode === 'match' ? `${matchCompletedCount}/6` : `${sessionCards.length}`}
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Completed</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-black text-emerald-400">
                {maxCombo > 0 ? `${maxCombo}x` : '0x'}
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Top Streak</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={startSession}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>
            <button
              onClick={() => {
                const modes: PracticeModeId[] = ['quiz', 'listen', 'match', 'cloze', 'spelling'];
                const nextIndex = (modes.indexOf(selectedMode) + 1) % modes.length;
                setSelectedMode(modes[nextIndex]);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>Try Another Method</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Practice Interface */
        <div className="space-y-4">
          
          {/* Status bar: Progress, Score, Combo */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {selectedMode === 'match'
                  ? `Pairs: ${matchCompletedCount} / 6`
                  : `Item ${currentIndex + 1} of ${sessionCards.length}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{combo > 0 ? `${combo}x Combo` : '0x'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {selectedMode === 'match' && (
                <span className={`font-mono font-bold ${matchTimeRemaining <= 10 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  ⏱ {matchTimeRemaining}s
                </span>
              )}
              <span className="font-mono text-indigo-300 font-bold">
                {score} XP
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {selectedMode !== 'match' && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
              />
            </div>
          )}

          {/* MODE 1: MULTIPLE CHOICE QUIZ */}
          {selectedMode === 'quiz' && currentCard && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {currentLangMeta.flag} {currentLangMeta.name} {currentCard.phonetic ? `· ${currentCard.phonetic}` : ''}
                </span>

                <button
                  onClick={() => handlePlayAudio()}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-indigo-400' : ''}`} />
                  <span>{t('playAudio')}</span>
                </button>
              </div>

              {/* Prompt Term */}
              <div className="text-center py-4">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                  {currentCard.front}
                </h2>
                {currentCard.transliteration && (
                  <p className="text-sm text-indigo-300/80 font-mono">
                    /{currentCard.transliteration}/
                  </p>
                )}
                {currentCard.exampleSentence && (
                  <p className="text-xs text-slate-400 italic mt-3 max-w-lg mx-auto">
                    "{currentCard.exampleSentence}"
                  </p>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {quizOptions.map((option, idx) => {
                  const isCorrect = option === currentCard.back;
                  const isChosen = selectedAnswer === option;

                  let btnStyle = 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800 text-slate-200';
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isChosen) {
                      btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'opacity-40 border-slate-800 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizSubmitted}
                      onClick={() => handleQuizChoice(option)}
                      className={`p-4 rounded-2xl border text-left text-sm transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {quizSubmitted && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Bar */}
              {quizSubmitted && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 animate-fadeIn">
                  <div className="text-xs font-semibold">
                    {selectedAnswer === currentCard.back ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> {t('correct')} +100 XP
                      </span>
                    ) : (
                      <span className="text-rose-400">
                        Correct: <strong className="text-white">{currentCard.back}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2"
                  >
                    <span>{t('continueNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: AUDIO & DICTATION */}
          {selectedMode === 'listen' && currentCard && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Listening Comprehension · {currentLangMeta.name}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextSpeed = audioSpeed === 1.0 ? 0.8 : 1.0;
                      setAudioSpeed(nextSpeed);
                      handlePlayAudio(currentCard.front, currentCard.targetLanguage, nextSpeed);
                    }}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition ${
                      audioSpeed === 0.8
                        ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {audioSpeed === 0.8 ? 'Slow 0.8x' : 'Normal 1.0x'}
                  </button>
                </div>
              </div>

              {/* Audio Player Hub */}
              <div className="text-center py-6">
                <button
                  onClick={() => handlePlayAudio(currentCard.front, currentCard.targetLanguage, audioSpeed)}
                  disabled={isPlayingAudio}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 hover:scale-105 active:scale-95 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 transition-transform mb-3"
                >
                  <Volume2 className={`w-8 h-8 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                </button>
                <p className="text-xs text-indigo-300 font-medium">
                  {isPlayingAudio ? 'Playing pronunciation...' : 'Click to replay audio'}
                </p>

                {showDictationHint && currentCard.transliteration && (
                  <p className="text-xs text-amber-300 font-mono mt-3 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl inline-block">
                    Transliteration Hint: /{currentCard.transliteration}/
                  </p>
                )}
              </div>

              {/* Type or Pick Options */}
              <form onSubmit={handleDictationSubmit} className="space-y-4 max-w-md mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    disabled={dictationSubmitted}
                    value={dictationInput}
                    onChange={(e) => setDictationInput(e.target.value)}
                    placeholder="Type the word you heard..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-medium"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDictationHint(true)}
                    className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t('revealHint')}</span>
                  </button>

                  {!dictationSubmitted ? (
                    <button
                      type="submit"
                      disabled={!dictationInput.trim()}
                      className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition"
                    >
                      {t('checkAnswer')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2"
                    >
                      <span>{t('continueNext')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {dictationSubmitted && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center animate-fadeIn">
                    <p className="text-xs text-slate-400">Correct Target Word:</p>
                    <p className="text-base font-bold text-white mt-0.5">{currentCard.front}</p>
                    <p className="text-xs text-indigo-300 mt-1">Meaning: {currentCard.back}</p>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* MODE 3: SPEED MATCH */}
          {selectedMode === 'match' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Match terms with their meanings</span>
                <span>Active combo bonus: +{combo * 20} XP</span>
              </div>

              {/* Tiles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {matchTiles.map((tile) => {
                  const isSelected = selectedTile?.id === tile.id;
                  const isMismatched = matchMismatched.includes(tile.id);

                  if (tile.isMatched) {
                    return (
                      <div
                        key={tile.id}
                        className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-400/50 text-xs font-semibold text-center flex items-center justify-center line-through select-none"
                      >
                        {tile.text}
                      </div>
                    );
                  }

                  let tileStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700';
                  if (isSelected) {
                    tileStyle = 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/50 shadow-lg';
                  } else if (isMismatched) {
                    tileStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 animate-shake';
                  }

                  return (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClick(tile)}
                      className={`p-4 min-h-[72px] rounded-2xl border text-xs sm:text-sm font-semibold text-center flex items-center justify-center transition active:scale-95 ${tileStyle}`}
                    >
                      {tile.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 4: SENTENCE CLOZE (IN-CONTEXT FILL-IN-THE-BLANK) */}
          {selectedMode === 'cloze' && currentCard && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Sentence Context Completion · {currentLangMeta.name}
                </span>

                <button
                  onClick={() => handlePlayAudio(currentCard.exampleSentence || currentCard.front)}
                  disabled={isPlayingAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen Sentence</span>
                </button>
              </div>

              {/* Sentence Blank Card */}
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-3">
                <p className="text-lg sm:text-xl font-bold text-slate-100 leading-relaxed font-sans">
                  {clozeDisplay.blankSentence}
                </p>
                <p className="text-xs text-indigo-300/80">
                  Translation: "{clozeDisplay.translation}"
                </p>
              </div>

              {/* Word Choices */}
              <div className="grid grid-cols-2 gap-3">
                {clozeOptions.map((opt, idx) => {
                  const isCorrect = opt === currentCard.front;
                  const isChosen = selectedCloze === opt;

                  let btnStyle = 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-200';
                  if (clozeSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isChosen) {
                      btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'opacity-40 border-slate-800 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={clozeSubmitted}
                      onClick={() => handleClozeChoice(opt)}
                      className={`p-3.5 rounded-xl border text-sm font-semibold transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {clozeSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {clozeSubmitted && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 animate-fadeIn">
                  <span className="text-xs text-emerald-400">
                    Correct word: <strong>{currentCard.front}</strong>
                  </span>
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2"
                  >
                    <span>{t('continueNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 5: SPELLING & ORTHOGRAPHY DRILL */}
          {selectedMode === 'spelling' && currentCard && (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Writing & Spelling Constructor · {currentLangMeta.name}
                </span>

                <button
                  onClick={() => handlePlayAudio()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Pronounce</span>
                </button>
              </div>

              {/* Target Meaning Prompt */}
              <div className="text-center py-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Translate to {currentLangMeta.name}</p>
                <h3 className="text-2xl font-black text-white mt-1">{currentCard.back}</h3>
                {currentCard.phonetic && (
                  <p className="text-xs text-indigo-300 font-mono mt-1">{currentCard.phonetic}</p>
                )}
              </div>

              {/* Assembled Word Slot */}
              <div className="min-h-[64px] p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center gap-2 flex-wrap">
                {assembledSpelling.length === 0 ? (
                  <span className="text-xs text-slate-500">Tap letters below in order</span>
                ) : (
                  assembledSpelling.map((letter) => (
                    <button
                      key={letter.id}
                      onClick={() => handleRemoveSpellingLetter(letter)}
                      className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white font-bold text-base hover:bg-rose-600 transition flex items-center justify-center shadow-md shadow-indigo-600/30"
                      title="Tap to remove"
                    >
                      {letter.char}
                    </button>
                  ))
                )}
              </div>

              {/* Letter Tiles to pick */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                {spellingLetters.map((l) => (
                  <button
                    key={l.id}
                    disabled={l.used || spellingSubmitted}
                    onClick={() => handleAddSpellingLetter(l)}
                    className={`w-11 h-11 rounded-xl border text-base font-bold transition active:scale-95 flex items-center justify-center ${
                      l.used
                        ? 'opacity-20 border-slate-800 bg-slate-900 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100 shadow-sm'
                    }`}
                  >
                    {l.char}
                  </button>
                ))}
              </div>

              {/* Verification & Continue */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAssembledSpelling([]);
                    setSpellingLetters((prev) => prev.map((l) => ({ ...l, used: false })));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Clear All
                </button>

                {!spellingSubmitted ? (
                  <button
                    onClick={handleSpellingCheck}
                    disabled={assembledSpelling.length === 0}
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition"
                  >
                    {t('checkAnswer')}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2"
                  >
                    <span>{t('continueNext')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
