import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Users,
  Compass,
  ShoppingBag,
  Building2,
  Briefcase,
  HeartPulse,
  Film,
  Download,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Volume2,
  BookMarked,
  GraduationCap,
} from 'lucide-react';
import { DOMAINS } from '../../data/categories';
import { getDomainLevelCards } from '../../data/domainCardsProvider';
import { CEFRLevel, LanguageCode, SUPPORTED_LANGUAGES } from '../../types';
import { useApp } from '../../context/AppContext';
import { speakText } from '../../lib/speech/tts';

const ICONS_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Users,
  Compass,
  ShoppingBag,
  Building2,
  Briefcase,
  HeartPulse,
  Film,
};

export const ExploreScreen: React.FC = () => {
  const { profile, importDeckAndCards, t } = useApp();

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>('A1');
  const [targetLang, setTargetLang] = useState<LanguageCode>('en');
  const [nativeLang, setNativeLang] = useState<LanguageCode>(
    profile.interfaceLanguage === 'en' ? 'ar' : profile.interfaceLanguage
  );
  const [copiedSuccessMessage, setCopiedSuccessMessage] = useState<string | null>(null);

  const selectedDomain = useMemo(() => {
    return DOMAINS.find((d) => d.id === selectedDomainId) || null;
  }, [selectedDomainId]);

  // Generate 50 verified cards for this domain & level
  const previewCards = useMemo(() => {
    if (!selectedDomainId) return [];
    return getDomainLevelCards(selectedDomainId, selectedLevel, targetLang, nativeLang);
  }, [selectedDomainId, selectedLevel, targetLang, nativeLang]);

  const handleCopyDeck = async () => {
    if (!selectedDomain) return;

    const domainTitle =
      selectedDomain.titles?.[profile.interfaceLanguage] ||
      selectedDomain.titleEn;
    const deckTitle = `${domainTitle} (${selectedLevel})`;

    await importDeckAndCards(
      {
        id: '',
        title: deckTitle,
        description: `Verified ${selectedLevel} mastery deck from ${domainTitle} curated pack.`,
        targetLanguage: targetLang,
        nativeLanguage: nativeLang,
        level: selectedLevel,
        category: selectedDomain.id,
        domainId: selectedDomain.id,
        cardCount: previewCards.length,
        dueCardCount: previewCards.length,
        masteredCardCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      previewCards
    );

    setCopiedSuccessMessage(`✓ ${deckTitle} (${previewCards.length} cards) copied to My Learning!`);
    setTimeout(() => {
      setCopiedSuccessMessage(null);
    }, 4500);
  };

  const handlePlayAudio = async (text: string) => {
    try {
      await speakText({
        text,
        language: targetLang,
        voicePreference: profile.preferredVoice,
        geminiVoice: profile.geminiVoiceName,
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Notification */}
      {copiedSuccessMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3 text-white text-xs font-bold shadow-2xl shadow-emerald-900/50 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copiedSuccessMessage}</span>
        </div>
      )}

      {/* Explore Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-xs font-semibold">
              Curated CEFR Knowledge Packs • All 11 Languages
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('explore')}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Choose across 8 curated knowledge domains spanning 6 CEFR levels (A1 to C2). Each pack delivers 50 verified flashcards with native pronunciations, IPA phonetics, and authentic examples.
          </p>
        </div>

        {/* Global Language Pair Selectors */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 self-start md:self-auto">
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Target</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-slate-800 text-white rounded-xl px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-500 text-xs font-bold pt-3">→</div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Native</label>
            <select
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value as LanguageCode)}
              className="bg-slate-800 text-white rounded-xl px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.values(SUPPORTED_LANGUAGES).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Detail Domain View */}
      {selectedDomain ? (
        <div className="space-y-6">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDomainId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all domains</span>
            </button>
          </div>

          <div
            className={`rounded-3xl p-6 sm:p-8 bg-gradient-to-r ${selectedDomain.gradient} text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6`}
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
                50 Cards per Level • 11 Languages
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
                {selectedDomain.titles?.[profile.interfaceLanguage] || selectedDomain.titleEn}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-xl">
                {selectedDomain.descriptions?.[profile.interfaceLanguage] || selectedDomain.descriptionEn}
              </p>
            </div>

            <button
              onClick={handleCopyDeck}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-2xl hover:bg-slate-100 transition active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>{t('copyDeckToMyLearning')}</span>
            </button>
          </div>

          {/* CEFR Level Tabs (A1 to C2) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Level {lvl}</span>
                <span className="text-[10px] opacity-75 font-normal">(50 cards)</span>
              </button>
            ))}
          </div>

          {/* Preview of 50 Cards */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-400" />
                <span>Pack Cards Preview ({previewCards.length} Cards)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Target: <strong>{SUPPORTED_LANGUAGES[targetLang]?.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {previewCards.map((card, idx) => (
                <div
                  key={card.id}
                  className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 hover:border-indigo-500/50 transition flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(card.front)}
                      className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 transition"
                      title="Play Pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white mb-0.5">{card.front}</h4>
                    {card.phonetic && (
                      <p className="text-[11px] text-indigo-300 font-mono">{card.phonetic}</p>
                    )}
                    <p className="text-xs font-semibold text-emerald-400 mt-1">{card.back}</p>
                  </div>

                  {card.exampleSentence && (
                    <p className="text-[11px] text-slate-400 italic line-clamp-1 border-t border-slate-700/50 pt-1.5">
                      "{card.exampleSentence}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Domains Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {DOMAINS.map((domain) => {
            const Icon = ICONS_MAP[domain.icon] || Sparkles;

            return (
              <div
                key={domain.id}
                onClick={() => setSelectedDomainId(domain.id)}
                className="group cursor-pointer rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div>
                  
                  {/* Domain Icon & Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${domain.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      A1–C2
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5">
                    {domain.titles?.[profile.interfaceLanguage] || domain.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {domain.descriptions?.[profile.interfaceLanguage] || domain.descriptionEn}
                  </p>

                </div>

                {/* Card footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
                  <span>300 verified cards</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
