import React, { useState, useRef } from 'react';
import {
  Flame,
  Award,
  Target,
  BarChart2,
  Download,
  Upload,
  Share2,
  Check,
  Volume2,
  Sparkles,
  Save,
  ShieldCheck,
  User,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../types';

export const ProfileScreen: React.FC = () => {
  const {
    profile,
    updateProfile,
    todayReviewsCount,
    decks,
    cards,
    t,
    saveAllThings,
    setIsAuthModalOpen,
    exportAllData,
    importAllData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.displayName || 'Polyglot Learner');
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal || 20);
  const [preferredVoice, setPreferredVoice] = useState<'gemini' | 'native'>(
    profile.preferredVoice || 'gemini'
  );
  const [geminiVoiceName, setGeminiVoiceName] = useState<
    'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
  >(profile.geminiVoiceName || 'Puck');
  const [interfaceLanguage, setInterfaceLanguage] = useState<LanguageCode>(
    profile.interfaceLanguage || 'en'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totalMastered = decks.reduce((acc, d) => acc + (d.masteredCardCount || 0), 0);
  const totalCards = cards.length;

  const handleSaveProfile = async () => {
    await updateProfile({
      displayName,
      dailyGoal,
      preferredVoice,
      geminiVoiceName,
      interfaceLanguage,
    });
    await saveAllThings();
    setStatusMessage('All settings and learning progress saved safely!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `7ifd_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importAllData(text);
      if (result.success) {
        setStatusMessage(result.message);
      } else {
        alert(result.message);
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: '7ifd - Spaced Repetition Language Platform',
          text: `I'm on a ${profile.streak}-day language study streak with 7ifd!`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setStatusMessage('App link copied to clipboard!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-white text-xs font-bold shadow-xl border border-indigo-400/40 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-600/30">
            {profile.avatarUrl || displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {profile.displayName || displayName}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {profile.isGuest ? 'Guest Mode' : 'Free Account'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {profile.email || 'Local offline learner'} • Auto-synced in IndexedDB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{profile.isGuest ? 'Create Free Account' : 'Manage Account'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t('streak')}
          </span>
          <span className="text-2xl font-black text-white">
            {profile.streak} <span className="text-xs text-slate-500 font-normal">days</span>
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
            <Target className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t('reviewsToday')}
          </span>
          <span className="text-2xl font-black text-white">
            {todayReviewsCount} <span className="text-xs text-slate-500 font-normal">/ {profile.dailyGoal}</span>
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t('mastered')}
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {totalMastered} <span className="text-xs text-slate-500 font-normal">cards</span>
          </span>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
            <BarChart2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            Total In Decks
          </span>
          <span className="text-2xl font-black text-white">
            {totalCards} <span className="text-xs text-slate-500 font-normal">cards</span>
          </span>
        </div>

      </div>

      {/* Settings Form */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Learning Preferences</span>
        </h2>

        <div className="space-y-5">
          
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Your Name / Alias
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Interface Language: ALL 11 LANGUAGES */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Site Interface Language (11 Supported Languages)
            </label>
            <select
              value={interfaceLanguage}
              onChange={(e) => setInterfaceLanguage(e.target.value as LanguageCode)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} — {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Goal Slider */}
          <div>
            <div className="flex justify-between max-w-md text-xs font-semibold text-slate-300 mb-1.5">
              <span>{t('dailyGoal')}</span>
              <span className="text-indigo-400 font-bold">{dailyGoal} cards/day</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value, 10))}
              className="w-full max-w-md accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Audio Engine Selection */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Pronunciation Audio Engine
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setPreferredVoice('gemini')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  preferredVoice === 'gemini'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Gemini 3.8 Flash TTS</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Natural AI speech model with accurate native cadences.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredVoice('native')}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  preferredVoice === 'native'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Volume2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Device Native TTS</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Web Speech API voice. Works 100% offline with zero latency.
                  </p>
                </div>
              </button>
            </div>

            {/* Gemini Voice Persona Picker */}
            {preferredVoice === 'gemini' && (
              <div className="mt-3 max-w-md">
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Gemini Voice Persona
                </label>
                <select
                  value={geminiVoiceName}
                  onChange={(e) => setGeminiVoiceName(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Puck">Puck (Natural, articulate - recommended)</option>
                  <option value="Charon">Charon (Deep, steady resonance)</option>
                  <option value="Kore">Kore (Clear, bright educational voice)</option>
                  <option value="Fenrir">Fenrir (Warm, conversational)</option>
                  <option value="Zephyr">Zephyr (Soft, calm cadence)</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync All Things</span>
            </button>
          </div>

        </div>
      </div>

      {/* Data Backup & Portability */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Data Backup & Migration</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All your cards, custom decks, bookmarks, and review history are stored in your device's IndexedDB. Export a full backup to keep your progress safe or transfer it to another device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>{t('exportData')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>{t('importData')}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Offline & Architecture Notice */}
      <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/20 p-5 flex items-start gap-3 text-slate-300 text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Free & Offline-First Guarantee:</strong>
          7ifd operates 100% locally on your machine with IndexedDB and PWA service workers. No network connection is ever required to review your flashcards or track your SM-2 streak.
        </div>
      </div>

    </div>
  );
};
