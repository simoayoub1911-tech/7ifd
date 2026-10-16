import React, { useState } from 'react';
import {
  Flame,
  Globe2,
  BookOpen,
  Compass,
  BarChart3,
  Volume2,
  Sparkles,
  User,
  CheckCircle2,
  Save,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationProps {
  currentTab: 'decks' | 'practice' | 'explore' | 'profile';
  setCurrentTab: (tab: 'decks' | 'practice' | 'explore' | 'profile') => void;
  onOpenNewDeck: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
}) => {
  const {
    profile,
    updateProfile,
    t,
    syncStatus,
    saveAllThings,
    setIsAuthModalOpen,
  } = useApp();

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSelectLanguage = (langCode: LanguageCode) => {
    updateProfile({ interfaceLanguage: langCode });
    setIsLangDropdownOpen(false);
  };

  const toggleVoiceMode = () => {
    const nextVoice = profile.preferredVoice === 'gemini' ? 'native' : 'gemini';
    updateProfile({ preferredVoice: nextVoice });
  };

  const handleManualSave = async () => {
    await saveAllThings();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const currentLangMeta = SUPPORTED_LANGUAGES[profile.interfaceLanguage] || SUPPORTED_LANGUAGES.en;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('decks')}
              className="flex items-center gap-2.5 sm:gap-3 group text-left transition"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-md shadow-indigo-900/40 ring-1 ring-slate-700/50 group-hover:scale-105 transition-transform">
                <img
                  src="/icon.svg"
                  alt="7ifd Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    7ifd
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    حِفظ
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide hidden lg:inline">
                  {t('appTagline')}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setCurrentTab('decks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'decks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('myLearning')}</span>
            </button>

            <button
              onClick={() => setCurrentTab('practice')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{t('practice')}</span>
            </button>

            <button
              onClick={() => setCurrentTab('explore')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t('explore')}</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('profile')}</span>
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Quick Manual Save Button */}
            <button
              onClick={handleManualSave}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                justSaved
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
              title="Save all cards, decks, and reviews"
            >
              {justSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save</span>
                </>
              )}
            </button>

            {/* Streak Counter */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold"
              title={`${profile.streak} ${t('streak')}`}
            >
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{profile.streak}</span>
            </div>

            {/* Audio Mode Switcher */}
            <button
              onClick={toggleVoiceMode}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
                profile.preferredVoice === 'gemini'
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300'
              }`}
              title={
                profile.preferredVoice === 'gemini'
                  ? 'Voice: Gemini 3.8 Flash TTS (AI)'
                  : 'Voice: Native Device Speech (Offline)'
              }
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{profile.preferredVoice === 'gemini' ? 'Gemini TTS' : 'Device TTS'}</span>
            </button>

            {/* 11-Languages Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition"
                title="Change Interface Language"
              >
                <span>{currentLangMeta.flag}</span>
                <span className="hidden sm:inline">{currentLangMeta.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-700 p-1.5 shadow-2xl z-50 max-h-72 overflow-y-auto">
                    <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Interface Language
                    </span>
                    {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                          profile.interfaceLanguage === lang.code
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </div>
                        {profile.interfaceLanguage === lang.code && (
                          <span className="text-[10px]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Free Account / Sign In Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                profile.isGuest
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {profile.isGuest ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">{t('freeSignIn')}</span>
                  <span className="sm:hidden">Sign In</span>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{profile.avatarUrl || '🦉'}</span>
                  <span className="hidden sm:inline max-w-[90px] truncate">{profile.displayName}</span>
                </div>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden border-t border-slate-800 bg-slate-900/95 fixed bottom-0 left-0 right-0 z-30 px-6 py-2.5 flex items-center justify-around shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setCurrentTab('decks')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            currentTab === 'decks' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>{t('myLearning')}</span>
        </button>

        <button
          onClick={() => setCurrentTab('practice')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            currentTab === 'practice' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 text-amber-400" />
          <span>{t('practice')}</span>
        </button>

        <button
          onClick={() => setCurrentTab('explore')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            currentTab === 'explore' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>{t('explore')}</span>
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
            currentTab === 'profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>{t('profile')}</span>
        </button>
      </div>
    </header>
  );
};
