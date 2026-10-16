import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { useApp } from '../context/AppContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { profile } = useApp();
  const isAr = profile.interfaceLanguage === 'ar';

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-blue-700 active:scale-95 transition-all"
        title={isAr ? 'تثبيت تطبيق 7ifd على جهازك' : 'Install 7ifd application'}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isAr ? 'تثبيت التطبيق' : 'Install PWA'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isAr ? 'تثبيت على iOS' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? 'تثبيت 7ifd على iPhone / iPad' : 'Install 7ifd on iPhone / iPad'}
              </h3>

              <div className="space-y-3 text-sm text-slate-300 mb-5">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">1.</span>
                  <span>
                    {isAr
                      ? 'اضغط على زر المشاركة (Share) في شريط Safari أسفل الشاشة.'
                      : 'Tap the Share icon in the Safari navigation bar.'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">2.</span>
                  <span>
                    {isAr
                      ? 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                      : 'Scroll down and tap "Add to Home Screen".'}
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-indigo-400">3.</span>
                  <span>
                    {isAr
                      ? 'استمتع بتجربة تطبيق كاملة وسريعة تعمل بدون إنترنت!'
                      : 'Enjoy a native app experience that works 100% offline!'}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-sm transition"
              >
                {isAr ? 'فهمت ذلك' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
