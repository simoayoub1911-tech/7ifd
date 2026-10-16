import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { DecksScreen } from './features/decks/DecksScreen';
import { ExploreScreen } from './features/explore/ExploreScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { PracticeScreen } from './features/practice/PracticeScreen';
import { DeckEditorModal } from './components/DeckEditorModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Loader2 } from 'lucide-react';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<'decks' | 'practice' | 'explore' | 'profile'>('decks');
  const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
  const { isLoading, createDeck, isAuthModalOpen, setIsAuthModalOpen } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center text-slate-100">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-xl shadow-indigo-900/40 animate-pulse">
          <img src="/icon.svg" alt="7ifd Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading 7ifd offline vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header & Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenNewDeck={() => setIsNewDeckModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-20 md:pb-12">
        {currentTab === 'decks' && (
          <DecksScreen
            onOpenNewDeck={() => setIsNewDeckModalOpen(true)}
            onExploreClick={() => setCurrentTab('explore')}
            onPracticeClick={() => setCurrentTab('practice')}
          />
        )}
        {currentTab === 'practice' && <PracticeScreen />}
        {currentTab === 'explore' && <ExploreScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Global Deck Creator Modal */}
      {isNewDeckModalOpen && (
        <DeckEditorModal
          onSave={async (deckData) => {
            await createDeck(deckData);
            setIsNewDeckModalOpen(false);
          }}
          onClose={() => setIsNewDeckModalOpen(false)}
        />
      )}

      {/* Free Sign In & Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Persistent Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
