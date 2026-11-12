import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Smartphone, Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Android Chrome / Chromium flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#14B8A6] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 border border-[#14B8A6]/30 rounded-md transition-colors cursor-pointer"
        title="Installer l'application sur votre écran d'accueil Android"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installer l'App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-neutral-300 bg-[#1A2230] hover:bg-[#253042] border border-[#2B374C] rounded-md transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer sur iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#0E1118] border border-[#222938] p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Installer CRHIMASTIANO sur iPhone</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                1. Appuyez sur le bouton <strong>Partager</strong> (icône avec flèche vers le haut dans Safari).<br />
                2. Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong>.<br />
                3. Profitez du plein écran et des performances studio complètes.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-[#D4AF37] text-black font-bold text-xs rounded-lg cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
