import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { Play, Volume2 } from 'lucide-react';

export const AudioInterruptionBanner: React.FC = () => {
  const { isAudioInterrupted, resumeAudio } = useStudio();

  if (!isAudioInterrupted) return null;

  return (
    <aside aria-label="Alerte audio système" className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-300 text-xs flex items-center justify-between gap-3 z-30 sticky top-0">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span>
          <strong>Audio en pause suite à une interruption système</strong> (appel, notification ou mise en veille Android).
        </span>
      </div>
      <button
        onClick={resumeAudio}
        className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded shadow transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
      >
        <Play className="w-3 h-3 fill-current" />
        <span>Réactiver le Moteur Audio</span>
      </button>
    </aside>
  );
};
